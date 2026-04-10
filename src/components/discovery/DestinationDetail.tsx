import { motion } from "framer-motion";
import { X, MapPin, Shield, TrendingUp, Users, Utensils, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DestinationDetailProps {
  destination: any;
  onClose: () => void;
  onAddToTrip: () => void;
}

const VISA_INFO: Record<string, { label: string; desc: string }> = {
  free: { label: "Visa free", desc: "No visa needed — just book and go!" },
  voa: { label: "Visa on arrival", desc: "Get your visa at the airport on arrival." },
  e_visa: { label: "e-Visa required", desc: "Apply online before travelling." },
  required: { label: "Visa required", desc: "Visit the embassy to apply in advance." },
};

const BUDGET_EST: Record<string, string> = {
  budget: "₹15,000 – ₹30,000 / person / week",
  mid: "₹30,000 – ₹75,000 / person / week",
  premium: "₹75,000 – ₹1,50,000 / person / week",
  luxury: "₹1,50,000+ / person / week",
};

const DestinationDetail = ({ destination, onClose, onAddToTrip }: DestinationDetailProps) => {
  const visa = VISA_INFO[destination.visa_status_in || "required"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[85vh] bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">{destination.name}</h2>
              <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-4 h-4" />
                {destination.country}{destination.region ? ` · ${destination.region}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient">{destination.fit_score}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Fit score</div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Match reason */}
          {destination.match_reason && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm font-medium text-foreground">Why this matches you</p>
              <p className="text-sm text-muted-foreground mt-1">"{destination.match_reason}"</p>
            </div>
          )}

          {/* Description */}
          {destination.description && (
            <p className="text-sm text-foreground/80 leading-relaxed">{destination.description}</p>
          )}

          {/* Experience highlights */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Experience highlights</h3>
            <div className="flex flex-wrap gap-1.5">
              {destination.experience_tags?.map((tag: string) => (
                <span key={tag} className="px-3 py-1.5 rounded-full text-xs bg-muted text-foreground border border-border font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">{visa.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{visa.desc}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">💰</span>
                <span className="text-xs font-semibold text-foreground">Budget estimate</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{BUDGET_EST[destination.budget_level || "mid"]}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Crowd level</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(destination.crowd_level / 10) * 100}%`,
                    backgroundColor: destination.crowd_level > 7 ? "hsl(var(--destructive))" : destination.crowd_level > 4 ? "hsl(var(--accent))" : "hsl(var(--success))",
                  }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{destination.crowd_level}/10</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Trending</span>
              </div>
              <p className="text-[11px] text-muted-foreground capitalize">{destination.trend_direction} · Freshness {destination.freshness_score}%</p>
            </div>
          </div>

          {/* Dietary friendly */}
          {destination.dietary_friendly?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Utensils className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Dietary-friendly</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {destination.dietary_friendly.map((d: string) => (
                  <span key={d} className="px-2.5 py-1 rounded-full text-[11px] bg-muted text-muted-foreground border border-border capitalize">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={onAddToTrip}
            className="w-full h-12 gradient-primary border-0 text-primary-foreground shadow-lg hover:shadow-xl text-sm font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to trip
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DestinationDetail;
