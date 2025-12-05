"use client";

import { useCallback, useEffect, useRef, forwardRef } from "react";
import { motion } from "framer-motion";
import { CloseIcon } from "./CloseIcon";
import type { Letter, WishlistProduct } from "@/types";
import { useTypingAnimation } from "@/hooks/useTypingAnimation";
import { exportElementToPDF, calculateTypingTime } from "@/utils/pdfExport";

interface LetterPanelProps {
  letter: Letter;
  onClose: () => void;
  shouldExportPDF?: boolean;
  onPDFExported?: () => void;
}

const PRODUCTS_MARKER = "[PRODUCTS]";

/**
 * Letter panel component with typing animation and PDF export
 * Displays letter content with embedded products grid
 */
export default function LetterPanel({
  letter,
  onClose,
  shouldExportPDF,
  onPDFExported,
}: LetterPanelProps) {
  const letterContentRef = useRef<HTMLDivElement>(null);
  const letterKey = `${letter.id}-${letter.recipient}`;
  const { displayedText, isTyping } = useTypingAnimation(letter.content, letterKey);

  const exportToPDF = useCallback(async () => {
    if (!letterContentRef.current) {
      console.warn("Letter content ref is null, cannot export PDF");
      return;
    }

    try {
      const fileName = `Letter_to_${letter.recipient.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
      await exportElementToPDF(letterContentRef.current, fileName);
      console.log("PDF exported successfully:", fileName);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Error exporting letter to PDF. Please try again.");
    }
  }, [letter.recipient]);

  // Auto-export when shouldExportPDF is true
  useEffect(() => {
    if (!shouldExportPDF || !letterContentRef.current) return;

    if (isTyping && displayedText.length < letter.content.length) {
      const remainingChars = letter.content.length - displayedText.length;
      const estimatedTime = calculateTypingTime(remainingChars);

      const timeout = setTimeout(() => {
        exportToPDF()
          .then(() => onPDFExported?.())
          .catch(console.error);
      }, estimatedTime);

      return () => clearTimeout(timeout);
    } else {
      exportToPDF()
        .then(() => onPDFExported?.())
        .catch(console.error);
    }
  }, [shouldExportPDF, isTyping, letter.content, displayedText, exportToPDF, onPDFExported]);

  const textToDisplay = displayedText || letter.content || "";
  const markerIndex = textToDisplay.indexOf(PRODUCTS_MARKER);
  const hasProducts = markerIndex !== -1 && letter.products && letter.products.length > 0;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-5 right-5 w-[400px] max-h-[calc(100vh-40px)] bg-white border border-[#C9BDAA] rounded-lg shadow-lg z-[1000] flex flex-col overflow-hidden"
    >
      <LetterHeader letter={letter} onClose={onClose} onExportPDF={exportToPDF} />
      <LetterContent
        ref={letterContentRef}
        textToDisplay={textToDisplay}
        hasProducts={hasProducts}
        markerIndex={markerIndex}
        products={letter.products}
        isTyping={isTyping}
      />
    </motion.div>
  );
}

interface LetterHeaderProps {
  letter: Letter;
  onClose: () => void;
  onExportPDF: () => void;
}

function LetterHeader({ letter, onClose, onExportPDF }: LetterHeaderProps) {
  return (
    <div className="flex justify-between items-center px-5 py-4 border-b border-[#C9BDAA] bg-[#EAE5DE]">
      <h3 className="text-[#28292A] font-['Perfectly_Nineties'] text-2xl font-normal m-0">
        Letter to {letter.recipient}
      </h3>
      <div className="flex gap-2 items-center">
        <button
          onClick={onExportPDF}
          className="bg-transparent border border-[#C9BDAA] rounded px-3 py-1.5 flex items-center justify-center text-[#28292A] font-['Suisse_Int\'l'] text-xs font-normal cursor-pointer"
          title="Download PDF"
        >
          📥 PDF
        </button>
        <button
          onClick={onClose}
          className="bg-transparent border-none cursor-pointer p-1 flex items-center justify-center text-black"
          aria-label="Close letter"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

interface LetterContentProps {
  textToDisplay: string;
  hasProducts: boolean;
  markerIndex: number;
  products?: Letter["products"];
  isTyping: boolean;
}

const LetterContent = forwardRef<HTMLDivElement, LetterContentProps>(
  ({ textToDisplay, hasProducts, markerIndex, products, isTyping }, ref) => {
    if (!hasProducts) {
      return (
        <div
          ref={ref}
          className="p-6 overflow-y-auto flex-1 font-['Suisse_Int\'l'] text-base leading-relaxed text-[#28292A] whitespace-pre-wrap bg-white break-words tracking-wide flex flex-col letter-content-for-pdf"
        >
          {textToDisplay || "Loading..."}
          {isTyping && textToDisplay && (
            <span className="inline-block w-0.5 h-5 bg-[#28292A] ml-1 animate-[blink_1s_infinite]" />
          )}
        </div>
      );
    }

    const textBefore = textToDisplay.slice(0, markerIndex);
    const textAfter = textToDisplay.slice(markerIndex + PRODUCTS_MARKER.length);

    return (
      <div
        ref={ref}
        className="p-6 overflow-y-auto flex-1 font-['Suisse_Int\'l'] text-base leading-relaxed text-[#28292A] whitespace-pre-wrap bg-white break-words tracking-wide flex flex-col letter-content-for-pdf"
      >
        <div className="flex flex-col">
          <div className="whitespace-pre-wrap leading-[1.8] mb-5 pb-3 order-1">
            {textBefore.split("\n").map((line, index, array) => (
              <span key={index}>
                {line || "\u00A0"}
                {index < array.length - 1 && <br />}
              </span>
            ))}
          </div>

          {products && products.length > 0 && (
            <div className="grid grid-cols-3 gap-3 my-4 order-2 w-full">
              {products.map((product) => (
                <SmallLetterProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="whitespace-pre-wrap leading-[1.8] mt-5 pt-3 order-3">
            {textAfter.split("\n").map((line, index, array) => (
              <span key={index}>
                {line || "\u00A0"}
                {index < array.length - 1 && <br />}
              </span>
            ))}
            {isTyping && (
              <span className="inline-block w-0.5 h-5 bg-[#28292A] ml-1 animate-[blink_1s_infinite]" />
            )}
          </div>
        </div>
      </div>
    );
  }
);

LetterContent.displayName = "LetterContent";

function SmallLetterProductCard({ product }: { product: WishlistProduct }) {
  return (
    <div className="relative w-full flex flex-col overflow-hidden rounded-none bg-white border border-[#C9BDAA]">
      <div className="w-full flex-shrink-0">
        <img
          src="/images/product_container.svg"
          alt=""
          className="w-full h-auto block"
        />
      </div>

      <div className="w-full h-[100px] flex items-center justify-center overflow-hidden flex-shrink-0">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover border-l border-r border-b border-black"
        />
      </div>

      <div className="p-2 bg-white flex flex-col gap-1 flex-shrink-0 border-l border-r border-b border-black">
        <h3 className="text-[#484748] font-['Perfectly_Nineties'] text-sm font-normal leading-[14px] tracking-[-0.42px] m-0 p-0 break-words overflow-hidden text-ellipsis line-clamp-2">
          {product.title}
        </h3>
        <p className="text-[#484748] font-['Suisse_Int\'l'] text-[10px] font-normal leading-[14px] m-0 p-0 break-words overflow-hidden text-ellipsis line-clamp-2">
          {product.description1}
        </p>
      </div>
    </div>
  );
}

