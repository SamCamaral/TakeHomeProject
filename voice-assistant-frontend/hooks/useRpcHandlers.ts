import { useEffect } from "react";
import { Room } from "livekit-client";
import type { WishlistProduct, Letter, GameState, RpcPayload } from "@/types";

interface UseRpcHandlersProps {
  room: Room | null;
  onWishlistUpdate: (product: WishlistProduct) => void;
  onLetterUpdate: (letter: Letter) => void;
  onLetterVisibilityChange: (visible: boolean) => void;
  onPdfExportRequest: () => void;
  onRecommendationsUpdate: (products: WishlistProduct[]) => void;
  onGameVisibilityChange: (visible: boolean) => void;
  onGameStateUpdate: (state: Partial<GameState>) => void;
}

/**
 * Centralized RPC handler registration
 * Separates RPC logic from component rendering for better testability
 */
export function useRpcHandlers({
  room,
  onWishlistUpdate,
  onLetterUpdate,
  onLetterVisibilityChange,
  onPdfExportRequest,
  onRecommendationsUpdate,
  onGameVisibilityChange,
  onGameStateUpdate,
}: UseRpcHandlersProps) {
  useEffect(() => {
    if (!room) return;

    const handleWishlistRpc = async (data: { payload?: string | RpcPayload }): Promise<string> => {
      try {
        if (!data?.payload) {
          throw new Error("Invalid RPC data format");
        }

        const payload: RpcPayload =
          typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;

        if (payload.action === "add" && payload.product) {
          const productData = payload.product as unknown;
          const product: WishlistProduct = {
            id: (productData as { id: string }).id,
            title: (productData as { title: string }).title,
            description1: (productData as { description1?: string }).description1 || "",
            description2: (productData as { description2?: string }).description2 || "",
            description3: (productData as { description3?: string }).description3 || "",
            image: (productData as { image?: string }).image || "/images/airpods.png",
            price: (productData as { price?: number }).price || 0,
            category: (productData as { category?: string }).category || "",
          };
          onWishlistUpdate(product);
        }

        return "Success";
      } catch (error) {
        console.error("Error processing wishlist data:", error);
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    };

    const handleLetterRpc = async (data: { payload?: string | RpcPayload }): Promise<string> => {
      try {
        if (!data?.payload) {
          throw new Error("Invalid RPC data format");
        }

        const payload: RpcPayload =
          typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;

        if (payload.action === "show" || payload.action === "update") {
          if (payload.letter) {
            onLetterUpdate(payload.letter as Letter);
            onLetterVisibilityChange(true);
          }
        } else if (payload.action === "hide") {
          onLetterVisibilityChange(false);
        }

        return "Success";
      } catch (error) {
        console.error("Error processing letter data:", error);
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    };

    const handlePdfExportRpc = async (): Promise<string> => {
      try {
        onPdfExportRequest();
        return "Success";
      } catch (error) {
        console.error("Error processing PDF export request:", error);
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    };

    const handleRecommendationsRpc = async (
      data: { payload?: string | RpcPayload }
    ): Promise<string> => {
      try {
        if (!data?.payload) {
          throw new Error("Invalid RPC data format");
        }

        const payload: RpcPayload =
          typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;

        if (payload.action === "show_recommendations" && payload.products) {
          const productsData = payload.products as unknown[];
          const products: WishlistProduct[] = productsData.map((p: unknown) => ({
            id: (p as { id: string }).id,
            title: (p as { title: string }).title,
            description1: (p as { description1?: string }).description1 || "",
            description2: (p as { description2?: string }).description2 || "",
            description3: (p as { description3?: string }).description3 || "",
            image: (p as { image?: string }).image || "/images/airpods.png",
            price: (p as { price?: number }).price || 0,
            category: (p as { category?: string }).category || "",
            isRecommendation: true,
          }));
          onRecommendationsUpdate(products);
        }

        return "Success";
      } catch (error) {
        console.error("Error processing recommendations data:", error);
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    };

    const handleGameRpc = async (data: { payload?: string | RpcPayload }): Promise<string> => {
      try {
        if (!data?.payload) {
          throw new Error("Invalid RPC data format");
        }

        const payload: RpcPayload =
          typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;

        if (payload.action === "show") {
          onGameVisibilityChange(true);
          onGameStateUpdate({
            userChoice: null,
            santaChoice: null,
            result: null,
            message: (payload.message as string) || "Choose your move!",
          });
        } else if (payload.action === "hide") {
          onGameVisibilityChange(false);
        } else if (payload.action === "update_message") {
          onGameStateUpdate({ message: (payload.message as string) || "" });
        }

        return "Success";
      } catch (error) {
        console.error("Error processing game data:", error);
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    };

    room.localParticipant.registerRpcMethod("client.addToWishlist", handleWishlistRpc);
    room.localParticipant.registerRpcMethod("client.showLetter", handleLetterRpc);
    room.localParticipant.registerRpcMethod("client.downloadLetterPDF", handlePdfExportRpc);
    room.localParticipant.registerRpcMethod("client.showRecommendations", handleRecommendationsRpc);
    room.localParticipant.registerRpcMethod("client.showRockPaperScissors", handleGameRpc);

    return () => {
      room.localParticipant.unregisterRpcMethod("client.addToWishlist");
      room.localParticipant.unregisterRpcMethod("client.showLetter");
      room.localParticipant.unregisterRpcMethod("client.downloadLetterPDF");
      room.localParticipant.unregisterRpcMethod("client.showRecommendations");
      room.localParticipant.unregisterRpcMethod("client.showRockPaperScissors");
    };
  }, [
    room,
    onWishlistUpdate,
    onLetterUpdate,
    onLetterVisibilityChange,
    onPdfExportRequest,
    onRecommendationsUpdate,
    onGameVisibilityChange,
    onGameStateUpdate,
  ]);
}

