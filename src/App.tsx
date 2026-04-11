import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Trips from "./pages/Trips";
import TripDetail from "./pages/TripDetail";
import Discover from "./pages/Discover";
import Itinerary from "./pages/Itinerary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const showNav = !!user;

  return (
    <>
      <div className={showNav ? "pb-16" : ""}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/itinerary" element={<Itinerary />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {showNav && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
