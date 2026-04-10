import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import StepWhoYouAre from "./steps/StepWhoYouAre";
import StepWhereYouLive from "./steps/StepWhereYouLive";
import StepHowYouTravel from "./steps/StepHowYouTravel";
import StepWhatYouEat from "./steps/StepWhatYouEat";
import StepWhatYouLove from "./steps/StepWhatYouLove";
import StepPastTrips from "./steps/StepPastTrips";

export interface OnboardingData {
  fullName: string;
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
}

const STEPS = [
  { title: "Who you are", subtitle: "Let's get to know you" },
  { title: "Where you live", subtitle: "Your home base" },
  { title: "How you travel", subtitle: "Your travel style" },
  { title: "What you eat", subtitle: "Dietary preferences" },
  { title: "What you love", subtitle: "Interests & passions" },
  { title: "Past trips", subtitle: "Where you've been" },
];

const OnboardingWizard = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { updateProfile } = useProfile();

  const [data, setData] = useState<OnboardingData>({
    fullName: "",
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
        },
        experience_preferences: {
          travel_style: data.travelStyle,
          travel_frequency: data.travelFrequency,
          interests: data.interests,
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

      toast({ title: "Welcome aboard! 🎉", description: "Your travel profile is ready." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
      {/* Progress bar */}
      <div className="px-6 pt-6">
        <div className="flex gap-1.5 mb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? "gradient-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-display font-bold text-foreground mb-1">
              {STEPS[step].title}
            </h2>
            <p className="text-muted-foreground mb-8">{STEPS[step].subtitle}</p>
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 max-w-lg mx-auto w-full flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex-1 gradient-primary border-0"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={loading}
            className="flex-1 gradient-primary border-0"
          >
            {loading ? "Setting up..." : "Complete"} <Sparkles className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
