"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  VideoTrack,
  VoiceAssistantControlBar,
  useVoiceAssistant,
  DisconnectButton,
} from "@livekit/components-react";
import { useRoomContext } from "@livekit/components-react";
import { CloseIcon } from "./CloseIcon";

interface AgentVisualizerProps {
  onConnectButtonClicked?: () => void;
}

/**
 * Agent visualizer component
 * Displays the avatar video feed with TV frame styling
 * Handles video track detection and connection states
 */
export default function AgentVisualizer({ onConnectButtonClicked }: AgentVisualizerProps) {
  const { state: agentState, videoTrack } = useVoiceAssistant();
  const room = useRoomContext();
  const [avatarVideoTrack, setAvatarVideoTrack] = useState<typeof videoTrack>(null);

  // Fallback: Try to find video track from tavus-avatar-agent participant
  useEffect(() => {
    if (!room || videoTrack) {
      setAvatarVideoTrack(videoTrack);
      return;
    }

    const findAvatarTrack = () => {
      const avatarParticipant = Array.from(room.remoteParticipants.values()).find(
        (p) => p.identity === "tavus-avatar-agent"
      );

      if (avatarParticipant) {
        const publications = Array.from(avatarParticipant.trackPublications.values());
        for (const publication of publications) {
          if (publication.kind === "video" && publication.track) {
            setAvatarVideoTrack(publication.track);
            return;
          }
        }
      }
    };

    findAvatarTrack();

    const handleTrackSubscribed = (track: unknown, publication: unknown, participant: unknown) => {
      if (
        (participant as { identity: string }).identity === "tavus-avatar-agent" &&
        (publication as { kind: string }).kind === "video"
      ) {
        setAvatarVideoTrack(track as typeof videoTrack);
      }
    };

    room.on("trackSubscribed", handleTrackSubscribed);

    return () => {
      room.off("trackSubscribed", handleTrackSubscribed);
    };
  }, [room, videoTrack]);

  const displayVideoTrack = videoTrack || avatarVideoTrack;

  return (
    <div className="relative w-[750px] h-[468.75px] max-w-full">
      <TVFrameSVG />
      <VideoContainer
        agentState={agentState}
        displayVideoTrack={displayVideoTrack}
        onConnectButtonClicked={onConnectButtonClicked}
      />
    </div>
  );
}

/**
 * TV frame SVG component
 * Provides the retro TV frame styling around the video
 */
