import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Eye, MapPin, Shield, Heart } from "lucide-react";

interface DestinationCardProps {
  destination: {
    destination_id: string;
    name: string;
    country: string;
    region?: string;
    description?: string;
    landscape_type?: string[];
    crowd_level?: number;
    visa_status_in?: string;
    budget_level?: string;
    freshness_score?: number;
    trend_direction?: string;
    experience_tags?: string[];
    fit_score: number;
    match_reason?: string;
  };
  rank: number;
  onClick: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
}

const VISA_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: "Visa free", color: "text-green-600 bg-green-50 border-green-200" },
  voa: { label: "Visa on arrival", color: "text-amber-600 bg-amber-50 border-amber-200" },
  e_visa: { label: "e-Visa", color: "text-blue-600 bg-blue-50 border-blue-200" },
  required: { label: "Visa required", color: "text-red-500 bg-red-50 border-red-200" },
};

const BUDGET_ICONS: Record<string, string> = {
  budget: "💰",
  mid: "💰💰",
  premium: "💎",
  luxury: "💎💎",
};

const TrendIcon = ({ direction }: { direction?: string }) => {
  if (direction === "rising") return <TrendingUp className="w-3 h-3 text-green-500" />;
  if (direction === "cooling") return <TrendingDown className="w-3 h-3 text-blue-400" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
};

const DestinationCard = ({ destination, rank, onClick, isWishlisted, onToggleWishlist }: DestinationCardProps) => {
  const visa = VISA_LABELS[destination.visa_status_in || "required"];
  const crowdPercent = ((destination.crowd_level || 5) / 10) * 100;
  const freshnessPercent = destination.freshness_score || 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      onClick={onClick}
      className="rounded-2xl border border-border bg-card p-5 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            {rank <= 2 && destination.trend_direction === "rising" && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase gradient-primary text-primary-foreground">
                Rising
              </span>
            )}
            <h3 className="font-display font-bold text-lg text-foreground group-hover:text-gradient transition-colors">
              {destination.name}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {destination.country}{destination.region ? ` · ${destination.region}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onToggleWishlist && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleWishlist(); }}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </button>
          )}
          {/* Fit score circle */}
          <div className="relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <circle
              cx="24" cy="24" r="20" fill="none"
              stroke={destination.fit_score >= 70 ? "hsl(var(--success))" : destination.fit_score >= 50 ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))"}
              strokeWidth="3"
              strokeDasharray={`${(destination.fit_score / 100) * 125.6} 125.6`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
            {destination.fit_score}
          </span>
          </div>
        </div>
      </div>

      {/* Match reason */}
      {destination.match_reason && (
        <p className="text-sm text-foreground/80 mb-3 italic">
          "{destination.match_reason}"
        </p>
      )}

      {/* Tags row */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {destination.experience_tags?.slice(0, 4).map((tag) => (
          <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] bg-muted text-muted-foreground border border-border">
            {tag}
          </span>
        ))}
      </div>

      {/* Chips row: Visa, Budget, Trend */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${visa.color}`}>
          <Shield className="w-3 h-3" /> {visa.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {BUDGET_ICONS[destination.budget_level || "mid"]}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <TrendIcon direction={destination.trend_direction} />
          {destination.trend_direction}
        </span>
      </div>

      {/* Meters: Crowd & Freshness */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Crowd</span>
            <span className="text-[10px] text-muted-foreground">{destination.crowd_level}/10</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${crowdPercent}%`,
                backgroundColor: crowdPercent > 70 ? "hsl(var(--destructive))" : crowdPercent > 40 ? "hsl(var(--accent))" : "hsl(var(--success))",
              }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Freshness</span>
            <span className="text-[10px] text-muted-foreground">{freshnessPercent}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full gradient-ocean transition-all"
              style={{ width: `${freshnessPercent}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DestinationCard;
