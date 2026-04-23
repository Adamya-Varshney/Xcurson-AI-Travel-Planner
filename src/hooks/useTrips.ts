import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CreateTripInput {
  title: string;
  destination?: string;
  trip_mode?: string;
  start_date?: string;
  end_date?: string;
}

export type TripPlanningStatus = "planning" | "planned" | "completed";

export const useTrips = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tripsQuery = useQuery({
    queryKey: ["trips-with-itinerary", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: trips, error } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch itinerary trip_ids in one query so we can flag which trips have a plan.
      const { data: itineraries } = await supabase
        .from("itineraries")
        .select("trip_id")
        .eq("user_id", user.id)
        .not("trip_id", "is", null);

      const planned = new Set((itineraries ?? []).map((i: any) => i.trip_id));

      return (trips ?? []).map((t: any) => {
        let planningStatus: TripPlanningStatus = "planning";
        if (t.status === "completed") planningStatus = "completed";
        else if (planned.has(t.id)) planningStatus = "planned";
        return { ...t, has_itinerary: planned.has(t.id), planning_status: planningStatus };
      });
    },
    enabled: !!user?.id,
  });

  const createTrip = useMutation({
    mutationFn: async (trip: CreateTripInput) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("trips")
        .insert({ ...trip, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips-with-itinerary", user?.id] });
    },
  });

  const deleteTrip = useMutation({
    mutationFn: async (tripId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      // Remove linked itineraries and bookings first (no FK cascade defined).
      await supabase.from("itineraries").delete().eq("trip_id", tripId).eq("user_id", user.id);
      await supabase.from("bookings").delete().eq("trip_id", tripId).eq("user_id", user.id);
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", tripId)
        .eq("user_id", user.id);
      if (error) throw error;
      return tripId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips-with-itinerary", user?.id] });
    },
  });

  return {
    trips: tripsQuery.data ?? [],
    isLoading: tripsQuery.isLoading,
    createTrip,
    deleteTrip,
  };
};
