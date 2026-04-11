import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ChipSelector from "@/components/onboarding/ChipSelector";
import { MapPin, Plus, Minus, X, Sparkles, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItinerarySetupProps {
  onGenerate: (cities: string[], daysCount: number, tripMode: string, startDate: Date) => void;
  isGenerating: boolean;
  prefillCity?: string;
}

const ItinerarySetup = ({ onGenerate, isGenerating, prefillCity }: ItinerarySetupProps) => {
  const [cityInput, setCityInput] = useState("");
  const [cities, setCities] = useState<string[]>(prefillCity ? [prefillCity] : []);
  const [daysCount, setDaysCount] = useState(3);
  const [tripMode, setTripMode] = useState("solo");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);

  const addCity = () => {
    const trimmed = cityInput.trim();
    if (trimmed && !cities.includes(trimmed)) {
      setCities((prev) => [...prev, trimmed]);
      setCityInput("");
    }
  };

  const removeCity = (city: string) => {
    setCities((prev) => prev.filter((c) => c !== city));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCity();
    }
  };

  const canGenerate = cities.length > 0 && !!startDate;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-display font-bold text-foreground">Create Itinerary</h2>
        <p className="text-sm text-muted-foreground">AI will craft a day-by-day plan tailored to your profile</p>
      </div>

      {/* Cities input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Cities to visit</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Add a city..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={addCity} disabled={!cityInput.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {cities.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {cities.map((city) => (
              <Badge key={city} variant="secondary" className="gap-1 pr-1 py-1">
                {city}
                <button onClick={() => removeCity(city)} className="ml-1 hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Start date picker */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Start date <span className="text-destructive">*</span>
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : "Pick a start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Duration stepper */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Duration</label>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDaysCount((d) => Math.max(1, d - 1))}
            disabled={daysCount <= 1}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <div className="flex-1 text-center">
            <span className="text-3xl font-display font-bold text-foreground">{daysCount}</span>
            <span className="text-sm text-muted-foreground ml-2">{daysCount === 1 ? "day" : "days"}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDaysCount((d) => Math.min(14, d + 1))}
            disabled={daysCount >= 14}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Trip mode */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Trip mode</label>
        <ChipSelector
          options={["Solo", "Partner", "Group", "Family"]}
          selected={[tripMode.charAt(0).toUpperCase() + tripMode.slice(1)]}
          onChange={(s) => setTripMode((s[0] || "Solo").toLowerCase())}
          multiple={false}
        />
      </div>

      {/* Generate button */}
      <Button
        onClick={() => startDate && onGenerate(cities, daysCount, tripMode, startDate)}
        disabled={isGenerating || !canGenerate}
        className="w-full gradient-primary border-0 h-12 text-base font-semibold"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Generating...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate Itinerary
          </span>
        )}
      </Button>
      {!startDate && cities.length > 0 && (
        <p className="text-xs text-destructive text-center">Please select a start date to continue</p>
      )}
    </div>
  );
};

export default ItinerarySetup;
