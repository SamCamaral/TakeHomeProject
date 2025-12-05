import type { GameChoice, GameResult } from "@/types";

/**
 * Generates a random choice for Santa
 * Using Math.random ensures fair distribution across all three options
 */
export function generateSantaChoice(): GameChoice {
  const choices: GameChoice[] = ["rock", "paper", "scissors"];
  return choices[Math.floor(Math.random() * choices.length)];
}

/**
 * Determines the game result based on user and Santa choices
 * Returns "tie" if choices match, "win" if user wins, "lose" if Santa wins
 */
export function calculateGameResult(
  userChoice: GameChoice,
  santaChoice: GameChoice
): GameResult {
  if (userChoice === santaChoice) {
    return "tie";
  }

  const winConditions: Record<GameChoice, GameChoice> = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper",
  };

  return winConditions[userChoice] === santaChoice ? "win" : "lose";
}

/**
 * Gets the emoji representation for a game choice
 */
export function getChoiceEmoji(choice: GameChoice | null): string {
  if (!choice) return "❓";
  
  const emojiMap: Record<GameChoice, string> = {
    rock: "🪨",
    paper: "📄",
    scissors: "✂️",
  };
  
  return emojiMap[choice];
}

/**
 * Gets the result message based on game outcome
 */
export function getResultMessage(result: GameResult): string {
  const messages: Record<GameResult, string> = {
    tie: "It's a tie! Ho ho ho!",
    win: "You win! Great job!",
    lose: "Santa wins! Ho ho ho!",
  };
  
  return messages[result];
}

/**
 * Gets the color for the result message
 */
export function getResultColor(result: GameResult): string {
  const colors: Record<GameResult, string> = {
    win: "#7CFF98",
    lose: "#FF6B6B",
    tie: "#FFA500",
  };
  
  return colors[result];
}

