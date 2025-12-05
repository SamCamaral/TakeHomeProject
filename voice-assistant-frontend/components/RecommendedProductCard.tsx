"use client";

import { motion } from "framer-motion";
import type { WishlistProduct } from "@/types";

interface RecommendedProductCardProps {
  product: WishlistProduct;
  onAddToWishlist: (product: WishlistProduct) => void;
}

/**
 * Recommended product card with hover effects
 * Clicking adds the product to the wishlist
 */
export default function RecommendedProductCard({
  product,
  onAddToWishlist,
}: RecommendedProductCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative w-[275px] flex flex-col overflow-hidden rounded-none bg-white mx-auto cursor-pointer transition-transform duration-200"
      onClick={() => onAddToWishlist(product)}
    >
      <div className="absolute top-2 right-2 bg-[#7CFF98] text-[#28292A] px-2 py-1 rounded text-[10px] font-semibold z-10 font-['Suisse_Int\'l']">
        RECOMMENDED
      </div>

      <div className="w-full flex-shrink-0">
        <img
          src="/images/product_container.svg"
          alt=""
          className="w-full h-auto block"
        />
      </div>

      <div className="w-full h-[275px] flex items-center justify-center overflow-hidden flex-shrink-0">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover border-l border-r border-b border-black"
        />
      </div>

      <div className="p-4 bg-white flex flex-col gap-2 flex-shrink-0 min-h-auto overflow-visible w-full border-t-0 border-l border-r border-b border-black">
        <h3 className="text-[#484748] font-['Perfectly_Nineties'] text-[clamp(20px,4vw,28px)] font-normal leading-[1.1] tracking-[-0.84px] m-0 p-0 break-words overflow-visible">
          {product.title}
        </h3>
        <p className="text-[#484748] font-['Suisse_Int\'l'] text-base font-normal leading-6 m-0 p-0 break-words">
          {product.description1}
        </p>
        {product.description2 && (
          <p className="text-[#484748] font-['Suisse_Int\'l'] text-base font-normal leading-6 m-0 p-0 break-words">
            {product.description2}
          </p>
        )}
        {product.description3 && (
          <p className="text-[#484748] font-['Suisse_Int\'l'] text-base font-normal leading-6 m-0 p-0 break-words">
            {product.description3}
          </p>
        )}
      </div>
    </motion.div>
  );
}

