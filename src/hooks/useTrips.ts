import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTrips = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tripsQuery = useQuery({
    queryKey: ["trips", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createTrip = useMutation({
    mutationFn: async (trip: { title: string; destination?: string; trip_mode?: string; start_date?: string; end_date?: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ["trips", user?.id] });
    },
  });

  return { trips: tripsQuery.data ?? [], isLoading: tripsQuery.isLoading, createTrip };
};
