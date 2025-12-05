"use client";

import type { WishlistProduct } from "@/types";
import RecommendedProductCard from "./RecommendedProductCard";

interface RecommendationsSectionProps {
  products: WishlistProduct[];
  onAddToWishlist: (product: WishlistProduct) => void;
}

/**
 * Recommendations section component
 * Displays grid of recommended products with responsive layout
 */
export default function RecommendationsSection({
  products,
  onAddToWishlist,
}: RecommendationsSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="flex min-h-[500px] py-[60px] px-5 flex-col items-center gap-5 flex-shrink-0 self-stretch border-t border-b border-[#C9BDAA] bg-[#EAE5DE] w-full">
      <div className="flex w-full max-w-[1200px] min-h-[400px] flex-col justify-start items-center gap-10 px-5">
        <h2 className="text-[#28292A] text-center font-['Suisse_Int\'l'] text-2xl font-normal leading-normal m-0 py-3 px-4">
          Santa&apos;s Recommendations for You ({products.length}{" "}
          {products.length === 1 ? "suggestion" : "suggestions"})
        </h2>

        <div className="grid grid-cols-4 gap-5 w-fit max-w-[1200px] justify-start recommendations-grid">
          {products.map((product) => (
            <RecommendedProductCard
              key={product.id}
              product={product}
              onAddToWishlist={onAddToWishlist}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

