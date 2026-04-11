import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, IndianRupee, ArrowRight } from "lucide-react";

interface BudgetSummary {
  estimated_total?: number;
  per_head?: number;
  breakdown?: Record<string, number>;
}

interface ItinerarySummaryProps {
  title: string;
  cities: string[];
  daysCount: number;
  totalCost: number;
  budgetSummary: BudgetSummary;
}

const ItinerarySummary = ({ title, cities, daysCount, totalCost, budgetSummary }: ItinerarySummaryProps) => {
  const breakdown = budgetSummary?.breakdown || {};

  return (
    <div className="space-y-4">
      {/* City timeline */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Route</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {cities.map((city, i) => (
              <div key={city} className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <MapPin className="w-3 h-3" /> {city}
                </Badge>
                {i < cities.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{daysCount} days</p>
        </CardContent>
      </Card>

      {/* Cost breakdown */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Budget Estimate</h3>
          <div className="space-y-2">
            {Object.entries(breakdown).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground capitalize">{key}</span>
                <span className="font-medium text-foreground flex items-center gap-0.5">
                  <IndianRupee className="w-3 h-3" />
                  {(value as number)?.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
            <div className="border-t border-border pt-2 mt-2 flex items-center justify-between">
              <span className="font-semibold text-foreground text-sm">Total</span>
              <span className="font-bold text-primary text-base flex items-center gap-0.5">
                <IndianRupee className="w-4 h-4" />
                {totalCost?.toLocaleString("en-IN")}
              </span>
            </div>
            {budgetSummary?.per_head && budgetSummary.per_head !== totalCost && (
              <p className="text-xs text-muted-foreground">
                ≈ ₹{budgetSummary.per_head.toLocaleString("en-IN")} per person
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ItinerarySummary;
