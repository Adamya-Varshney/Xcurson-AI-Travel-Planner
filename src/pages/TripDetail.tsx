import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, List, BarChart3, MapPin, Calendar } from "lucide-react";
import DayView from "@/components/itinerary/DayView";
import ItinerarySummary from "@/components/itinerary/ItinerarySummary";
import ExpenseCalculator from "@/components/itinerary/ExpenseCalculator";
import type { Activity } from "@/components/itinerary/TimeBlockCard";

const TripDetail = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { user } = useAuth();
  const [trip, setTrip] = useState<any>(null);
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !tripId) return;

    const fetchData = async () => {
      setLoading(true);
      const [tripRes, itinRes] = await Promise.all([
        supabase.from("trips").select("*").eq("id", tripId).eq("user_id", user.id).single(),
        supabase.from("itineraries").select("*").eq("trip_id", tripId).eq("user_id", user.id).maybeSingle(),
      ]);

      if (tripRes.data) setTrip(tripRes.data);
      if (itinRes.data) setItinerary(itinRes.data);
      setLoading(false);
    };

    fetchData();
  }, [user, tripId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Trip not found</p>
        <Link to="/trips"><Button variant="outline">Back to Trips</Button></Link>
      </div>
    );
  }

  const days = (itinerary?.content as any[]) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center gap-3 border-b border-border">
        <Link to="/trips">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-display font-bold text-foreground truncate">{trip.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {trip.destination && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {trip.destination}
              </span>
            )}
            {trip.start_date && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {trip.start_date}{trip.end_date && ` → ${trip.end_date}`}
              </span>
            )}
          </div>
        </div>
        <Badge variant={trip.status === "booked" ? "default" : "secondary"} className="capitalize shrink-0">
          {trip.status}
        </Badge>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6">
        {!itinerary ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-muted-foreground">No itinerary linked to this trip yet.</p>
            <Link to="/itinerary">
              <Button className="gradient-primary border-0">Create Itinerary</Button>
            </Link>
          </div>
        ) : (
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
                  onUpdateSlot={() => {}}
                  onResuggestSlot={() => {}}
                  resuggestingSlot={null}
                />
              ))}
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
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
        )}
      </main>
    </div>
  );
};

export default TripDetail;
