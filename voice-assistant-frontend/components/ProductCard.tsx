"use client";

import type { WishlistProduct } from "@/types";

interface ProductCardProps {
  product: WishlistProduct;
}

/**
 * Product card component for displaying wishlist items
 * Uses consistent styling with pixel-perfect design
 */
export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="relative w-[275px] flex flex-col overflow-hidden rounded-none bg-white mx-auto">
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
        <h3 className="text-[#484748] font-['Perfectly_Nineties'] text-[clamp(18px,2vw,28px)] font-normal leading-[1.1] tracking-[-0.84px] m-0 p-0 break-words overflow-visible">
          {product.title}
        </h3>
        <div className="flex w-full min-h-[76px] flex-col justify-start text-[#484748] font-['Suisse_Int\'l'] text-[clamp(14px,1.5vw,16px)] font-normal leading-6 gap-0 overflow-visible">
          {product.description1 && (
            <p className="m-0 p-0 leading-6">{product.description1}</p>
          )}
          {product.description2 && (
            <p className="m-0 p-0 leading-6">{product.description2}</p>
          )}
          {product.description3 && (
            <p className="m-0 p-0 leading-6">{product.description3}</p>
          )}
        </div>
      </div>
    </div>
  );
}

