"""
---
title: Tavus Avatar
category: avatars
tags: [avatar, openai, deepgram, tavus]
difficulty: intermediate
description: Shows how to create a tavus avatar that can help a user learn about the Fall of the Roman Empire using flash cards and quizzes.
demonstrates:
  - Creating a new tavus avatar session
  - Using RPC to send messages to the client for flash cards and quizzes using `perform_rpc`
  - Using `register_rpc_method` to register the RPC methods so that the agent can receive messages from the client
  - Using UserData to store state for the cards and the quizzes
  - Using custom data classes to represent the flash cards and quizzes
---
"""
import logging
import json
import uuid
import os
import aiohttp
import urllib.parse
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, List, TypedDict
from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli, RoomOutputOptions, ToolError
from livekit.agents.llm import function_tool, ChatContext, ChatRole
from livekit.agents.voice import Agent, AgentSession, RunContext
from livekit.plugins import silero, tavus, elevenlabs
import asyncio

# Load .env file from parent directory (as specified in README)
load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env', override=True)

logger = logging.getLogger("avatar")
logger.setLevel(logging.INFO)

# Verify ElevenLabs API key
# The plugin accepts both ELEVEN_API_KEY and ELEVENLABS_API_KEY
eleven_api_key = os.getenv("ELEVEN_API_KEY") or os.getenv("ELEVENLABS_API_KEY")
if not eleven_api_key:
    logger.warning("ELEVEN_API_KEY or ELEVENLABS_API_KEY not found. ElevenLabs TTS may not work.")
else:
    logger.info("ElevenLabs API key found.")

class QuizAnswerDict(TypedDict):
    text: str
    is_correct: bool

class QuizQuestionDict(TypedDict):
    text: str
    answers: List[QuizAnswerDict]

@dataclass
class FlashCard:
    """Class to represent a flash card."""
    id: str
    question: str
    answer: str
    is_flipped: bool = False

@dataclass
class QuizAnswer:
    """Class to represent a quiz answer option."""
    id: str
    text: str
    is_correct: bool

@dataclass
class QuizQuestion:
    """Class to represent a quiz question."""
    id: str
    text: str
    answers: List[QuizAnswer]

@dataclass
class Quiz:
    """Class to represent a quiz."""
    id: str
    questions: List[QuizQuestion]

@dataclass
class Product:
    """Class to represent a product in the wishlist."""
    id: str
    title: str
    description: str
    price: float
    image: str
    category: str

@dataclass
class Letter:
    """Class to represent a letter to Santa."""
    id: str
    recipient: str
    content: str
    created_at: str

@dataclass
class UserData:
    """Class to store user data during a session."""
    ctx: Optional[JobContext] = None
    flash_cards: List[FlashCard] = field(default_factory=list)
    quizzes: List[Quiz] = field(default_factory=list)
    wishlist: List[Product] = field(default_factory=list)
    letter: Optional[Letter] = None

    def reset(self) -> None:
        """Reset session data."""
        # Keep flash cards and quizzes intact

    def add_flash_card(self, question: str, answer: str) -> FlashCard:
        """Add a new flash card to the collection."""
        card = FlashCard(
            id=str(uuid.uuid4()),
            question=question,
            answer=answer
        )
        self.flash_cards.append(card)
        return card

    def get_flash_card(self, card_id: str) -> Optional[FlashCard]:
        """Get a flash card by ID."""
        for card in self.flash_cards:
            if card.id == card_id:
                return card
        return None

    def flip_flash_card(self, card_id: str) -> Optional[FlashCard]:
        """Flip a flash card by ID."""
        card = self.get_flash_card(card_id)
        if card:
            card.is_flipped = not card.is_flipped
            return card
        return None

    def add_quiz(self, questions: List[QuizQuestionDict]) -> Quiz:
        """Add a new quiz to the collection."""
        quiz_questions = []
        for q in questions:
            answers = []
            for a in q["answers"]:
                answers.append(QuizAnswer(
                    id=str(uuid.uuid4()),
                    text=a["text"],
                    is_correct=a["is_correct"]
                ))
            quiz_questions.append(QuizQuestion(
                id=str(uuid.uuid4()),
                text=q["text"],
                answers=answers
            ))

        quiz = Quiz(
            id=str(uuid.uuid4()),
            questions=quiz_questions
        )
        self.quizzes.append(quiz)
        return quiz

    def get_quiz(self, quiz_id: str) -> Optional[Quiz]:
        """Get a quiz by ID."""
        for quiz in self.quizzes:
            if quiz.id == quiz_id:
                return quiz
        return None

    def check_quiz_answers(self, quiz_id: str, user_answers: dict) -> List[tuple]:
        """Check user's quiz answers and return results."""
        quiz = self.get_quiz(quiz_id)
        if not quiz:
            return []

        results = []
        for question in quiz.questions:
            user_answer_id = user_answers.get(question.id)

            # Find the selected answer and the correct answer
            selected_answer = None
            correct_answer = None

            for answer in question.answers:
                if answer.id == user_answer_id:
                    selected_answer = answer
                if answer.is_correct:
                    correct_answer = answer

            is_correct = selected_answer and selected_answer.is_correct
            results.append((question, selected_answer, correct_answer, is_correct))

        return results

    def add_product(self, product_data: dict) -> Product:
        """Add a product to the wishlist."""
        product = Product(
            id=str(uuid.uuid4()),
            title=product_data.get("title", ""),
            description=product_data.get("description", ""),
            price=product_data.get("price", 0.0),
            image=product_data.get("thumbnail", "") or (product_data.get("images", [""])[0] if product_data.get("images") else ""),
            category=product_data.get("category", "")
        )
        self.wishlist.append(product)
        return product

    def set_letter(self, recipient: str, content: str) -> Letter:
        """Create or update the letter."""
        from datetime import datetime
        if self.letter:
            # Update existing letter
            self.letter.recipient = recipient
            self.letter.content = content
        else:
            # Create new letter
            self.letter = Letter(
                id=str(uuid.uuid4()),
                recipient=recipient,
                content=content,
                created_at=datetime.now().isoformat()
            )
        return self.letter

