"use client";

/**
 * Pixel art information icon component
 */
export default function InfoIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        imageRendering: "pixelated",
        imageRendering: "crisp-edges",
      }}
    >
      {/* Background circle - pixel art style */}
      <rect x="6" y="6" width="28" height="28" rx="2" fill="#9CA3AF" />
      <rect x="8" y="8" width="24" height="24" rx="1" fill="#D1D5DB" />
      
      {/* Border outline */}
      <rect x="6" y="6" width="28" height="28" rx="2" fill="none" stroke="#6B7280" strokeWidth="2" />
      
      {/* "i" letter - vertical line (pixelated) */}
      <rect x="18" y="12" width="4" height="12" fill="#28292A" />
      
      {/* "i" letter - dot (pixelated) */}
      <rect x="18" y="26" width="4" height="4" fill="#28292A" />
      
      {/* Highlight pixels for 3D effect */}
      <rect x="8" y="8" width="2" height="2" fill="#E5E7EB" />
      <rect x="30" y="8" width="2" height="2" fill="#E5E7EB" />
    </svg>
  );
}

