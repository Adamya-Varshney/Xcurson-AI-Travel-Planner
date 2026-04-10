import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl gradient-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Auth />;
  if (profile && !profile.onboarding_completed) return <OnboardingWizard />;
  return <Dashboard />;
};

export default Index;
