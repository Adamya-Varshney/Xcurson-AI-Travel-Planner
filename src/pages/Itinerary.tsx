import { useState, useCallback } from "react";
import { addDays, format } from "date-fns";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, List, BarChart3 } from "lucide-react";
import ItinerarySetup from "@/components/itinerary/ItinerarySetup";
import DayView from "@/components/itinerary/DayView";
import ItinerarySummary from "@/components/itinerary/ItinerarySummary";
import AIEditBar from "@/components/itinerary/AIEditBar";
import ResuggestModal from "@/components/itinerary/ResuggestModal";
import ConfirmItineraryBar from "@/components/itinerary/ConfirmItineraryBar";
import ExpenseCalculator from "@/components/itinerary/ExpenseCalculator";
import TransportOptionsView, { type TransportOption } from "@/components/itinerary/TransportOptionsView";
import type { Activity } from "@/components/itinerary/TimeBlockCard";

type ViewState = "setup" | "fetching-transport" | "transport-select" | "generating" | "view";

const Itinerary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillDestination = searchParams.get("destination") || "";
  const [viewState, setViewState] = useState<ViewState>("setup");
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<any>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [changeSummary, setChangeSummary] = useState<string | null>(null);

  const [resuggestingSlot, setResuggestingSlot] = useState<string | null>(null);
  const [resuggestData, setResuggestData] = useState<{
    dayNumber: number;
    timeSlot: string;
    alternatives: Activity[];
  } | null>(null);

  const [tripStartDate, setTripStartDate] = useState<Date | null>(null);

  // New: outbound transport selection state
  const [setupPayload, setSetupPayload] = useState<{
    cities: string[];
    daysCount: number;
    tripMode: string;
    startDate: Date;
    startLocation: string;
  } | null>(null);
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([]);
  const [selectedTransportId, setSelectedTransportId] = useState<string | null>(null);

  // Step 1: setup → fetch outbound transport options
  const handleSetupSubmit = useCallback(async (
    cities: string[],
    daysCount: number,
    tripMode: string,
    startDate: Date,
    startLocation: string,
  ) => {
    if (!user) return;
    setSetupPayload({ cities, daysCount, tripMode, startDate, startLocation });
    setTripStartDate(startDate);
    setViewState("fetching-transport");
    setSelectedTransportId(null);
    setTransportOptions([]);

    try {
      const { data, error } = await supabase.functions.invoke("fetch-transport-options", {
        body: {
          from: startLocation,
          to: cities[0],
          start_date: startDate.toISOString().split("T")[0],
          trip_mode: tripMode,
        },
      });
      if (error) throw new Error(error.message || "Failed to fetch transport options");
      if (data?.error) throw new Error(data.error);

      const opts: TransportOption[] = data?.options || [];
      if (opts.length === 0) {
        toast({
          title: "No transport options found",
          description: "Continuing without a pre-selected mode.",
        });
        // Skip straight to generate without an outbound choice
        await runGenerate({ cities, daysCount, tripMode, startDate, startLocation }, null);
        return;
      }

      setTransportOptions(opts);
      setSelectedTransportId(opts[0].id);
      setViewState("transport-select");
    } catch (e: any) {
      console.error("Transport fetch error:", e);
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setViewState("setup");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Step 2: user confirms a transport option → generate itinerary
  const runGenerate = useCallback(async (
    payload: { cities: string[]; daysCount: number; tripMode: string; startDate: Date; startLocation: string },
    outboundOption: TransportOption | null,
  ) => {
    if (!user) return;
    setIsGenerating(true);
    setViewState("generating");
    setIsConfirmed(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-itinerary", {
        body: {
          cities: payload.cities,
          days_count: payload.daysCount,
          trip_mode: payload.tripMode,
          start_date: payload.startDate.toISOString().split("T")[0],
          start_location: payload.startLocation,
          outbound_option: outboundOption,
        },
      });

      if (error) throw new Error(error.message || "Generation failed");

      if (data?.error) {
        toast({
          title: data.status === 402 ? "AI balance needed" : "Could not generate itinerary",
          description: data.error,
          variant: "destructive",
        });
        setViewState(outboundOption ? "transport-select" : "setup");
        return;
      }

      if (!data?.itinerary) throw new Error("No itinerary was returned.");

      setItinerary(data.itinerary);
      setViewState("view");
      toast({ title: "Itinerary ready! 🗺️" });
    } catch (e: any) {
      console.error("Generate error:", e);
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setViewState(outboundOption ? "transport-select" : "setup");
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const handleConfirmTransport = useCallback(() => {
    if (!setupPayload || !selectedTransportId) return;
    const chosen = transportOptions.find((o) => o.id === selectedTransportId) || null;
    runGenerate(setupPayload, chosen);
  }, [setupPayload, selectedTransportId, transportOptions, runGenerate]);

  const handleUpdateSlot = useCallback((dayNumber: number, slot: "morning" | "afternoon" | "evening", activity: Activity) => {
    if (!itinerary) return;
    const updatedContent = (itinerary.content as any[]).map((day: any) => {
      if (day.day_number === dayNumber) return { ...day, [slot]: activity };
      return day;
    });
    setItinerary({ ...itinerary, content: updatedContent, is_user_edited: true });
  }, [itinerary]);

  const handleResuggestSlot = useCallback(async (dayNumber: number, slot: "morning" | "afternoon" | "evening") => {
    if (!itinerary) return;
    const key = `${dayNumber}-${slot}`;
    setResuggestingSlot(key);

    try {
      const { data, error } = await supabase.functions.invoke("resuggest-slot", {
        body: { itinerary_id: itinerary.id, day_number: dayNumber, time_slot: slot },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setResuggestData({ dayNumber, timeSlot: slot, alternatives: data.alternatives || [] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setResuggestingSlot(null);
    }
  }, [itinerary]);

  const handlePickAlternative = useCallback((activity: Activity) => {
    if (!resuggestData || !itinerary) return;
    handleUpdateSlot(resuggestData.dayNumber, resuggestData.timeSlot as any, activity);
    setResuggestData(null);
    toast({ title: "Activity swapped! ✨" });
  }, [resuggestData, itinerary, handleUpdateSlot]);

  const handleAIEdit = useCallback(async (instruction: string) => {
    if (!itinerary) return;
    setIsEditing(true);
    setChangeSummary(null);

    try {
      const { data, error } = await supabase.functions.invoke("edit-itinerary", {
        body: { itinerary_id: itinerary.id, edit_instruction: instruction },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setItinerary(data.itinerary);
      setChangeSummary(data.change_summary || "Itinerary updated.");
      toast({ title: "Itinerary updated! ✏️" });
      setTimeout(() => setChangeSummary(null), 5000);
    } catch (e: any) {
      toast({ title: "Edit failed", description: e.message, variant: "destructive" });
    } finally {
      setIsEditing(false);
    }
  }, [itinerary]);

  const handleConfirmItinerary = useCallback(async () => {
    if (!itinerary || !user) return;

    try {
      const startDateStr = tripStartDate ? format(tripStartDate, "yyyy-MM-dd") : null;
      const endDateStr = tripStartDate && itinerary.days_count
        ? format(addDays(tripStartDate, itinerary.days_count - 1), "yyyy-MM-dd")
        : null;

      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          title: itinerary.title,
          destination: itinerary.cities?.join(", ") || "",
          trip_mode: "solo",
          status: "booked",
          start_date: startDateStr,
          end_date: endDateStr,
        })
        .select()
        .single();

      if (tripError) throw tripError;

      const { error: linkError } = await supabase
        .from("itineraries")
        .update({ trip_id: trip.id })
        .eq("id", itinerary.id);

      if (linkError) throw linkError;

      setIsConfirmed(true);
      setItinerary({ ...itinerary, trip_id: trip.id });
      toast({ title: "Trip confirmed! 🎉", description: "Added to your upcoming trips." });

      setTimeout(() => navigate("/trips"), 2000);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }, [itinerary, user, navigate, tripStartDate]);

  const days = (itinerary?.content as any[]) || [];
  const isLoading = viewState === "fetching-transport" || viewState === "generating";
  const loadingText =
    viewState === "fetching-transport"
      ? "Searching the web for transport options..."
      : "Crafting your itinerary...";

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 border-b border-border">
        <Link to="/trips">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9"><ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /></Button>
        </Link>
        <h1 className="text-base sm:text-lg font-display font-bold text-foreground truncate">
          {viewState === "view" ? itinerary?.title || "Itinerary" : "Create Itinerary"}
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {viewState === "setup" && (
          <ItinerarySetup onGenerate={handleSetupSubmit} isGenerating={false} prefillCity={prefillDestination} />
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-muted-foreground font-medium text-sm sm:text-base">{loadingText}</p>
            <p className="text-xs text-muted-foreground/60">This may take a moment</p>
          </div>
        )}

        {viewState === "transport-select" && setupPayload && (
          <TransportOptionsView
            from={setupPayload.startLocation}
            to={setupPayload.cities[0]}
            options={transportOptions}
            selectedId={selectedTransportId}
            onSelect={setSelectedTransportId}
            onBack={() => setViewState("setup")}
            onConfirm={handleConfirmTransport}
            isGenerating={isGenerating}
          />
        )}

        {viewState === "view" && itinerary && (
          <div className="pb-36 sm:pb-32">
            <Tabs defaultValue="days">
              <TabsList className="w-full mb-3 sm:mb-4">
                <TabsTrigger value="days" className="flex-1 gap-1 text-xs sm:text-sm">
                  <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Day by Day
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex-1 gap-1 text-xs sm:text-sm">
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="days" className="space-y-4 sm:space-y-6">
                {days.map((day: any) => (
                  <DayView
                    key={day.day_number}
                    day={day}
                    startDate={tripStartDate ? tripStartDate.toISOString().split("T")[0] : null}
                    onUpdateSlot={handleUpdateSlot}
                    onResuggestSlot={handleResuggestSlot}
                    resuggestingSlot={resuggestingSlot}
                  />
                ))}
              </TabsContent>

              <TabsContent value="summary" className="space-y-3 sm:space-y-4">
                <ItinerarySummary
                  title={itinerary.title}
                  cities={itinerary.cities}
                  daysCount={itinerary.days_count}
                  totalCost={itinerary.total_est_cost_inr}
                  budgetSummary={itinerary.budget_summary as any}
                />
                <ExpenseCalculator />
              </TabsContent>
            </Tabs>

            {!isConfirmed && (
              <AIEditBar
                onSubmit={handleAIEdit}
                isEditing={isEditing}
                changeSummary={changeSummary}
              />
            )}

            <ConfirmItineraryBar
              onConfirm={handleConfirmItinerary}
              isConfirmed={isConfirmed}
            />

            {resuggestData && (
              <ResuggestModal
                open={!!resuggestData}
                onClose={() => setResuggestData(null)}
                alternatives={resuggestData.alternatives}
                onPick={handlePickAlternative}
                dayNumber={resuggestData.dayNumber}
                timeSlot={resuggestData.timeSlot}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Itinerary;
