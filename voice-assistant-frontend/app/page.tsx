"use client";

import { NoAgentNotification } from "@/components/NoAgentNotification";
import RockPaperScissorsPanel from "@/components/RockPaperScissorsPanel";
import LetterPanel from "@/components/LetterPanel";
import RecommendationsSection from "@/components/RecommendationsSection";
import AgentVisualizer from "@/components/AgentVisualizer";
import ControlBar from "@/components/ControlBar";
import {
  RoomAudioRenderer,
  RoomContext,
  useVoiceAssistant,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import type { ConnectionDetails } from "./api/connection-details/route";
import type { WishlistProduct, Letter, GameState } from "@/types";
import { useRpcHandlers } from "@/hooks/useRpcHandlers";

export default function Page() {
  const [room] = useState(new Room());

  const onConnectButtonClicked = useCallback(async () => {
    // Generate room connection details, including:
    //   - A random Room name
    //   - A random Participant name
    //   - An Access Token to permit the participant to join the room
    //   - The URL of the LiveKit server to connect to
    //
    // In real-world application, you would likely allow the user to specify their
    // own participant name, and possibly to choose from existing rooms to join.

    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
      window.location.origin
    );
    const response = await fetch(url.toString());
    const connectionDetailsData: ConnectionDetails = await response.json();

    await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
    await room.localParticipant.setMicrophoneEnabled(true);
  }, [room]);

  useEffect(() => {
    room.on(RoomEvent.MediaDevicesError, onDeviceFailure);

    return () => {
      room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
    };
  }, [room]);

  return (
    <main data-lk-theme="default" className="h-full w-full">
      <RoomContext.Provider value={room}>
        <div className="lk-room-container bg-white w-full h-full">
          <SimpleVoiceAssistant onConnectButtonClicked={onConnectButtonClicked} />
        </div>
      </RoomContext.Provider>
    </main>
  );
}

