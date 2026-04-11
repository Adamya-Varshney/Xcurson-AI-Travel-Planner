import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface WishlistHeartProps {
  isWishlisted: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

const WishlistHeart = ({ isWishlisted, onClick, className }: WishlistHeartProps) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(e); }}
    className={cn(
      "p-1.5 rounded-full transition-all hover:scale-110",
      isWishlisted
        ? "text-red-500 bg-red-50 hover:bg-red-100"
        : "text-muted-foreground bg-muted hover:bg-muted/80",
      className
    )}
    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
  >
    <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
  </button>
);

export default WishlistHeart;
