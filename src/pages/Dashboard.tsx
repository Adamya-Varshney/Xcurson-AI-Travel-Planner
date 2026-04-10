import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useTrips } from "@/hooks/useTrips";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Compass, Map, Plus, Luggage, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { trips, isLoading: tripsLoading } = useTrips();

  const activeTripCount = trips.filter((t) => t.status === "planning").length;
  const completedTripCount = trips.filter((t) => t.status === "completed").length;
  const firstName = profile?.full_name?.split(" ")[0] || "Traveller";

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Compass className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">Wanderlust</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/profile">
            <Button variant="ghost" size="icon"><User className="w-5 h-5" /></Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Hey, {firstName} 👋</h1>
          <p className="text-muted-foreground mt-1">Where are we heading next?</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-display font-bold text-foreground">{activeTripCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Planning</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-display font-bold text-foreground">{completedTripCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Completed</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Badge variant="outline" className="text-xs">
                {profile?.experience_level === "experienced" ? "🏆 Pro" : profile?.experience_level === "building" ? "🌱 Growing" : "✨ New"}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Level</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link to="/trips">
            <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <Luggage className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <div className="font-medium text-foreground">My Trips</div>
                  <div className="text-xs text-muted-foreground">{trips.length} total</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/trips">
            <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow gradient-primary">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-medium text-primary-foreground">New Trip</div>
                  <div className="text-xs text-primary-foreground/70">Start planning</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Recent Trips</h2>
          {tripsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : trips.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <Map className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No trips yet. Start planning your first adventure!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {trips.slice(0, 5).map((trip) => (
                <Card key={trip.id} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{trip.title}</div>
                      <div className="text-sm text-muted-foreground">{trip.destination || "No destination set"}</div>
                    </div>
                    <Badge variant={trip.status === "completed" ? "default" : "secondary"} className={trip.status === "planning" ? "gradient-primary text-primary-foreground border-0" : ""}>
                      {trip.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