function TVFrameSVG() {
  return (
    <svg
      width="750"
      height="468.75"
      viewBox="60 40 750 468.75"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full absolute top-0 left-0 z-[1]"
    >
      <g clipPath="url(#clip0_1419_4560)" filter="url(#filter0_ddi_1419_4560)">
        <rect width="750" height="468.75" transform="translate(60 40)" fill="#EAE5DE" />
        <path d="M60 40H810V69H60V40Z" fill="#EAE5DE" />
        <path
          d="M98.648 55.654H100.004C100.052 56.434 100.352 56.602 101.648 56.602C102.896 56.602 103.172 56.422 103.172 55.57C103.172 54.718 102.896 54.478 101.636 54.202C99.236 53.686 98.708 53.242 98.708 51.658C98.708 49.894 99.236 49.51 101.612 49.51C103.868 49.51 104.372 49.858 104.408 51.43H103.04C103.016 50.914 102.764 50.794 101.66 50.794C100.376 50.794 100.088 50.95 100.088 51.67C100.088 52.33 100.376 52.546 101.684 52.834C104.036 53.35 104.552 53.83 104.552 55.57C104.552 57.49 104.012 57.91 101.552 57.91C99.116 57.91 98.6 57.502 98.648 55.654ZM106.519 57.79L108.655 49.63H110.923L113.071 57.79H111.703L111.211 55.978H108.355L107.887 57.79H106.519ZM108.667 54.73H110.923L109.927 50.878H109.663L108.667 54.73ZM115.135 57.79V49.63H116.959L119.563 56.158H119.599L119.467 53.938V49.63H120.835V57.79H118.999L116.407 51.25H116.371L116.503 53.47V57.79H115.135ZM125.466 57.79V50.926H123.342V49.63H129.018V50.926H126.882V57.79H125.466ZM131.105 57.79L133.241 49.63H135.509L137.657 57.79H136.289L135.797 55.978H132.941L132.473 57.79H131.105ZM133.253 54.73H135.509L134.513 50.878H134.249L133.253 54.73Z"
          fill="#2C2C2C"
        />
        <rect x="76" y="48" width="12" height="12" fill="#FF0000" />
        <rect x="778.5" y="46.5" width="15" height="15" stroke="#2C2C2C" />
        <g clipPath="url(#clip1_1419_4560)">
          <g clipPath="url(#clip2_1419_4560)">
            <path
              d="M783.5 57.5H782.5V56.5H783.5V57.5ZM789.5 57.5H788.5V56.5H789.5V57.5ZM784.5 55.5V56.5H783.5V55.5H784.5ZM788.5 56.5H787.5V55.5H788.5V56.5ZM785.5 55.5H784.5V54.5H785.5V55.5ZM787.5 55.5H786.5V54.5H787.5V55.5ZM786.5 54.5H785.5V53.5H786.5V54.5ZM785.5 53.5H784.5V52.5H785.5V53.5ZM787.5 53.5H786.5V52.5H787.5V53.5ZM784.5 52.5H783.5V51.5H784.5V52.5ZM788.5 52.5H787.5V51.5H788.5V52.5ZM783.5 51.5H782.5V50.5H783.5V51.5ZM789.5 51.5H788.5V50.5H789.5V51.5Z"
              fill="#140206"
            />
          </g>
        </g>
        <g filter="url(#filter1_ddddd_1419_4560)">
          <rect x="151.02" y="46" width="606.98" height="1" fill="#2C2C2C" />
        </g>
        <g filter="url(#filter2_ii_1419_4560)">
          <rect width="750" height="439.75" transform="translate(60 69)" fill="#FFFFFF" />
        </g>
      </g>
      <defs>
        <filter
          id="filter0_ddi_1419_4560"
          x="0"
          y="0"
          width="870"
          height="588.75"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="20" />
          <feGaussianBlur stdDeviation="30" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1419_4560" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius="0.3" operator="dilate" in="SourceAlpha" result="effect2_dropShadow_1419_4560" />
          <feOffset />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.290196 0 0 0 0 0.290196 0 0 0 0 0.290196 0 0 0 1 0" />
          <feBlend mode="normal" in2="effect1_dropShadow_1419_4560" result="effect2_dropShadow_1419_4560" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_1419_4560" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect3_innerShadow_1419_4560" />
          <feOffset />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.815686 0 0 0 0 0.815686 0 0 0 0 0.815686 0 0 0 1 0" />
          <feBlend mode="normal" in2="shape" result="effect3_innerShadow_1419_4560" />
        </filter>
        <filter
          id="filter1_ddddd_1419_4560"
          x="151.02"
          y="46"
          width="606.98"
          height="13.5"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="12.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.172549 0 0 0 0 0.172549 0 0 0 0 0.172549 0 0 0 1 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1419_4560" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="10" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.172549 0 0 0 0 0.172549 0 0 0 0 0.172549 0 0 0 1 0" />
          <feBlend mode="normal" in2="effect1_dropShadow_1419_4560" result="effect2_dropShadow_1419_4560" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="7.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.172549 0 0 0 0 0.172549 0 0 0 0 0.172549 0 0 0 1 0" />
          <feBlend mode="normal" in2="effect2_dropShadow_1419_4560" result="effect3_dropShadow_1419_4560" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.172549 0 0 0 0 0.172549 0 0 0 0 0.172549 0 0 0 1 0" />
          <feBlend mode="normal" in2="effect3_dropShadow_1419_4560" result="effect4_dropShadow_1419_4560" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.172549 0 0 0 0 0.172549 0 0 0 0 0.172549 0 0 0 1 0" />
          <feBlend mode="normal" in2="effect4_dropShadow_1419_4560" result="effect5_dropShadow_1419_4560" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect5_dropShadow_1419_4560" result="shape" />
        </filter>
        <filter
          id="filter2_ii_1419_4560"
          x="60"
          y="69"
          width="750"
          height="439.75"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius="6" operator="erode" in="SourceAlpha" result="effect1_innerShadow_1419_4560" />
          <feOffset />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1419_4560" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius="5" operator="erode" in="SourceAlpha" result="effect2_innerShadow_1419_4560" />
          <feOffset />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.917647 0 0 0 0 0.898039 0 0 0 0 0.870588 0 0 0 1 0" />
          <feBlend mode="normal" in2="effect1_innerShadow_1419_4560" result="effect2_innerShadow_1419_4560" />
        </filter>
        <clipPath id="clip0_1419_4560">
          <rect width="750" height="468.75" fill="white" transform="translate(60 40)" />
        </clipPath>
        <clipPath id="clip1_1419_4560">
          <rect width="12" height="12" fill="white" transform="translate(780 48)" />
        </clipPath>
        <clipPath id="clip2_1419_4560">
          <rect width="12" height="12" fill="white" transform="translate(780 48)" />
        </clipPath>
      </defs>
    </svg>
  );
}

