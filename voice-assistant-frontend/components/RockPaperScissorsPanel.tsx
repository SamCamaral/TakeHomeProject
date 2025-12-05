"use client";

import { motion } from "framer-motion";
import { Room } from "livekit-client";
import { useVoiceAssistant } from "@livekit/components-react";
import { CloseIcon } from "./CloseIcon";
import type { GameState, GameChoice } from "@/types";
import {
  generateSantaChoice,
  calculateGameResult,
  getChoiceEmoji,
  getResultMessage,
  getResultColor,
} from "@/utils/gameLogic";

interface RockPaperScissorsPanelProps {
  gameState: GameState;
  onClose: () => void;
  onChoice: (choice: GameChoice, santaChoice: GameChoice, result: "win" | "lose" | "tie") => void;
  onReset: () => void;
  room: Room;
}

/**
 * Rock Paper Scissors game panel component
 * Handles game state, user interactions, and communicates with the agent
 */
export default function RockPaperScissorsPanel({
  gameState,
  onClose,
  onChoice,
  onReset,
  room,
}: RockPaperScissorsPanelProps) {
  const { agent } = useVoiceAssistant();

  const handleChoice = async (choice: GameChoice) => {
    const santaChoice = generateSantaChoice();
    const result = calculateGameResult(choice, santaChoice);

    onChoice(choice, santaChoice, result);

    if (agent) {
      try {
        await room.localParticipant.performRpc({
          destinationIdentity: agent.identity,
          method: "agent.gameChoice",
          payload: JSON.stringify({ choice, santaChoice, result }),
        });
      } catch (error) {
        console.error("Error sending choice to agent:", error);
      }
    }
  };

  const isChoiceDisabled = !!gameState.userChoice;

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-5 left-5 w-[400px] max-h-[calc(100vh-40px)] bg-white border border-[#C9BDAA] rounded-lg shadow-lg z-[1000] flex flex-col overflow-hidden"
    >
      <GameHeader onClose={onClose} />
      <GameContent
        gameState={gameState}
        onChoice={handleChoice}
        onReset={onReset}
        isChoiceDisabled={isChoiceDisabled}
      />
    </motion.div>
  );
}

function GameHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex justify-between items-center px-5 py-4 border-b border-[#C9BDAA] bg-[#EAE5DE]">
      <h3 className="text-[#28292A] font-['Perfectly_Nineties'] text-2xl font-normal m-0">
        Rock, Paper, Scissors
      </h3>
      <button
        onClick={onClose}
        className="bg-transparent border-none cursor-pointer p-1 flex items-center justify-center text-black"
        aria-label="Close game"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

interface GameContentProps {
  gameState: GameState;
  onChoice: (choice: GameChoice) => void;
  onReset: () => void;
  isChoiceDisabled: boolean;
}

function GameContent({ gameState, onChoice, onReset, isChoiceDisabled }: GameContentProps) {
  return (
    <div className="p-6 overflow-y-auto flex-1 font-['Suisse_Int\'l'] text-base leading-relaxed text-[#28292A] bg-white flex flex-col items-center gap-5">
      {gameState.message && (
        <div className="px-4 py-3 bg-[#EAE5DE] rounded-lg text-center w-full">
          <p className="m-0 italic">{gameState.message}</p>
        </div>
      )}

      {gameState.userChoice && gameState.santaChoice && gameState.result && (
        <GameResultDisplay
          userChoice={gameState.userChoice}
          santaChoice={gameState.santaChoice}
          result={gameState.result}
        />
      )}

      <ChoiceButtons
        onChoice={onChoice}
        isDisabled={isChoiceDisabled}
        selectedChoice={gameState.userChoice}
      />

      {gameState.result && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          className="px-6 py-3 border border-[#2C2C2C] bg-[#7CFF98] cursor-pointer font-['Suisse_Int\'l'] text-sm font-semibold text-[#28292A] rounded"
        >
          Play Again
        </motion.button>
      )}
    </div>
  );
}

interface GameResultDisplayProps {
  userChoice: GameChoice;
  santaChoice: GameChoice;
  result: "win" | "lose" | "tie";
}

function GameResultDisplay({ userChoice, santaChoice, result }: GameResultDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full p-5 bg-[#F5F5F5] rounded-lg">
      <div className="flex gap-10 items-center">
        <ChoiceDisplay choice={userChoice} label="You" />
        <div className="text-2xl">VS</div>
        <ChoiceDisplay choice={santaChoice} label="Santa" />
      </div>
      <div
        className="text-xl font-semibold text-center"
        style={{ color: getResultColor(result) }}
      >
        {getResultMessage(result)}
      </div>
    </div>
  );
}

function ChoiceDisplay({ choice, label }: { choice: GameChoice; label: string }) {
  return (
    <div className="text-center">
      <div className="text-5xl mb-2">{getChoiceEmoji(choice)}</div>
      <div className="text-sm font-semibold">{label}</div>
    </div>
  );
}

interface ChoiceButtonsProps {
  onChoice: (choice: GameChoice) => void;
  isDisabled: boolean;
  selectedChoice: GameChoice | null;
}

function ChoiceButtons({ onChoice, isDisabled, selectedChoice }: ChoiceButtonsProps) {
  const choices: Array<{ value: GameChoice; emoji: string; label: string }> = [
    { value: "rock", emoji: "🪨", label: "Rock" },
    { value: "paper", emoji: "📄", label: "Paper" },
    { value: "scissors", emoji: "✂️", label: "Scissors" },
  ];

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="text-sm font-semibold mb-2 text-center">Choose your move:</div>
      <div className="flex gap-3 justify-center">
        {choices.map(({ value, emoji, label }) => (
          <ChoiceButton
            key={value}
            value={value}
            emoji={emoji}
            label={label}
            onClick={() => onChoice(value)}
            disabled={isDisabled}
            isSelected={selectedChoice === value}
          />
        ))}
      </div>
    </div>
  );
}

interface ChoiceButtonProps {
  value: GameChoice;
  emoji: string;
  label: string;
  onClick: () => void;
  disabled: boolean;
  isSelected: boolean;
}

function ChoiceButton({ emoji, label, onClick, disabled, isSelected }: ChoiceButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`w-[100px] h-[100px] border-2 border-[#2C2C2C] flex flex-col items-center justify-center gap-1 font-['Suisse_Int\'l'] text-sm font-semibold text-[#28292A] ${
        isSelected ? "bg-[#EAE5DE]" : "bg-white"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} image-rendering-crisp-edges`}
      aria-label={`Choose ${label}`}
    >
      <div className="text-3xl">{emoji}</div>
      <div>{label}</div>
    </motion.button>
  );
}

