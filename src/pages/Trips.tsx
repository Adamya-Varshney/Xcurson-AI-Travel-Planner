import { useState } from "react";
import { useTrips, type TripPlanningStatus } from "@/hooks/useTrips";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, MapPin, Calendar, History, Plane, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import ChipSelector from "@/components/onboarding/ChipSelector";

const PlanningStatusPill = ({ status }: { status: TripPlanningStatus }) => {
  if (status === "completed") {
    return (
      <Badge variant="default" className="capitalize text-[10px] sm:text-xs gap-1">
        <CheckCircle2 className="w-3 h-3" /> Completed
      </Badge>
    );
  }
  if (status === "planned") {
    return (
      <Badge className="capitalize text-[10px] sm:text-xs gap-1 gradient-primary border-0 text-primary-foreground">
        <CheckCircle2 className="w-3 h-3" /> Planned
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="capitalize text-[10px] sm:text-xs gap-1">
      <Loader2 className="w-3 h-3" /> Planning
    </Badge>
  );
};

const Trips = () => {
  const { trips, isLoading, createTrip, deleteTrip } = useTrips();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [tripMode, setTripMode] = useState("solo");
  const [creating, setCreating] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await createTrip.mutateAsync({ title, destination: destination || undefined, trip_mode: tripMode });
      toast({ title: "Trip created! 🎉" });
      setOpen(false);
      setTitle("");
      setDestination("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!tripToDelete) return;
    setDeleting(true);
    try {
      await deleteTrip.mutateAsync(tripToDelete.id);
      toast({ title: "Trip deleted", description: `"${tripToDelete.title}" was removed.` });
      setTripToDelete(null);
    } catch (e: any) {
      toast({ title: "Couldn't delete trip", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const upcomingTrips = trips.filter((t: any) => t.planning_status !== "completed");
  const completedTrips = trips.filter((t: any) => t.planning_status === "completed");

  const renderTrips = (list: typeof trips, emptyIcon: React.ReactNode, emptyText: string) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-10 sm:py-12 text-muted-foreground">
          {emptyIcon}
          <p className="text-sm">{emptyText}</p>
        </div>
      );
    }
    return (
      <div className="space-y-2 sm:space-y-3">
        {list.map((trip: any) => (
          <Card key={trip.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/trips/${trip.id}`} className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground text-sm sm:text-base truncate">{trip.title}</h3>
                  {trip.destination && (
                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-0.5 sm:mt-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" /> {trip.destination}
                    </p>
                  )}
                  {trip.start_date && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 sm:mt-1">
                      <Calendar className="w-3 h-3 shrink-0" /> {trip.start_date}{trip.end_date && ` → ${trip.end_date}`}
                    </p>
                  )}
                </Link>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="outline" className="capitalize text-[10px] sm:text-xs">{trip.trip_mode}</Badge>
                  <PlanningStatusPill status={trip.planning_status} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTripToDelete({ id: trip.id, title: trip.title });
                    }}
                    aria-label={`Delete ${trip.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 border-b border-border">
        <Link to="/"><Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9"><ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /></Button></Link>
        <h1 className="text-base sm:text-lg font-display font-bold text-foreground">My Trips</h1>
        <div className="ml-auto">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary border-0 text-xs sm:text-sm"><Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> New Trip</Button>
            </DialogTrigger>
            <DialogContent className="mx-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
              <DialogHeader><DialogTitle>Plan a new trip</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <Input placeholder="Trip name" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Input placeholder="Destination (optional)" value={destination} onChange={(e) => setDestination(e.target.value)} />
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Trip mode</label>
                  <ChipSelector
                    options={["Solo", "Partner", "Group", "Family"]}
                    selected={[tripMode.charAt(0).toUpperCase() + tripMode.slice(1)]}
                    onChange={(s) => setTripMode((s[0] || "Solo").toLowerCase())}
                    multiple={false}
                  />
                </div>
                <Button onClick={handleCreate} disabled={creating || !title.trim()} className="w-full gradient-primary border-0">
                  {creating ? "Creating..." : "Create Trip"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <Tabs defaultValue="upcoming">
          <TabsList className="w-full">
            <TabsTrigger value="upcoming" className="flex-1 gap-1 text-xs sm:text-sm">
              <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Upcoming ({upcomingTrips.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1 text-xs sm:text-sm">
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> History ({completedTrips.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-3 sm:mt-4">
            {renderTrips(
              upcomingTrips,
              <Plane className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 opacity-50" />,
              "No upcoming trips yet"
            )}
          </TabsContent>
          <TabsContent value="history" className="mt-3 sm:mt-4">
            {renderTrips(
              completedTrips,
              <History className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 opacity-50" />,
              "No past trips yet. Confirmed itineraries will appear here once completed."
            )}
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!tripToDelete} onOpenChange={(o) => !o && setTripToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{tripToDelete?.title}" along with its itinerary and any bookings.
              This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Trips;
