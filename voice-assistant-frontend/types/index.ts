export interface WishlistProduct {
  id: string;
  title: string;
  description1: string;
  description2: string;
  description3: string;
  image: string;
  price: number;
  category: string;
  isRecommendation?: boolean;
}

export interface Letter {
  id: string;
  recipient: string;
  content: string;
  products?: WishlistProduct[];
}

export type GameChoice = "rock" | "paper" | "scissors";
export type GameResult = "win" | "lose" | "tie";

export interface GameState {
  userChoice: GameChoice | null;
  santaChoice: GameChoice | null;
  result: GameResult | null;
  message: string;
}

export interface RpcPayload {
  action: string;
  [key: string]: unknown;
}