class AvatarAgent(Agent):
    def __init__(self) -> None:
        # Try to load Silero VAD, but make it optional if it fails
        vad_instance = None
        try:
            vad_instance = silero.VAD.load()
            logger.info("Silero VAD loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load Silero VAD: {e}. Continuing without VAD.")
            vad_instance = None
        
        super().__init__(
            instructions="""
                You are Santa Claus! Ho ho ho! You're a jolly, kind, and magical Christmas figure who loves to help children and adults with their Christmas wishlists.

                Your personality:
                    • You're warm, friendly, and full of Christmas spirit
                    • You speak with enthusiasm and joy, using phrases like "Ho ho ho!" naturally
                    • You're patient and understanding with everyone
                    • You love hearing about what people want for Christmas
                    • You're excited to help add gifts to their wishlist

                Your primary responsibilities:
                    • Listen to what gifts people want for Christmas
                    • When someone asks for a gift, use the add_gift_to_wishlist function to search for and add it to their wishlist
                    • Be enthusiastic and confirm when you've added a gift: "Ho ho ho! I've added [gift name] to your wishlist!"
                    • Ask follow-up questions about gifts if needed (color, size, brand, etc.) to find the best match
                    • Keep the conversation light, fun, and Christmas-themed

                WISHLIST FEATURE:
                When someone asks for a gift, you should use the add_gift_to_wishlist function to search for and add it to their wishlist.
                
                IMPORTANT - How to extract gift names:
                - Extract the main product name from the user's request
                - Remove articles (a, an, the) and common words (for, my, etc.)
                - Use the core product name
                - Examples:
                  * "I want a new iPhone for my father" → "iPhone" (not "new iPhone for my father")
                  * "Can I have AirPods?" → "AirPods"
                  * "I'd like a gaming laptop" → "laptop" or "gaming laptop"
                  * "I want a webcam for my computer" → "webcam" (not "webcam for my computer")
                  * "I need a new car" → "car" (not "new car")
                
                If the function can't find the exact product, it will try to find something similar. 
                If nothing is found, apologize and suggest they try a different item or be more specific.
                Common items that work well: iPhone, laptop, headphones, watch, camera, phone, tablet, etc.

                After adding a gift, be enthusiastic and confirm it. You can ask if they want to add more gifts.

                LETTER FEATURE:
                You can help users create a letter to someone (like their family, friends, etc.) that includes their wishlist items.
                When someone asks you to create a letter (e.g., "Santa, help me create a letter for my dad telling him I love him and bringing these gifts: [list]"),
                use the create_letter function with:
                - recipient: The person the letter is for (e.g., "my dad", "Mom", "my friend")
                - message: The main message they want to convey (e.g., "I love you very much")

                The function will automatically include all the gifts from their wishlist in the letter.

                You can also edit the letter using the edit_letter function when they ask to:
                - Add content: "Add that your wife is missing him a lot", "Add that I'm excited to see them"
                - Change specific parts: "Change the greeting to be more formal"
                - Modify content: "Make it more personal", "Add more emotion"
                - Update gifts: "Add the new gift I just added to the wishlist", "Include all my gifts in the letter"

                IMPORTANT: When the user asks to add gifts to the letter or update the letter with gifts, always include ALL gifts from their wishlist in the letter. The edit_letter function will automatically include all wishlist items.

                When editing, be specific about what needs to change. The edit_letter function will rewrite the entire letter with your changes, always including all gifts from the wishlist.
                Keep the letter warm, personal, and Christmas-themed. Always end with Santa's signature.

                PDF EXPORT FEATURE:
                Users can download their letter as a PDF file. When they ask you to download, export, or save the letter as PDF, use the download_letter_pdf function.
                This will automatically trigger the download of the letter as a PDF file on their device.

                PRODUCT RECOMMENDATIONS FEATURE:
                You can recommend similar products based on what the user already has in their wishlist. When they ask for recommendations, similar products, or suggestions, use the recommend_similar_products function.
                This will analyze their current wishlist and suggest complementary or similar items they might also like.

                ROCK, PAPER, SCISSORS GAME FEATURE:
                You can play Rock, Paper, Scissors with the user! When they ask to play (e.g., "I want to play Rock, Paper and Scissors with you"),
                use the start_rock_paper_scissors function to open the game modal on the left side.
                During the game, be enthusiastic and comment on the results! Celebrate wins, console losses, and encourage playing again.
                Keep the conversation fun and Christmas-themed during the game.

                Keep your speaking turns short and natural, just like a friendly conversation. 
                Use your "Ho ho ho!" laugh naturally when appropriate, but don't overuse it.

                Start the interaction with a warm Christmas greeting and let them know you can help them write a letter to someone special or play a fun game of Rock, Paper, Scissors! Ask what they'd like to do today!
            """,
            stt="assemblyai/universal-streaming",
            llm="openai/gpt-4.1-mini",
            tts=elevenlabs.TTS(
                voice_id="21m00Tcm4TlvDq8ikWAM",
                api_key=eleven_api_key  # Pass API key explicitly
            ) if eleven_api_key else elevenlabs.TTS(
                voice_id="21m00Tcm4TlvDq8ikWAM"
            ),
            vad=vad_instance,
        )

    @function_tool
    async def create_flash_card(self, context: RunContext[UserData], question: str, answer: str):
        """Create a new flash card and display it to the user.

        Args:
            question: The question or front side of the flash card
            answer: The answer or back side of the flash card
        """
        userdata = context.userdata
        card = userdata.add_flash_card(question, answer)

        # Get the room from the userdata
        if not userdata.ctx or not userdata.ctx.room:
            return f"Created a flash card, but couldn't access the room to send it."

        room = userdata.ctx.room

        # Get the first participant in the room (should be the client)
        participants = room.remote_participants
        if not participants:
            return f"Created a flash card, but no participants found to send it to."

        # Get the first participant from the dictionary of remote participants
        participant = next(iter(participants.values()), None)
        if not participant:
            return f"Created a flash card, but couldn't get the first participant."
        payload = {
            "action": "show",
            "id": card.id,
            "question": card.question,
            "answer": card.answer,
            "index": len(userdata.flash_cards) - 1
        }

        # Make sure payload is properly serialized
        json_payload = json.dumps(payload)
        logger.info(f"Sending flash card payload: {json_payload}")
        await room.local_participant.perform_rpc(
            destination_identity=participant.identity,
            method="client.flashcard",
            payload=json_payload
        )

        return f"I've created a flash card with the question: '{question}'"

    @function_tool
    async def flip_flash_card(self, context: RunContext[UserData], card_id: str):
        """Flip a flash card to show the answer or question.

        Args:
            card_id: The ID of the flash card to flip
        """
        userdata = context.userdata
        card = userdata.flip_flash_card(card_id)

        if not card:
            return f"Flash card with ID {card_id} not found."

        # Get the room from the userdata
        if not userdata.ctx or not userdata.ctx.room:
            return f"Flipped the flash card, but couldn't access the room to send it."

        room = userdata.ctx.room

        # Get the first participant in the room (should be the client)
        participants = room.remote_participants
        if not participants:
            return f"Flipped the flash card, but no participants found to send it to."

        # Get the first participant from the dictionary of remote participants
        participant = next(iter(participants.values()), None)
        if not participant:
            return f"Flipped the flash card, but couldn't get the first participant."
        payload = {
            "action": "flip",
            "id": card.id
        }

        # Make sure payload is properly serialized
        json_payload = json.dumps(payload)
        logger.info(f"Sending flip card payload: {json_payload}")
        await room.local_participant.perform_rpc(
            destination_identity=participant.identity,
            method="client.flashcard",
            payload=json_payload
        )

        return f"I've flipped the flash card to show the {'answer' if card.is_flipped else 'question'}"

    @function_tool
    async def create_quiz(self, context: RunContext[UserData], questions: List[QuizQuestionDict]):
        """Create a new quiz with multiple choice questions and display it to the user.

        Args:
            questions: A list of question objects. Each question object should have:
                - text: The question text
                - answers: A list of answer objects, each with:
                    - text: The answer text
                    - is_correct: Boolean indicating if this is the correct answer
        """
        userdata = context.userdata
        quiz = userdata.add_quiz(questions)

        # Get the room from the userdata
        if not userdata.ctx or not userdata.ctx.room:
            return f"Created a quiz, but couldn't access the room to send it."

        room = userdata.ctx.room

        # Get the first participant in the room (should be the client)
        participants = room.remote_participants
        if not participants:
            return f"Created a quiz, but no participants found to send it to."

        # Get the first participant from the dictionary of remote participants
        participant = next(iter(participants.values()), None)
        if not participant:
            return f"Created a quiz, but couldn't get the first participant."

        # Format questions for client
        client_questions = []
        for q in quiz.questions:
            client_answers = []
            for a in q.answers:
                client_answers.append({
                    "id": a.id,
                    "text": a.text
                })
            client_questions.append({
                "id": q.id,
                "text": q.text,
                "answers": client_answers
            })

        payload = {
            "action": "show",
            "id": quiz.id,
            "questions": client_questions
        }

        # Make sure payload is properly serialized
        json_payload = json.dumps(payload)
        logger.info(f"Sending quiz payload: {json_payload}")
        await room.local_participant.perform_rpc(
            destination_identity=participant.identity,
            method="client.quiz",
            payload=json_payload
        )

        return f"I've created a quiz with {len(questions)} questions. Please answer them when you're ready."

    @function_tool
    async def add_gift_to_wishlist(self, context: RunContext[UserData], gift_name: str):
        """Add a gift to Santa's wishlist by searching for a similar product.
        
        When a user asks for a gift, search for a similar product using the DummyJSON API
        and add it to their wishlist. The product will appear in the wishlist section below.
        
        Args:
            gift_name: The name or description of the gift the user wants (e.g., "AirPods", "iPhone", "laptop")
        """
        userdata = context.userdata
        
        # Get the room from the userdata
        if not userdata.ctx or not userdata.ctx.room:
            raise ToolError("Couldn't access the room to add the gift.")
        
        room = userdata.ctx.room
        
        # Get the first participant in the room (should be the client)
        participants = room.remote_participants
        if not participants:
            raise ToolError("No participants found to send the gift to.")
        
        participant = next(iter(participants.values()), None)
        if not participant:
            raise ToolError("Couldn't get the first participant.")
        
        try:
            # Search for products using DummyJSON API
            # Try multiple search variations to find a product
            search_terms = [
                gift_name,  # Original term
                gift_name.lower(),  # Lowercase
                gift_name.replace(" ", "-"),  # With hyphens
                gift_name.replace(" ", ""),  # No spaces
            ]
            
            # Map gift names to DummyJSON categories
            # Based on available categories: beauty, fragrances, furniture, groceries, home-decoration, 
            # kitchen-accessories, laptops, mens-shirts, mens-shoes, mens-watches, mobile-accessories,
            # motorcycle, skin-care, smartphones, sports-accessories, sunglasses, tablets, tops,
            # vehicle, womens-bags, womens-dresses, womens-jewellery, womens-shoes, womens-watches
            category_mappings = {
                "webcam": "mobile-accessories",
                "camera": "mobile-accessories",
                "car": "vehicle",
                "vehicle": "vehicle",
                "phone": "smartphones",
                "iphone": "smartphones",
                "smartphone": "smartphones",
                "laptop": "laptops",
                "computer": "laptops",
                "watch": "mens-watches",
                "wristwatch": "mens-watches",
                "headphones": "mobile-accessories",
                "earbuds": "mobile-accessories",
                "airpods": "mobile-accessories",
                "tablet": "tablets",
                "bicycle": "sports-accessories",
                "bike": "sports-accessories",
                "sunglasses": "sunglasses",
                "glasses": "sunglasses",
                "bag": "womens-bags",
                "handbag": "womens-bags",
                "furniture": "furniture",
                "chair": "furniture",
                "sofa": "furniture",
                "perfume": "fragrances",
                "cologne": "fragrances",
            }
            
            categories_to_try = []
            for key, category in category_mappings.items():
                if key.lower() in gift_name.lower():
                    categories_to_try.append(category)
                    search_terms.append(key)
                    break
            
            product_data = None
            async with aiohttp.ClientSession() as session:
                for search_term in search_terms:
                    try:
                        # URL encode the search term
                        encoded_term = urllib.parse.quote(search_term)
                        search_url = f"https://dummyjson.com/products/search?q={encoded_term}&limit=5"
                        
                        async with session.get(search_url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                            if response.status != 200:
                                continue
                            
                            data = await response.json()
                            products = data.get("products", [])
                            
                            if products:
                                # Try to find the best match
                                # Prefer products with the search term in the title
                                best_match = None
                                for product in products:
                                    title_lower = product.get("title", "").lower()
                                    if search_term.lower() in title_lower:
                                        best_match = product
                                        break
                                
                                # If no exact match, use the first product
                                product_data = best_match or products[0]
                                logger.info(f"Found product using search term: '{search_term}'")
                                break
                    except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                        logger.warning(f"Error searching with term '{search_term}': {e}")
                        continue
                
                # Try searching by category if we have a category mapping
                if not product_data and categories_to_try:
                    for category in categories_to_try:
                        try:
                            category_url = f"https://dummyjson.com/products/category/{category}"
                            async with session.get(category_url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                                if response.status == 200:
                                    data = await response.json()
                                    category_products = data.get("products", [])
                                    if category_products:
                                        # Get the first product from the category
                                        product_data = category_products[0]
                                        logger.info(f"Found product from category '{category}': {product_data.get('title')}")
                                        break
                        except Exception as e:
                            logger.warning(f"Error searching category '{category}': {e}")
                            continue
                
                # Last resort: try getting products from general list if nothing found yet
                if not product_data:
                    try:
                        # Try to get products from a general category
                        category_url = "https://dummyjson.com/products?limit=100"
                        async with session.get(category_url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                            if response.status == 200:
                                data = await response.json()
                                all_products = data.get("products", [])
                                if all_products:
                                    # Try to find something related in title or description
                                    for product in all_products:
                                        title = product.get("title", "").lower()
                                        description = product.get("description", "").lower()
                                        category = product.get("category", "").lower()
                                        
                                        # Check if any search term matches
                                        for term in search_terms[:3]:
                                            if (term.lower() in title or 
                                                term.lower() in description or 
                                                term.lower() in category):
                                                product_data = product
                                                logger.info(f"Found related product: {product.get('title')}")
                                                break
                                        
                                        if product_data:
                                            break
                                    
                                    # If still no match, just pick a random product as fallback
                                    if not product_data and all_products:
                                        product_data = all_products[0]
                                        logger.info(f"Using fallback product: {product_data.get('title')}")
                    except Exception as e:
                        logger.warning(f"Error in fallback search: {e}")
            
            # Add product to wishlist (this runs after finding a product, outside the session context)
            if product_data:
                product = userdata.add_product(product_data)
                
                # Format description for display (split into 3 parts if needed)
                description = product_data.get("description", "")
                # Split description into parts for display
                words = description.split()
                part_length = len(words) // 3
                description1 = " ".join(words[:part_length]) if part_length > 0 else description[:50]
                description2 = " ".join(words[part_length:part_length*2]) if part_length > 0 else ""
                description3 = " ".join(words[part_length*2:]) if part_length > 0 else ""
                
                # If description is short, just use it as description1
                if len(words) < 10:
                    description1 = description
                    description2 = ""
                    description3 = ""
                
                # Send product to frontend via RPC
                payload = {
                    "action": "add",
                    "product": {
                        "id": product.id,
                        "title": product.title,
                        "description1": description1,
                        "description2": description2,
                        "description3": description3,
                        "image": product.image,
                        "price": product.price,
                        "category": product.category
                    }
                }
                
                json_payload = json.dumps(payload)
                total_items = len(userdata.wishlist)
                logger.info(f"Sending product to wishlist ({total_items} items total): {json_payload}")
                try:
                    await room.local_participant.perform_rpc(
                        destination_identity=participant.identity,
                        method="client.addToWishlist",
                        payload=json_payload
                    )
                except Exception as rpc_error:
                    logger.warning(f"RPC call failed but continuing: {rpc_error}")
                    # Continue even if RPC fails - the product is still added to wishlist
                
                return f"I've added {product.title} to your wishlist! Ho ho ho! You now have {total_items} item{'s' if total_items > 1 else ''} in your wishlist."
            else:
                raise ToolError(f"I couldn't find '{gift_name}' in my catalog. Could you try asking for something else? For example: iPhone, laptop, headphones, watch, or other common items.")
                    
        except ToolError:
            # Re-raise ToolError as-is (don't wrap it)
            raise
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            logger.error(f"Error fetching product from API: {e}")
            raise ToolError(f"I'm having trouble connecting to my gift catalog right now. Could you try again in a moment?")
        except Exception as e:
            logger.error(f"Error adding gift to wishlist: {e}")
            raise ToolError(f"Something unexpected happened while adding the gift. Please try again or ask for a different item.")

    @function_tool
    async def create_letter(self, context: RunContext[UserData], recipient: str, message: str):
        """Create a letter to someone that includes the wishlist items.
        
        Args:
            recipient: The person the letter is for (e.g., "my dad", "Mom", "my friend")
            message: The message to include in the letter
        """
        userdata = context.userdata
        
        if not userdata.ctx or not userdata.ctx.room:
            raise ToolError("Couldn't access the room to create the letter.")
        
        room = userdata.ctx.room
        participants = room.remote_participants
        if not participants:
            raise ToolError("No participants found to send the letter to.")
        
        participant = next(iter(participants.values()), None)
        if not participant:
            raise ToolError("Couldn't get the first participant.")
        
        try:
            # Get wishlist items
            wishlist_items = [product.title for product in userdata.wishlist]
            
            # Generate letter content with a natural, warm tone (without listing products in text)
            letter_content = f"Dear {recipient},\n\n"
            letter_content += f"{message}\n\n"
            
            # Add introduction for products if there are any
            if wishlist_items:
                letter_content += "I'm bringing you these wonderful gifts:\n\n"
                letter_content += "[PRODUCTS]\n\n"
            
            letter_content += "I hope you have a magical Christmas filled with joy, love, and happiness!\n\n"
            letter_content += "With lots of love and Christmas cheer,\n"
            letter_content += "Santa Claus\n"
            letter_content += "🎅🎄🎁"
            
            # Save letter
            letter = userdata.set_letter(recipient, letter_content)
            
            # Prepare products data for frontend
            products_data = []
            for product in userdata.wishlist:
                description = product.description or ""
                words = description.split()
                part_length = len(words) // 3
                description1 = " ".join(words[:part_length]) if part_length > 0 else description[:50]
                description2 = " ".join(words[part_length:part_length*2]) if part_length > 0 else ""
                description3 = " ".join(words[part_length*2:]) if part_length > 0 else ""
                
                if len(words) < 10:
                    description1 = description
                    description2 = ""
                    description3 = ""
                
                products_data.append({
                    "id": product.id,
                    "title": product.title,
                    "description1": description1,
                    "description2": description2,
                    "description3": description3,
                    "image": product.image,
                    "price": product.price,
                    "category": product.category
                })
            
            # Send to frontend
            payload = {
                "action": "show",
                "letter": {
                    "id": letter.id,
                    "recipient": letter.recipient,
                    "content": letter.content,
                    "products": products_data
                }
            }
            
            json_payload = json.dumps(payload)
            logger.info(f"Sending letter to frontend. Letter content length: {len(letter_content)} characters")
            logger.info(f"Letter recipient: {recipient}")
            logger.info(f"RPC method: client.showLetter, participant: {participant.identity}")
            
            try:
                await room.local_participant.perform_rpc(
                    destination_identity=participant.identity,
                    method="client.showLetter",
                    payload=json_payload
                )
                logger.info("Letter sent successfully to frontend")
            except Exception as rpc_error:
                logger.error(f"Error sending letter via RPC: {rpc_error}")
                # Don't fail the entire operation if RPC fails - the letter is still created
                logger.warning("Continuing despite RPC error - letter was created successfully")
            
            return f"I've created a beautiful letter for {recipient}! Ho ho ho! You can see it on the right side of the screen."
            
        except ToolError:
            raise
        except Exception as e:
            logger.error(f"Error creating letter: {e}", exc_info=True)
            raise ToolError(f"Something went wrong while creating the letter. Please try again.")

    @function_tool
    async def edit_letter(self, context: RunContext[UserData], instructions: str):
        """Edit the existing letter based on user instructions.
        
        Args:
            instructions: What changes to make (e.g., "Change the greeting", "Add a new gift", "Make it more personal")
        """
        userdata = context.userdata
        
        if not userdata.letter:
            raise ToolError("There's no letter to edit. Please create a letter first using create_letter.")
        
        if not userdata.ctx or not userdata.ctx.room:
            raise ToolError("Couldn't access the room to edit the letter.")
        
        room = userdata.ctx.room
        participants = room.remote_participants
        if not participants:
            raise ToolError("No participants found to send the letter to.")
        
        participant = next(iter(participants.values()), None)
        if not participant:
            raise ToolError("Couldn't get the first participant.")
        
        try:
            # Get current letter
            current_letter = userdata.letter
            
            # Extract the main message from the current letter (between "Dear X," and "I'm bringing" or "I hope you have")
            current_content = current_letter.content
            lines = current_content.split("\n")
            
            # Find the main message part (before "I'm bringing" or "I hope you have")
            message_parts = []
            for line in lines:
                line_stripped = line.strip()
                if line_stripped.startswith("Dear"):
                    continue
                elif line_stripped.startswith("I'm bringing") or line_stripped.startswith("I hope you have") or line_stripped.startswith("With lots") or line_stripped.startswith("Santa Claus") or "🎅" in line_stripped or "[PRODUCTS]" in line_stripped:
                    break
                elif line_stripped:
                    message_parts.append(line_stripped)
            
            # Get the existing message (clean, without products marker)
            existing_message = "\n".join(message_parts).strip()
            
            # Parse instructions to update the message
            instructions_lower = instructions.lower()
            
            # Check if user wants to add/update gifts (don't modify message, just products)
            is_gift_update = (
                "gift" in instructions_lower or 
                "product" in instructions_lower or 
                "regalo" in instructions_lower or 
                "wishlist" in instructions_lower or
                "item" in instructions_lower
            )
            
            # If it's about gifts, don't modify the message - products will be updated automatically
            # Only modify message if it's about content, not gifts
            if not is_gift_update:
                # Check if user wants to add content to the message
                if "add" in instructions_lower:
                    # Extract what to add from instructions
                    content_to_add = ""
                    
                    # Look for "that" which usually indicates what to add
                    if "that" in instructions_lower:
                        parts = instructions.split("that", 1)
                        if len(parts) > 1:
                            content_to_add = parts[1].strip()
                            # Clean up common phrases at the end
                            content_to_add = content_to_add.replace(", make it warm and heartfelt", "").strip()
                            content_to_add = content_to_add.replace(", make it heartfelt", "").strip()
                            content_to_add = content_to_add.replace(", make it warm", "").strip()
                    elif ":" in instructions:
                        parts = instructions.split(":", 1)
                        if len(parts) > 1:
                            content_to_add = parts[1].strip()
                    else:
                        # Extract content after "add" and before common phrases
                        content_to_add = instructions
                        # Remove "add" at the beginning
                        if instructions_lower.startswith("add"):
                            content_to_add = instructions[3:].strip()
                        # Remove common phrases
                        content_to_add = content_to_add.replace("in the letter", "").replace("to the letter", "").strip()
                        content_to_add = content_to_add.replace("that", "").strip()
                        # Remove leading "that" if present
                        if content_to_add.startswith("that"):
                            content_to_add = content_to_add[4:].strip()
                    
                    # Clean up the content
                    content_to_add = content_to_add.strip()
                    # Remove trailing commas and periods from common phrases
                    if content_to_add.endswith(","):
                        content_to_add = content_to_add[:-1].strip()
                    
                    # Add to message
                    if content_to_add:
                        if existing_message:
                            existing_message = f"{existing_message}\n\n{content_to_add}"
                        else:
                            existing_message = content_to_add
                
                # Check if user wants to change content
                elif "change" in instructions_lower or "modify" in instructions_lower or "update" in instructions_lower:
                    # For changes, we'll replace parts of the message
                    # This is a simplified version - ideally we'd use LLM for this
                    if existing_message:
                        # Try to extract what to change
                        # For now, just append the change instruction as new content
                        parts = instructions.split("to", 1)
                        if len(parts) > 1:
                            new_text = parts[1].strip()
                            existing_message = f"{existing_message}\n\n{new_text}"
            
            # Check if user wants to change content
            elif "change" in instructions_lower or "modify" in instructions_lower or "update" in instructions_lower:
                # For changes, we'll replace parts of the message
                # This is a simplified version - ideally we'd use LLM for this
                if existing_message:
                    # Try to extract what to change
                    # For now, just append the change instruction as new content
                    parts = instructions.split("to", 1)
                    if len(parts) > 1:
                        new_text = parts[1].strip()
                        existing_message = f"{existing_message}\n\n{new_text}"
            
            # Get current wishlist items for products data
            wishlist_items = [product for product in userdata.wishlist]
            
            # Build new letter content - only update the message part, keep structure
            new_content = f"Dear {current_letter.recipient},\n\n"
            new_content += f"{existing_message}\n\n"
            
            # Add products section if there are products
            if wishlist_items:
                new_content += "I'm bringing you these wonderful gifts:\n[PRODUCTS]\n\n"
            
            new_content += "I hope you have a magical Christmas filled with joy, love, and happiness!\n\n"
            new_content += "With lots of love and Christmas cheer,\n"
            new_content += "Santa Claus\n"
            new_content += "🎅🎄🎁"
            
            logger.info(f"Updated letter content. Message length: {len(existing_message)}, Gifts included: {len(wishlist_items)}")
            
            # Update letter
            letter = userdata.set_letter(current_letter.recipient, new_content)
            
            # Prepare products data for frontend
            products_data = []
            for product in wishlist_items:
                description = product.description or ""
                words = description.split()
                part_length = len(words) // 3
                description1 = " ".join(words[:part_length]) if part_length > 0 else description[:50]
                description2 = " ".join(words[part_length:part_length*2]) if part_length > 0 else ""
                description3 = " ".join(words[part_length*2:]) if part_length > 0 else ""
                
                if len(words) < 10:
                    description1 = description
                    description2 = ""
                    description3 = ""
                
                products_data.append({
                    "id": product.id,
                    "title": product.title,
                    "description1": description1,
                    "description2": description2,
                    "description3": description3,
                    "image": product.image,
                    "price": product.price,
                    "category": product.category
                })
            
            # Send updated letter to frontend with products
            payload = {
                "action": "update",
                "letter": {
                    "id": letter.id,
                    "recipient": letter.recipient,
                    "content": letter.content,
                    "products": products_data
                }
            }
            
            json_payload = json.dumps(payload)
            logger.info(f"Sending updated letter to frontend: {json_payload}")
            try:
                await room.local_participant.perform_rpc(
                    destination_identity=participant.identity,
                    method="client.showLetter",
                    payload=json_payload
                )
            except Exception as rpc_error:
                logger.warning(f"RPC call failed but continuing: {rpc_error}")
                # Continue even if RPC fails - the letter was still updated
            
            return f"I've updated the letter! Ho ho ho! The changes are now visible on the right side."
            
        except Exception as e:
            logger.error(f"Error editing letter: {e}")
            raise ToolError(f"Something went wrong while editing the letter. Please try again.")

    @function_tool
    async def download_letter_pdf(self, context: RunContext[UserData]):
        """Download the current letter as a PDF file.
        When the user asks you to download or export the letter as PDF, use this function.
        """
        userdata = context.userdata
        
        if not userdata.letter:
            raise ToolError("There's no letter to download. Please create a letter first using create_letter.")
        
        if not userdata.ctx or not userdata.ctx.room:
            raise ToolError("Couldn't access the room to download the letter.")
        
        room = userdata.ctx.room
        participants = room.remote_participants
        if not participants:
            raise ToolError("No participants found to send the download request to.")
        
        participant = next(iter(participants.values()), None)
        if not participant:
            raise ToolError("Couldn't get the first participant.")
        
        try:
            # Send RPC to frontend to trigger PDF download
            payload = {
                "action": "download_pdf"
            }
            
            json_payload = json.dumps(payload)
            logger.info("Sending PDF download request to frontend")
            try:
                await room.local_participant.perform_rpc(
                    destination_identity=participant.identity,
                    method="client.downloadLetterPDF",
                    payload=json_payload
                )
            except Exception as rpc_error:
                logger.warning(f"RPC call failed but continuing: {rpc_error}")
                # Continue even if RPC fails - user can still click the PDF button manually
            
            return "I've started downloading your letter as a PDF! Ho ho ho! It should start downloading in a moment."
            
        except Exception as e:
            logger.error(f"Error downloading letter PDF: {e}")
            raise ToolError(f"Something went wrong while downloading the letter. Please try again.")

    @function_tool
    async def recommend_similar_products(self, context: RunContext[UserData]):
        """Recommend similar products based on the items already in the wishlist.
        This will analyze the current wishlist items and suggest similar or complementary products.
        """
        userdata = context.userdata
        
        if not userdata.wishlist:
            raise ToolError("Your wishlist is empty! Add some gifts first, and then I can recommend similar products.")
        
        if not userdata.ctx or not userdata.ctx.room:
            raise ToolError("Couldn't access the room to send recommendations.")
        
        room = userdata.ctx.room
        participants = room.remote_participants
        if not participants:
            raise ToolError("No participants found to send recommendations to.")
        
        participant = next(iter(participants.values()), None)
        if not participant:
            raise ToolError("Couldn't get the first participant.")
        
        try:
            # Get categories from current wishlist
            categories = list(set([product.category for product in userdata.wishlist if product.category]))
            
            recommended_products = []
            
            async with aiohttp.ClientSession() as session:
                # Get products from similar categories
                for category in categories[:3]:  # Limit to 3 categories
                    try:
                        category_url = f"https://dummyjson.com/products/category/{category}?limit=5"
                        async with session.get(category_url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                            if response.status == 200:
                                data = await response.json()
                                products_in_category = data.get("products", [])
                                
                                # Filter out products already in wishlist
                                existing_titles = [p.title.lower() for p in userdata.wishlist]
                                for product in products_in_category:
                                    if product.get("title", "").lower() not in existing_titles:
                                        recommended_products.append(product)
                                        if len(recommended_products) >= 6:  # Limit to 6 recommendations
                                            break
                                
                                if len(recommended_products) >= 6:
                                    break
                    except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                        logger.warning(f"Error fetching category {category}: {e}")
                        continue
                
                # If we don't have enough recommendations, get some from general products
                if len(recommended_products) < 6:
                    try:
                        all_products_url = "https://dummyjson.com/products?limit=30"
                        async with session.get(all_products_url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                            if response.status == 200:
                                data = await response.json()
                                all_products = data.get("products", [])
                                existing_titles = [p.title.lower() for p in userdata.wishlist]
                                
                                for product in all_products:
                                    if product.get("title", "").lower() not in existing_titles:
                                        recommended_products.append(product)
                                        if len(recommended_products) >= 6:
                                            break
                    except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                        logger.warning(f"Error fetching general products: {e}")
            
            if not recommended_products:
                raise ToolError("I couldn't find similar products to recommend right now. Try again in a moment!")
            
            # Prepare products data for frontend
            products_data = []
            for product in recommended_products[:6]:  # Limit to 6
                description = product.get("description", "") or ""
                words = description.split()
                part_length = len(words) // 3
                description1 = " ".join(words[:part_length]) if part_length > 0 else description[:50]
                description2 = " ".join(words[part_length:part_length*2]) if part_length > 0 else ""
                description3 = " ".join(words[part_length*2:]) if part_length > 0 else ""
                
                if len(words) < 10:
                    description1 = description
                    description2 = ""
                    description3 = ""
                
                products_data.append({
                    "id": str(uuid.uuid4()),  # Generate new ID for recommendations
                    "title": product.get("title", ""),
                    "description1": description1,
                    "description2": description2,
                    "description3": description3,
                    "image": product.get("thumbnail", "") or (product.get("images", [""])[0] if product.get("images") else ""),
                    "price": product.get("price", 0.0),
                    "category": product.get("category", ""),
                    "isRecommendation": True
                })
            
            # Send recommendations to frontend
            payload = {
                "action": "show_recommendations",
                "products": products_data
            }
            
            json_payload = json.dumps(payload)
            logger.info(f"Sending {len(products_data)} recommendations to frontend")
            try:
                await room.local_participant.perform_rpc(
                    destination_identity=participant.identity,
                    method="client.showRecommendations",
                    payload=json_payload
                )
            except Exception as rpc_error:
                logger.warning(f"RPC call failed but continuing: {rpc_error}")
                # Continue even if RPC fails - recommendations were still generated
            
            product_names = ", ".join([p.get("title", "") for p in recommended_products[:3]])
            return f"Ho ho ho! I found {len(recommended_products)} similar products you might like! For example: {product_names}. You can see all my recommendations below your wishlist."
            
        except ToolError:
            raise
        except Exception as e:
            logger.error(f"Error recommending products: {e}")
            raise ToolError(f"Something went wrong while finding recommendations. Please try again.")

    @function_tool
    async def start_rock_paper_scissors(self, context: RunContext[UserData]):
        """Start a Rock, Paper, Scissors game with the user.
        When the user asks to play Rock, Paper, Scissors, use this function to open the game modal.
        """
        userdata = context.userdata
        
        if not userdata.ctx or not userdata.ctx.room:
            raise ToolError("Couldn't access the room to start the game.")
        
        room = userdata.ctx.room
        participants = room.remote_participants
        if not participants:
            raise ToolError("No participants found to start the game with.")
        
        participant = next(iter(participants.values()), None)
        if not participant:
            raise ToolError("Couldn't get the first participant.")
        
        try:
            # Send RPC to frontend to open the game
            payload = {
                "action": "show",
                "message": "Ho ho ho! Let's play Rock, Paper, Scissors! Choose your move!"
            }
            
            json_payload = json.dumps(payload)
            logger.info("Sending Rock, Paper, Scissors game request to frontend")
            try:
                await room.local_participant.perform_rpc(
                    destination_identity=participant.identity,
                    method="client.showRockPaperScissors",
                    payload=json_payload
                )
            except Exception as rpc_error:
                logger.warning(f"RPC call failed but continuing: {rpc_error}")
                # Continue even if RPC fails
            
            return "Ho ho ho! The game is ready! Choose rock, paper, or scissors on the left side!"
            
        except Exception as e:
            logger.error(f"Error starting Rock, Paper, Scissors game: {e}")
            raise ToolError(f"Something went wrong while starting the game. Please try again.")

    async def on_enter(self):
        await asyncio.sleep(5)
        self.session.generate_reply()

async def entrypoint(ctx: JobContext):
    agent = AvatarAgent()
    await ctx.connect()

    # Create a single AgentSession with userdata
    userdata = UserData(ctx=ctx)
    
    # Note: EnglishModel() causes AttributeError when used with current livekit version
    # The internal code tries to access .model and .provider attributes that don't exist
    # Using None for turn_detection will use default behavior
    session = AgentSession[UserData](
        userdata=userdata,
        turn_detection=None  # Disabled due to compatibility issues with EnglishModel
    )

    # Create the avatar session
    avatar = tavus.AvatarSession(
        replica_id=os.getenv("TAVUS_REPLICA_ID", "r9d30b0e55ac"),  
        persona_id="p28bd1d78e56"
    )

    # Register RPC method for flipping flash cards from client
    async def handle_flip_flash_card(rpc_data):
        try:
            logger.info(f"Received flash card flip payload: {rpc_data}")

            # Extract the payload from the RpcInvocationData object
            payload_str = rpc_data.payload
            logger.info(f"Extracted payload string: {payload_str}")

            # Parse the JSON payload
            payload_data = json.loads(payload_str)
            logger.info(f"Parsed payload data: {payload_data}")

            card_id = payload_data.get("id")

            if card_id:
                card = userdata.flip_flash_card(card_id)
                if card:
                    logger.info(f"Flipped flash card {card_id}, is_flipped: {card.is_flipped}")
                    # Send a message to the user via the agent, we're disabling this for now.
                    # session.generate_reply(user_input=(f"Please describe the {'answer' if card.is_flipped else 'question'}"))
                else:
                    logger.error(f"Card with ID {card_id} not found")
            else:
                logger.error("No card ID found in payload")

            return None
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error for payload '{rpc_data.payload}': {e}")
            return f"error: {str(e)}"
        except Exception as e:
            logger.error(f"Error handling flip flash card: {e}")
            return f"error: {str(e)}"

    # Register RPC method for handling quiz submissions
    async def handle_submit_quiz(rpc_data):
        try:
            logger.info(f"Received quiz submission payload: {rpc_data}")

            # Extract the payload from the RpcInvocationData object
            payload_str = rpc_data.payload
            logger.info(f"Extracted quiz submission string: {payload_str}")

            # Parse the JSON payload
            payload_data = json.loads(payload_str)
            logger.info(f"Parsed quiz submission data: {payload_data}")

            quiz_id = payload_data.get("id")
            user_answers = payload_data.get("answers", {})

            if not quiz_id:
                logger.error("No quiz ID found in payload")
                return "error: No quiz ID found in payload"

            # Check the quiz answers
            quiz_results = userdata.check_quiz_answers(quiz_id, user_answers)
            if not quiz_results:
                logger.error(f"Quiz with ID {quiz_id} not found")
                return "error: Quiz not found"

            # Count correct answers
            correct_count = sum(1 for _, _, _, is_correct in quiz_results if is_correct)
            total_count = len(quiz_results)

            # Create a verbal response for the agent to say
            result_summary = f"You got {correct_count} out of {total_count} questions correct."

            # Generate feedback for each question
            feedback_details = []
            for question, selected_answer, correct_answer, is_correct in quiz_results:
                if is_correct:
                    feedback = f"Question: {question.text}\nYour answer: {selected_answer.text} ✓ Correct!"
                else:
                    feedback = f"Question: {question.text}\nYour answer: {selected_answer.text if selected_answer else 'None'} ✗ Incorrect. The correct answer is: {correct_answer.text}"

                    # Create a flash card for incorrectly answered questions
                    card = userdata.add_flash_card(question.text, correct_answer.text)
                    participant = next(iter(ctx.room.remote_participants.values()), None)
                    if participant:
                        flash_payload = {
                            "action": "show",
                            "id": card.id,
                            "question": card.question,
                            "answer": card.answer,
                            "index": len(userdata.flash_cards) - 1
                        }
                        json_flash_payload = json.dumps(flash_payload)
                        await ctx.room.local_participant.perform_rpc(
                            destination_identity=participant.identity,
                            method="client.flashcard",
                            payload=json_flash_payload
                        )

                feedback_details.append(feedback)

            detailed_feedback = "\n\n".join(feedback_details)
            full_response = f"{result_summary}\n\n{detailed_feedback}"

            # Have the agent say the results
            session.say(full_response)

            return "success"
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error for quiz submission payload '{rpc_data.payload}': {e}")
            return f"error: {str(e)}"
        except Exception as e:
            logger.error(f"Error handling quiz submission: {e}")
            return f"error: {str(e)}"

    # Register RPC methods - The method names need to match exactly what the client is calling
    logger.info("Registering RPC methods")
    ctx.room.local_participant.register_rpc_method(
        "agent.flipFlashCard",
        handle_flip_flash_card
    )

    ctx.room.local_participant.register_rpc_method(
        "agent.submitQuiz",
        handle_submit_quiz
    )

    # Register RPC method for handling game choices
    async def handle_game_choice(rpc_data):
        try:
            logger.info(f"Received game choice payload: {rpc_data}")

            # Extract the payload from the RpcInvocationData object
            payload_str = rpc_data.payload
            logger.info(f"Extracted game choice string: {payload_str}")

            # Parse the JSON payload
            payload_data = json.loads(payload_str)
            logger.info(f"Parsed game choice data: {payload_data}")

            user_choice = payload_data.get("choice")
            santa_choice = payload_data.get("santaChoice")
            result = payload_data.get("result")
            
            participant = next(iter(ctx.room.remote_participants.values()), None)
            if not participant:
                return "error: No participant found"
            
            if user_choice:
                # Provide commentary based on the choice
                choice_messages = {
                    "rock": "Rock! A solid choice! Ho ho ho!",
                    "paper": "Paper! Very clever!",
                    "scissors": "Scissors! Sharp thinking! Ho ho ho!"
                }
                
                message = choice_messages.get(user_choice, "Great choice! Let's see who wins!")
                session.say(message)
                
                logger.info(f"User chose: {user_choice}")
                
                # If we have the result, provide commentary
                if result and santa_choice:
                    await asyncio.sleep(1)  # Small delay for dramatic effect
                    
                    result_messages = {
                        "win": "Oh no! You beat me! Well played! Ho ho ho!",
                        "lose": "Ho ho ho! I won this round! Great game though!",
                        "tie": "It's a tie! What a coincidence! Let's play again!"
                    }
                    
                    result_message = result_messages.get(result, "Great game!")
                    session.say(result_message)
                    
                    # Update the game message in the frontend
                    try:
                        update_payload = {
                            "action": "update_message",
                            "message": result_message
                        }
                        await ctx.room.local_participant.perform_rpc(
                            destination_identity=participant.identity,
                            method="client.showRockPaperScissors",
                            payload=json.dumps(update_payload)
                        )
                    except Exception as e:
                        logger.warning(f"Failed to update game message: {e}")
            else:
                logger.error("No choice found in payload")

            return "success"
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error for game choice payload '{rpc_data.payload}': {e}")
            return f"error: {str(e)}"
        except Exception as e:
            logger.error(f"Error handling game choice: {e}")
            return f"error: {str(e)}"

    ctx.room.local_participant.register_rpc_method(
        "agent.gameChoice",
        handle_game_choice
    )

    # Start the avatar with the same session that has userdata
    logger.info("Starting Tavus avatar session...")
    await avatar.start(session, room=ctx.room)
    logger.info("Tavus avatar session started")

    # Start the agent session with the same session object
    logger.info("Starting agent session...")
    await session.start(
        room=ctx.room,
        room_output_options=RoomOutputOptions(
            audio_enabled=True,  # Enable audio since we want the avatar to speak
        ),
        agent=agent
    )
    logger.info("Agent session started")
    
    # Log room participants to debug
    logger.info(f"Room participants: {[p.identity for p in ctx.room.remote_participants.values()]}")
    logger.info(f"Local participant identity: {ctx.room.local_participant.identity}")
    
    # Log video tracks
    for participant in ctx.room.remote_participants.values():
        for track_publication in participant.track_publications.values():
            if track_publication.kind == "video":
                logger.info(f"Found video track from {participant.identity}: {track_publication.track_sid}")

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint
        )
    )
