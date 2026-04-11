import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles, LogOut } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import StepWhoYouAre from "./steps/StepWhoYouAre";
import StepWhereYouLive from "./steps/StepWhereYouLive";
import StepHowYouTravel from "./steps/StepHowYouTravel";
import StepWhatYouEat from "./steps/StepWhatYouEat";
import StepWhatYouLove from "./steps/StepWhatYouLove";
import StepPastTrips from "./steps/StepPastTrips";

export interface OnboardingData {
  fullName: string;
  age: string;
  gender: string;
  languages: string[];
  travelStyle: string[];
  travelPace: string;
  homeCity: string;
  homeCountry: string;
  budgetRange: string;
  dietaryPrefs: string[];
  cuisinePrefs: string[];
  interests: string[];
  culturalPrefs: string[];
  pastDestinations: string[];
  travelFrequency: string;
  preferredAccommodation: string[];
  mobilityNeeds: string[];
  travelCompanions: string[];
}

const STEPS = [
  { title: "Who you are", subtitle: "Let's get to know you", icon: "👋" },
  { title: "Where you live", subtitle: "Your home base", icon: "📍" },
  { title: "How you travel", subtitle: "Your travel style", icon: "✈️" },
  { title: "What you eat", subtitle: "Dietary preferences", icon: "🍜" },
  { title: "What you love", subtitle: "Interests & passions", icon: "❤️" },
  { title: "Past trips", subtitle: "Where you've been", icon: "🗺️" },
];

const OnboardingWizard = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { updateProfile } = useProfile();
  const { signOut } = useAuth();

  const [data, setData] = useState<OnboardingData>({
    fullName: "",
    age: "",
    gender: "",
    languages: [],
    travelStyle: [],
    travelPace: "balanced",
    homeCity: "",
    homeCountry: "",
    budgetRange: "mid",
    dietaryPrefs: [],
    cuisinePrefs: [],
    interests: [],
    culturalPrefs: [],
    pastDestinations: [],
    travelFrequency: "once_a_year",
    preferredAccommodation: [],
    mobilityNeeds: [],
    travelCompanions: [],
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const tripCount = data.pastDestinations.length;
      let experienceLevel: "first_timer" | "building" | "experienced" = "first_timer";
      if (tripCount >= 10) experienceLevel = "experienced";
      else if (tripCount >= 3) experienceLevel = "building";

      await updateProfile.mutateAsync({
        full_name: data.fullName,
        home_city: data.homeCity,
        home_country: data.homeCountry,
        place_preferences: {
          budget_range: data.budgetRange,
          travel_pace: data.travelPace,
          preferred_accommodation: data.preferredAccommodation,
        },
        experience_preferences: {
          travel_style: data.travelStyle,
          travel_frequency: data.travelFrequency,
          interests: data.interests,
          travel_companions: data.travelCompanions,
          age: data.age,
          gender: data.gender,
          languages: data.languages,
          mobility_needs: data.mobilityNeeds,
        },
        cultural_preferences: {
          preferences: data.culturalPrefs,
        },
        food_preferences: {
          dietary: data.dietaryPrefs,
          cuisines: data.cuisinePrefs,
        },
        past_trips: data.pastDestinations.map((d) => ({ destination: d })),
        experience_level: experienceLevel,
        onboarding_completed: true,
      });

      supabase.functions.invoke("analyze-profile", {
        body: { onboardingData: data },
      }).catch(console.error);

      toast({ title: "Welcome aboard! 🎉", description: "Your travel profile is ready." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const canProceed = () => {
    switch (step) {
      case 0: return data.fullName.length > 0;
      case 1: return data.homeCity.length > 0;
      case 2: return data.travelStyle.length > 0;
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <StepWhoYouAre data={data} onChange={updateData} />;
      case 1: return <StepWhereYouLive data={data} onChange={updateData} />;
      case 2: return <StepHowYouTravel data={data} onChange={updateData} />;
      case 3: return <StepWhatYouEat data={data} onChange={updateData} />;
      case 4: return <StepWhatYouLove data={data} onChange={updateData} />;
      case 5: return <StepPastTrips data={data} onChange={updateData} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{STEPS[step].icon}</span>
            <span className="text-sm font-medium text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive gap-1.5 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </Button>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i < step
                  ? "gradient-primary"
                  : i === step
                  ? "gradient-primary animate-pulse"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-lg mx-auto w-full overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h2 className="text-2xl font-display font-bold text-foreground mb-1">
              {STEPS[step].title}
            </h2>
            <p className="text-muted-foreground mb-6">{STEPS[step].subtitle}</p>
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 pb-6 pt-2 max-w-lg mx-auto w-full">
        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1 h-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 h-12 gradient-primary border-0 text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 h-12 gradient-primary border-0 text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
            >
              {loading ? "Setting up..." : "Complete"}{" "}
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
        {step < STEPS.length - 1 && (
          <button
            onClick={() => setStep(step + 1)}
            className="w-full text-center text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
