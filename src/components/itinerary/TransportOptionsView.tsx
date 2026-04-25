import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Train, Ship, Car, Bus, Clock, IndianRupee, ArrowLeft, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TransportOption {
  id: string;
  category: string; // Flight | Train | Cruise | Private Conveyance | Bus
  provider: string;
  from: string;
  to: string;
  departure_time?: string;
  arrival_time?: string;
  duration_hrs: number;
  cost_inr: number;
  stops?: number;
  class_or_cabin?: string;
  booking_hint?: string;
  pros?: string[];
  cons?: string[];
}

interface TransportOptionsViewProps {
  from: string;
  to: string;
  options: TransportOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  isGenerating: boolean;
}

const iconForCategory = (cat: string) => {
  const c = cat.toLowerCase();
  if (c.includes("flight")) return Plane;
  if (c.includes("train")) return Train;
  if (c.includes("cruise") || c.includes("ferry")) return Ship;
  if (c.includes("bus")) return Bus;
  return Car;
};

const TransportOptionsView = ({
  from,
  to,
  options,
  selectedId,
  onSelect,
  onBack,
  onConfirm,
  isGenerating,
}: TransportOptionsViewProps) => {
  // Group by category for nicer presentation
  const grouped = options.reduce<Record<string, TransportOption[]>>((acc, o) => {
    (acc[o.category] = acc[o.category] || []).push(o);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-lg font-display font-bold text-foreground">Choose your way to {to}</h2>
          <p className="text-xs text-muted-foreground">Real options found via Google Search · {from} → {to}</p>
        </div>
      </div>

      {options.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No options found for this route. Try a different starting city.
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([category, opts]) => {
          const Icon = iconForCategory(category);
          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Icon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{category}</h3>
                <span className="text-xs text-muted-foreground">({opts.length})</span>
              </div>
              {opts.map((opt) => {
                const selected = selectedId === opt.id;
                return (
                  <Card
                    key={opt.id}
                    onClick={() => onSelect(opt.id)}
                    className={cn(
                      "cursor-pointer transition-all border",
                      selected
                        ? "border-primary ring-2 ring-primary/20 shadow-md"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{opt.provider}</p>
                          {opt.class_or_cabin && (
                            <p className="text-xs text-muted-foreground">{opt.class_or_cabin}</p>
                          )}
                        </div>
                        {selected && (
                          <Badge className="gap-1 bg-primary text-primary-foreground shrink-0">
                            <Check className="w-3 h-3" /> Selected
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {opt.departure_time && opt.arrival_time && (
                          <span>{opt.departure_time} → {opt.arrival_time}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {opt.duration_hrs}h
                        </span>
                        {typeof opt.stops === "number" && opt.stops > 0 && (
                          <span>{opt.stops} stop{opt.stops > 1 ? "s" : ""}</span>
                        )}
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <IndianRupee className="w-3 h-3" />
                          {opt.cost_inr.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {(opt.pros?.length || opt.cons?.length) && (
                        <div className="flex flex-wrap gap-1.5">
                          {opt.pros?.map((p, i) => (
                            <Badge key={`p-${i}`} variant="secondary" className="text-[10px] font-normal">
                              ✓ {p}
                            </Badge>
                          ))}
                          {opt.cons?.map((c, i) => (
                            <Badge key={`c-${i}`} variant="outline" className="text-[10px] font-normal text-muted-foreground">
                              · {c}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {opt.booking_hint && (
                        <p className="text-xs text-muted-foreground/80 italic">💡 {opt.booking_hint}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          );
        })
      )}

      <Button
        onClick={onConfirm}
        disabled={!selectedId || isGenerating}
        className="w-full gradient-primary border-0 h-12 text-base font-semibold"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Building itinerary...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Continue with selected option
          </span>
        )}
      </Button>
    </div>
  );
};

export default TransportOptionsView;
