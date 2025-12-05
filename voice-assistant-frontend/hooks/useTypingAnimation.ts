import { useEffect, useState, useRef } from "react";

const TYPING_SPEED_MS = 30;
const INITIAL_DELAY_MS = 300;

/**
 * Custom hook for typing animation effect
 * Handles text animation with proper cleanup
 */
export function useTypingAnimation(
  content: string,
  key: string
): { displayedText: string; isTyping: boolean } {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const keyRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset if key changed (new content)
    if (keyRef.current !== key) {
      keyRef.current = key;
      setDisplayedText("");
      setIsTyping(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      let currentIndex = 0;

      const typeText = () => {
        if (currentIndex < content.length) {
          setDisplayedText(content.slice(0, currentIndex + 1));
          currentIndex++;
          timeoutRef.current = setTimeout(typeText, TYPING_SPEED_MS);
        } else {
          setIsTyping(false);
          timeoutRef.current = null;
        }
      };

      timeoutRef.current = setTimeout(() => {
        typeText();
      }, INITIAL_DELAY_MS);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    } else if (!isTyping && displayedText !== content) {
      // Update content if animation is done
      setDisplayedText(content);
    }
  }, [key, content, isTyping, displayedText]);

  return { displayedText, isTyping };
}

