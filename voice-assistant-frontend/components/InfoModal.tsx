"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CloseIcon } from "./CloseIcon";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Information modal explaining how the project works
 */
export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[200]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#C9BDAA]">
              {/* Header */}
              <div className="sticky top-0 bg-[#EAE5DE] text-[#28292A] p-6 flex justify-between items-center border-b border-[#C9BDAA]">
                <h2
                  className="text-2xl font-normal m-0"
                  style={{
                    fontFamily: '"Perfectly Nineties", serif',
                  }}
                >
                  How It Works
                </h2>
                <button
                  onClick={onClose}
                  className="bg-transparent border-none cursor-pointer p-1 flex items-center justify-center text-black hover:opacity-70 transition-opacity"
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Introduction */}
                <section>
                  <h3
                    className="text-xl font-bold mb-3 text-[#28292A]"
                    style={{
                      fontFamily: '"Perfectly Nineties", serif',
                    }}
                  >
                    Welcome to Letter to Santa! 🎅
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    This is an interactive voice assistant powered by AI that lets you talk to Santa Claus! 
                    You can add items to your Christmas wishlist, create personalized letters, play games, 
                    and get product recommendations—all through natural conversation.
                  </p>
                </section>

                {/* What the Avatar Can Do */}
                <section>
                  <h3
                    className="text-xl font-bold mb-3 text-[#28292A]"
                    style={{
                      fontFamily: '"Perfectly Nineties", serif',
                    }}
                  >
                    What Santa Can Do
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-2xl mr-3">🎁</span>
                      <div>
                        <strong>Add Gifts to Your Wishlist:</strong> Tell Santa what you want for Christmas, 
                        and he&apos;ll search for similar products and add them to your wishlist automatically.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-2xl mr-3">📝</span>
                      <div>
                        <strong>Create Personalized Letters:</strong> Ask Santa to help you write a letter 
                        to someone special (like family or friends). The letter will include your wishlist items 
                        and you can edit it as many times as you want.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-2xl mr-3">✂️</span>
                      <div>
                        <strong>Play Rock, Paper, Scissors:</strong> Challenge Santa to a fun game! 
                        Just ask to play and see who wins.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-2xl mr-3">💡</span>
                      <div>
                        <strong>Get Product Recommendations:</strong> Based on your wishlist, Santa can 
                        suggest similar or complementary products you might like.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-2xl mr-3">📄</span>
                      <div>
                        <strong>Export Letters as PDF:</strong> Download your personalized letters as 
                        beautiful PDF files to share or keep.
                      </div>
                    </li>
                  </ul>
                </section>

                {/* Voice Commands */}
                <section>
                  <h3
                    className="text-xl font-bold mb-3 text-[#28292A]"
                    style={{
                      fontFamily: '"Perfectly Nineties", serif',
                    }}
                  >
                    Voice Commands
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <strong className="text-gray-800">To add a gift:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1 text-gray-700 space-y-1">
                        <li>&quot;I want an iPhone for Christmas&quot;</li>
                        <li>&quot;Can you add AirPods to my wishlist?&quot;</li>
                        <li>&quot;I&apos;d like a gaming laptop&quot;</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-gray-800">To create a letter:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1 text-gray-700 space-y-1">
                        <li>&quot;Santa, help me create a letter for my dad&quot;</li>
                        <li>&quot;Can you write a letter to my mom telling her I love her?&quot;</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-gray-800">To edit a letter:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1 text-gray-700 space-y-1">
                        <li>&quot;Add that I&apos;m excited to see them&quot;</li>
                        <li>&quot;Make the letter more personal&quot;</li>
                        <li>&quot;Include all my gifts in the letter&quot;</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-gray-800">To play a game:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1 text-gray-700 space-y-1">
                        <li>&quot;I want to play Rock, Paper, Scissors with you&quot;</li>
                        <li>&quot;Let&apos;s play Rock, Paper, Scissors&quot;</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-gray-800">To get recommendations:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1 text-gray-700 space-y-1">
                        <li>&quot;Can you recommend similar products?&quot;</li>
                        <li>&quot;What else might I like?&quot;</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-gray-800">To download PDF:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1 text-gray-700 space-y-1">
                        <li>&quot;Download my letter as PDF&quot;</li>
                        <li>&quot;Export the letter to PDF&quot;</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Tips */}
                <section>
                  <h3
                    className="text-xl font-bold mb-3 text-[#28292A]"
                    style={{
                      fontFamily: '"Perfectly Nineties", serif',
                    }}
                  >
                    Tips
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#28292A] mr-2">•</span>
                      <span>Speak naturally—Santa understands casual conversation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#28292A] mr-2">•</span>
                      <span>When adding gifts, be specific about the item name (e.g., &quot;iPhone&quot; instead of &quot;new phone&quot;)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#28292A] mr-2">•</span>
                      <span>You can add multiple gifts in one conversation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#28292A] mr-2">•</span>
                      <span>All your gifts will automatically be included in your letters</span>
                    </li>
                  </ul>
                </section>
              </div>

              {/* Footer */}
              <div className="bg-[#EAE5DE] p-4 text-center text-sm text-[#28292A] border-t border-[#C9BDAA]">
                Powered by Tavus Avatar • LiveKit • OpenAI
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