function SimpleVoiceAssistant(props: { onConnectButtonClicked: () => void }) {
  const { state: agentState } = useVoiceAssistant();
  const room = useRoomContext();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [isLetterVisible, setIsLetterVisible] = useState(false);
  const [shouldExportPDF, setShouldExportPDF] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<WishlistProduct[]>([]);
  const [isGameVisible, setIsGameVisible] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    userChoice: null,
    santaChoice: null,
    result: null,
    message: "",
  });

  // Centralized RPC handlers using custom hook
  useRpcHandlers({
    room,
    onWishlistUpdate: () => {
      // Products are added directly to the letter, no need to track separately
    },
    onLetterUpdate: (updatedLetter) => {
      setLetter(updatedLetter);
    },
    onLetterVisibilityChange: setIsLetterVisible,
    onPdfExportRequest: () => setShouldExportPDF(true),
    onRecommendationsUpdate: (products) => {
      setRecommendedProducts(products);
      // Update letter with recommended products if visible
      setLetter((prevLetter) => {
        if (!prevLetter) return prevLetter;
        const existingProductIds = new Set(prevLetter.products?.map((p) => p.id) || []);
        const newRecommendedProducts = products.filter((p) => !existingProductIds.has(p.id));
        if (newRecommendedProducts.length === 0) return prevLetter;

        let updatedContent = prevLetter.content;
        if (!updatedContent.includes("[PRODUCTS]")) {
          const closingPattern = "I hope you have a magical Christmas";
          if (updatedContent.includes(closingPattern)) {
            const closingIndex = updatedContent.indexOf(closingPattern);
            updatedContent =
              updatedContent.slice(0, closingIndex).trim() +
              "\n\nI'm bringing you these wonderful gifts:\n[PRODUCTS]\n\n" +
              updatedContent.slice(closingIndex);
          } else {
            updatedContent = updatedContent.trim() + "\n\nI'm bringing you these wonderful gifts:\n[PRODUCTS]\n\n";
          }
        }

        return {
          ...prevLetter,
          content: updatedContent,
          products: [...(prevLetter.products || []), ...newRecommendedProducts],
        };
      });
    },
    onGameVisibilityChange: setIsGameVisible,
    onGameStateUpdate: (partialState) => {
      setGameState((prev) => ({ ...prev, ...partialState }));
    },
  });

  return (
    <div
      className="relative w-full min-h-screen flex flex-col items-center"
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <source src="/images/0_Pixel_Art_1280x720.mp4" type="video/mp4" />
      </video>
      
      {/* Content overlay */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
      {/* Title and Subtitle - Always visible */}
      <div
        className="w-full flex flex-col items-center"
        style={{
          maxWidth: "1200px",
          padding: "30px 20px 0 20px",
          marginBottom: "40px",
        }}
      >
        {/* Tavus Take Home Project Logo */}
        <img
          src="/images/Tavus Take Home Project.svg"
          alt="Tavus Take Home Project"
          style={{
            width: "auto",
            height: "auto",
            minWidth: "200px",
            marginBottom: "20px",
            transformOrigin: "center",
          }}
        />
        <h1
          style={{
            color: "white",
            textAlign: "center",
            fontFamily: '"Perfectly Nineties", serif',
            fontSize: "clamp(60px, 12vw, 150px)",
            fontStyle: "normal",
            fontWeight: 400,
            lineHeight: "225px",
            margin: 0,
          }}
        >
          Letter to Santa
        </h1>
        <div
          style={{
            color: "white",
            textAlign: "center",
            fontFamily: '"Suisse Int\'l", sans-serif',
            fontSize: "18.1px",
            fontStyle: "normal",
            fontWeight: 400,
            lineHeight: "23.5px",
            display: "flex",
            width: "810px",
            height: "55px",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: "calc(100% - 40px)",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
          }}
        >
          Ask anything to Santa, it will be added to your Christmas wishlist
        </div>
      </div>

      {/* Agent Visualizer - Always visible */}
      <div className="w-full flex flex-col items-center max-w-[810px] mb-10">
        <AgentVisualizer onConnectButtonClicked={props.onConnectButtonClicked} />
      </div>

      <AnimatePresence mode="wait">
        {agentState !== "disconnected" && (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="relative w-full flex-1"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <RoomAudioRenderer />
            <NoAgentNotification state={agentState} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Bar - Only show when disconnected */}
      {agentState === "disconnected" && (
        <div className="fixed bottom-5 right-5 z-[100]">
          <ControlBar />
        </div>
      )}

      {/* Letter Panel - Right side */}
      <AnimatePresence>
        {isLetterVisible && letter && (
          <LetterPanel 
            letter={letter} 
            onClose={() => setIsLetterVisible(false)}
            shouldExportPDF={shouldExportPDF}
            onPDFExported={() => setShouldExportPDF(false)}
          />
        )}
      </AnimatePresence>

      {/* Rock, Paper, Scissors Game Panel - Left side */}
      <AnimatePresence>
        {isGameVisible && (
          <RockPaperScissorsPanel 
            gameState={gameState}
            onClose={() => setIsGameVisible(false)}
            onChoice={(choice, santaChoice, result) => {
              setGameState({
                userChoice: choice,
                santaChoice,
                result,
                message: "",
              });
            }}
            onReset={() => {
              setGameState({
                userChoice: null,
                santaChoice: null,
                result: null,
                message: "Choose your move!",
              });
            }}
            room={room}
          />
        )}
      </AnimatePresence>

      {/* Recommendations Section */}
      {recommendedProducts.length > 0 && (
        <RecommendationsSection 
          products={recommendedProducts}
          onAddToWishlist={(product) => {
            // Remove from recommendations (product will be added to letter by backend)
            setRecommendedProducts(prev => prev.filter(p => p.id !== product.id));
          }}
        />
      )}

      {/* Sección inferior - Wishlist Section - Ocultada, los productos van en la carta */}
      </div>
      {/* End content overlay */}
    </div>
  );
}

function onDeviceFailure(error: Error) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
