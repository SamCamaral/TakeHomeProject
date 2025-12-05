# TakeHomeProject

A LiveKit-powered Santa Claus AI agent that uses Tavus avatars to create an interactive Christmas experience. Users can write letters to loved ones and play Rock, Paper, Scissors with Santa!

## Features

- **Interactive Letter Writing**: Create personalized letters to family and friends with your Christmas wishlist included
- **Rock, Paper, Scissors Game**: Play a fun game with Santa Claus
- **Wishlist Management**: Add gifts to your Christmas wishlist through conversation
- **Product Recommendations**: Get personalized product suggestions based on your wishlist
- **PDF Export**: Download your letters as PDF files
- **Visual Avatar**: Powered by Tavus for realistic Santa Claus avatar
- **Voice Interaction**: Natural voice conversation using AssemblyAI STT and ElevenLabs TTS

## Prerequisites

- Python 3.10+
- Node.js 18+
- LiveKit account
- Tavus account with configured avatar (replica_id and persona_id)
- API keys for:
  - OpenAI
  - ElevenLabs
  - AssemblyAI
  - Tavus
  - LiveKit

## Installation

1. Clone this repository
2. Install Python dependencies from the root level of `python-agents-examples`:
   ```
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the parent directory with your API keys

## Configuration

Set the following environment variables in your `.env` file:

```
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ASSEMBLYAI_API_KEY=your_assemblyai_key
TAVUS_API_KEY=your_tavus_key
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
TAVUS_REPLICA_ID=r9d30b0e55ac
```

Customize the avatar by changing the `replica_id` and `persona_id` in the `entrypoint` function in `tavus.py`.

## Usage

### Backend (Agent)

Run the agent with:

```
python tavus.py dev
```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd voice-assistant-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## How to Use

1. **Start a Conversation**: Click "ANSWER HIS CALL" to connect with Santa
2. **Add to Wishlist**: Tell Santa what you want for Christmas and it will be added to your wishlist
3. **Write a Letter**: Ask Santa to help you create a letter to someone special
4. **Play Rock, Paper, Scissors**: Say "I want to play Rock, Paper and Scissors with you" to start a game
5. **Get Recommendations**: Ask for product recommendations based on your wishlist
6. **Export PDF**: Download your letter as a PDF file

## Project Structure

- `tavus.py`: Main agent logic with Santa's personality and capabilities
- `voice-assistant-frontend/`: Next.js frontend application
  - `app/page.tsx`: Main page component
  - `components/`: React components for UI elements
  - `hooks/`: Custom React hooks for RPC handlers and animations
  - `types/`: TypeScript type definitions
  - `utils/`: Utility functions

## Technologies Used

- **Backend**: Python, LiveKit Agents, Tavus SDK
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Framer Motion
- **AI/ML**: OpenAI GPT-4, AssemblyAI STT, ElevenLabs TTS
- **Avatar**: Tavus Replica API
