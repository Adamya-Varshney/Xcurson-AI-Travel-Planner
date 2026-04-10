import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MoodCheckInProps {
  onSubmit: (mood: { mood_state: string; energy_level: string; planning_horizon: string }) => void;
  onSkip: () => void;
}

const MOODS = [
  { key: "burned_out", label: "Burned out", icon: "😮‍💨", desc: "I need to recharge" },
  { key: "adventurous", label: "Adventurous", icon: "🤩", desc: "Ready for anything" },
  { key: "social", label: "Social", icon: "🎉", desc: "Let's go with people" },
  { key: "reflective", label: "Reflective", icon: "🧘", desc: "Seeking meaning" },
];

const ENERGY = [
  { key: "low", label: "Low energy", icon: "🔋" },
  { key: "high", label: "High energy", icon: "⚡" },
];

const HORIZONS = [
  { key: "this_weekend", label: "This weekend", icon: "📅" },
  { key: "next_month", label: "Next month", icon: "🗓️" },
  { key: "exploring", label: "Just exploring", icon: "🔭" },
];

const MoodCheckIn = ({ onSubmit, onSkip }: MoodCheckInProps) => {
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState("");
  const [horizon, setHorizon] = useState("");

  const handleMoodSelect = (key: string) => {
    setMood(key);
    setStep(1);
  };

  const handleEnergySelect = (key: string) => {
    setEnergy(key);
    setStep(2);
  };

  const handleHorizonSelect = (key: string) => {
    setHorizon(key);
    onSubmit({ mood_state: mood, energy_level: key, planning_horizon: key });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="icon" onClick={onSkip} className="text-muted-foreground">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="mood"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <h2 className="text-2xl font-display font-bold mb-2">How are you feeling?</h2>
              <p className="text-muted-foreground mb-8">We'll find destinations to match your mood</p>
              <div className="grid grid-cols-2 gap-3">
                {MOODS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => handleMoodSelect(m.key)}
                    className="p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left group"
                  >
                    <span className="text-3xl block mb-2">{m.icon}</span>
                    <span className="font-semibold text-foreground block">{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="energy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <h2 className="text-2xl font-display font-bold mb-2">Energy level?</h2>
              <p className="text-muted-foreground mb-8">This helps us pick the right pace</p>
              <div className="flex gap-4 justify-center">
                {ENERGY.map((e) => (
                  <button
                    key={e.key}
                    onClick={() => handleEnergySelect(e.key)}
                    className="flex-1 max-w-[160px] p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-center"
                  >
                    <span className="text-4xl block mb-3">{e.icon}</span>
                    <span className="font-semibold text-foreground">{e.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="horizon"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <h2 className="text-2xl font-display font-bold mb-2">When are you thinking?</h2>
              <p className="text-muted-foreground mb-8">Planning horizon shapes our suggestions</p>
              <div className="flex flex-col gap-3">
                {HORIZONS.map((h) => (
                  <button
                    key={h.key}
                    onClick={() => handleHorizonSelect(h.key)}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left flex items-center gap-4"
                  >
                    <span className="text-2xl">{h.icon}</span>
                    <span className="font-semibold text-foreground">{h.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={onSkip} className="block mx-auto mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Skip — use last mood
        </button>
      </div>
    </motion.div>
  );
};

export default MoodCheckIn;
