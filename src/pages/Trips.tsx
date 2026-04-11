import { useState } from "react";
import { useTrips } from "@/hooks/useTrips";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, MapPin, Calendar, History, Plane, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ChipSelector from "@/components/onboarding/ChipSelector";

const Trips = () => {
  const { trips, isLoading, createTrip } = useTrips();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [tripMode, setTripMode] = useState("solo");
  const [creating, setCreating] = useState(false);

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

  const upcomingTrips = trips.filter((t) => t.status === "planning" || t.status === "booked");
  const completedTrips = trips.filter((t) => t.status === "completed");

  const renderTrips = (list: typeof trips, emptyIcon: React.ReactNode, emptyText: string) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          {emptyIcon}
          <p>{emptyText}</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {list.map((trip) => (
          <Card key={trip.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{trip.title}</h3>
                  {trip.destination && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {trip.destination}
                    </p>
                  )}
                  {trip.start_date && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" /> {trip.start_date}{trip.end_date && ` → ${trip.end_date}`}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="capitalize">{trip.trip_mode}</Badge>
                  <Badge variant={trip.status === "booked" ? "default" : "secondary"} className="capitalize text-xs">
                    {trip.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center gap-3 border-b border-border">
        <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="text-lg font-display font-bold text-foreground">My Trips</h1>
        <div className="ml-auto">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary border-0"><Plus className="w-4 h-4 mr-1" /> New Trip</Button>
            </DialogTrigger>
            <DialogContent>
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

      <main className="max-w-lg mx-auto px-6 py-6">
        <Tabs defaultValue="upcoming">
          <TabsList className="w-full">
            <TabsTrigger value="upcoming" className="flex-1 gap-1">
              <Plane className="w-4 h-4" /> Upcoming ({upcomingTrips.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1">
              <History className="w-4 h-4" /> History ({completedTrips.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4">
            {renderTrips(
              upcomingTrips,
              <Plane className="w-10 h-10 mx-auto mb-2 opacity-50" />,
              "No upcoming trips yet"
            )}
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            {renderTrips(
              completedTrips,
              <History className="w-10 h-10 mx-auto mb-2 opacity-50" />,
              "No past trips yet. Confirmed itineraries will appear here once completed."
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Trips;
