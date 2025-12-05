"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  DisconnectButton,
  VoiceAssistantControlBar,
  useVoiceAssistant,
} from "@livekit/components-react";
import { CloseIcon } from "./CloseIcon";

interface ControlBarProps {
  onConnectButtonClicked: () => void;
}

/**
 * Control bar component for agent connection
 * Only visible when agent is disconnected
 */
export default function ControlBar({ onConnectButtonClicked }: ControlBarProps) {
  const { state: agentState } = useVoiceAssistant();

  return (
    <div className="relative flex items-center gap-2">
      <AnimatePresence>
        {agentState !== "disconnected" && agentState !== "connecting" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded bg-white h-9">
              <VoiceAssistantControlBar controls={{ leave: false }} />
            </div>
            <DisconnectButton>
              <CloseIcon />
            </DisconnectButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