interface VideoContainerProps {
  agentState: string;
  displayVideoTrack: unknown;
  onConnectButtonClicked?: () => void;
}

/**
 * Video container component
 * Handles different states: disconnected (placeholder), connecting, connected (avatar)
 */
function VideoContainer({
  agentState,
  displayVideoTrack,
  onConnectButtonClicked,
}: VideoContainerProps) {
  return (
    <div className="absolute overflow-hidden left-0 top-[29px] w-[750px] h-[439.75px] z-[2] bg-white">
      {agentState === "disconnected" ? (
        <DisconnectedState onConnectButtonClicked={onConnectButtonClicked} />
      ) : (
        <ConnectedState displayVideoTrack={displayVideoTrack} agentState={agentState} />
      )}
    </div>
  );
}

interface DisconnectedStateProps {
  onConnectButtonClicked?: () => void;
}

function DisconnectedState({ onConnectButtonClicked }: DisconnectedStateProps) {
  return (
    <>
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      >
        <source
          src="https://cdn.replica.tavus.io/20258/7202eb45.mp4"
          type="video/mp4"
        />
      </video>
      {onConnectButtonClicked && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-10">
          <h2 className="text-white text-center font-['Perfectly_Nineties'] text-5xl font-normal leading-[72px] drop-shadow-[2px_2px_8px_rgba(0,0,0,0.8)] w-[600px] h-[72px] flex flex-col justify-center m-0">
            Santa's helper is calling you
          </h2>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            onClick={onConnectButtonClicked}
            className="flex w-[180px] h-[46px] p-[1px] justify-center items-start border border-[#2C2C2C] bg-transparent cursor-pointer"
          >
            <div className="flex w-[181.02px] h-[44px] py-[14.2px] px-5 justify-center items-end gap-2 flex-shrink-0 bg-[#7CFF98]">
              <div className="w-4 h-4 bg-[#2C2C2C] flex-shrink-0" />
              <div className="w-px h-[14px] bg-[#2C2C2C] flex-shrink-0" />
              <span className="text-[#2C2C2C] text-center font-['TX-02'] text-xs font-bold leading-[15.6px] tracking-[1px] uppercase flex w-[123.411px] h-[14px] flex-col justify-center flex-shrink-0">
                ANSWER HIS CALL
              </span>
            </div>
          </motion.button>
        </div>
      )}
    </>
  );
}

interface ConnectedStateProps {
  displayVideoTrack: unknown;
  agentState: string;
}

function ConnectedState({ displayVideoTrack, agentState }: ConnectedStateProps) {
  return (
    <>
      {displayVideoTrack ? (
        <VideoTrack trackRef={displayVideoTrack} />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-white">
          <div className="text-[#2C2C2C] font-['Suisse_Int\'l'] text-lg">Connecting...</div>
        </div>
      )}

      {agentState !== "disconnected" && agentState !== "connecting" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-10 left-[35%] translate-x-[150%] flex flex-row items-center gap-2 z-10 bg-black stroke-current stroke-[1px]"
        >
          <div className="lk-agent-control-bar bg-transparent h-9 flex items-center">
            <VoiceAssistantControlBar controls={{ leave: false }} />
          </div>
          <DisconnectButton>
            <CloseIcon />
          </DisconnectButton>
        </motion.div>
      )}
    </>
  );
}

