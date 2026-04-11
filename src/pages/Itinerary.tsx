import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
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
import type { Activity } from "@/components/itinerary/TimeBlockCard";

type ViewState = "setup" | "loading" | "view";

const Itinerary = () => {
  const { user } = useAuth();
  const [viewState, setViewState] = useState<ViewState>("setup");
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<any>(null);

  // AI edit state
  const [isEditing, setIsEditing] = useState(false);
  const [changeSummary, setChangeSummary] = useState<string | null>(null);

  // Re-suggest state
  const [resuggestingSlot, setResuggestingSlot] = useState<string | null>(null);
  const [resuggestData, setResuggestData] = useState<{
    dayNumber: number;
    timeSlot: string;
    alternatives: Activity[];
  } | null>(null);

  const handleGenerate = useCallback(async (cities: string[], daysCount: number, tripMode: string) => {
    if (!user) return;
    setIsGenerating(true);
    setViewState("loading");

    try {
      const { data, error } = await supabase.functions.invoke("generate-itinerary", {
        body: { cities, days_count: daysCount, trip_mode: tripMode },
      });

      if (error) throw new Error(error.message || "Generation failed");
      if (data?.error) throw new Error(data.error);

      setItinerary(data.itinerary);
      setViewState("view");
      toast({ title: "Itinerary ready! 🗺️" });
    } catch (e: any) {
      console.error("Generate error:", e);
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setViewState("setup");
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const handleUpdateSlot = useCallback((dayNumber: number, slot: "morning" | "afternoon" | "evening", activity: Activity) => {
    if (!itinerary) return;
    const updatedContent = (itinerary.content as any[]).map((day: any) => {
      if (day.day_number === dayNumber) {
        return { ...day, [slot]: activity };
      }
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

      setResuggestData({
        dayNumber,
        timeSlot: slot,
        alternatives: data.alternatives || [],
      });
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

  const days = (itinerary?.content as any[]) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center gap-3 border-b border-border">
        <Link to="/trips">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <h1 className="text-lg font-display font-bold text-foreground">
          {viewState === "view" ? itinerary?.title || "Itinerary" : "Create Itinerary"}
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6">
        {viewState === "setup" && (
          <ItinerarySetup onGenerate={handleGenerate} isGenerating={isGenerating} />
        )}

        {viewState === "loading" && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Crafting your itinerary...</p>
            <p className="text-xs text-muted-foreground/60">This may take a moment</p>
          </div>
        )}

        {viewState === "view" && itinerary && (
          <div className="pb-24">
            <Tabs defaultValue="days">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="days" className="flex-1 gap-1">
                  <List className="w-4 h-4" /> Day by Day
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex-1 gap-1">
                  <BarChart3 className="w-4 h-4" /> Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="days" className="space-y-6">
                {days.map((day: any) => (
                  <DayView
                    key={day.day_number}
                    day={day}
                    onUpdateSlot={handleUpdateSlot}
                    onResuggestSlot={handleResuggestSlot}
                    resuggestingSlot={resuggestingSlot}
                  />
                ))}
              </TabsContent>

              <TabsContent value="summary">
                <ItinerarySummary
                  title={itinerary.title}
                  cities={itinerary.cities}
                  daysCount={itinerary.days_count}
                  totalCost={itinerary.total_est_cost_inr}
                  budgetSummary={itinerary.budget_summary as any}
                />
              </TabsContent>
            </Tabs>

            <AIEditBar
              onSubmit={handleAIEdit}
              isEditing={isEditing}
              changeSummary={changeSummary}
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
