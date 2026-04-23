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

  const planningTripCount = trips.filter((t: any) => t.planning_status === "planning").length;
  const plannedTripCount = trips.filter((t: any) => t.planning_status === "planned").length;
  const completedTripCount = trips.filter((t: any) => t.planning_status === "completed").length;
  const firstName = profile?.full_name?.split(" ")[0] || "Traveller";

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-base sm:text-lg text-foreground"><span className="font-display font-bold text-base sm:text-lg text-foreground">Xcurson</span></span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9"><User className="w-4 h-4 sm:w-5 sm:h-5" /></Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={signOut}>
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Hey, {firstName} 👋</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Where are we heading next?</p>
        </motion.div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-display font-bold text-foreground">{activeTripCount}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Planning</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-display font-bold text-foreground">{completedTripCount}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Completed</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4 text-center">
              <Badge variant="outline" className="text-[10px] sm:text-xs">
                {profile?.experience_level === "experienced" ? "🏆 Pro" : profile?.experience_level === "building" ? "🌱 Growing" : "✨ New"}
              </Badge>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Level</div>
            </CardContent>
          </Card>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link to="/discover">
            <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow gradient-primary">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-medium text-primary-foreground text-sm sm:text-base">Discover</div>
                  <div className="text-xs text-primary-foreground/70">Find destinations</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/trips">
            <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Luggage className="w-5 h-5 sm:w-6 sm:h-6 text-secondary-foreground" />
                </div>
                <div>
                  <div className="font-medium text-foreground text-sm sm:text-base">My Trips</div>
                  <div className="text-xs text-muted-foreground">{trips.length} total</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/itinerary">
            <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                </div>
                <div>
                  <div className="font-medium text-foreground text-sm sm:text-base">New Trip</div>
                  <div className="text-xs text-muted-foreground">Start planning</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Trips */}
        <div>
          <h2 className="text-base sm:text-lg font-display font-semibold text-foreground mb-3 sm:mb-4">Recent Trips</h2>
          {tripsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-16 sm:h-20 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : trips.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 sm:p-8 text-center">
                <Map className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No trips yet. Start planning your first adventure!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {trips.slice(0, 5).map((trip) => (
                <Link key={trip.id} to={`/trips/${trip.id}`}>
                  <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground text-sm sm:text-base truncate">{trip.title}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">{trip.destination || "No destination set"}</div>
                      </div>
                      <Badge variant={trip.status === "completed" ? "default" : "secondary"} className={`shrink-0 text-[10px] sm:text-xs ${trip.status === "planning" ? "gradient-primary text-primary-foreground border-0" : ""}`}>
                        {trip.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
