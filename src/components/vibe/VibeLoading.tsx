import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

const VIBE_TAGS = [
  "🏔️ Mountain", "🌊 Coastal", "🌅 Golden hour", "🧘 Slow pace",
  "🎒 Adventure", "🏛️ Culture", "🌿 Nature", "🌴 Tropical",
  "🏜️ Desert", "❄️ Arctic", "🎶 Nightlife", "🍜 Gastronomy",
  "🙏 Spirituality", "📸 Photography", "🏖️ Relaxation",
];

interface VibeLoadingProps {
  imagePreview?: string;
}

const VibeLoading = ({ imagePreview }: VibeLoadingProps) => {
  const [visibleTags, setVisibleTags] = useState<string[]>([]);

  useEffect(() => {
    const shuffled = [...VIBE_TAGS].sort(() => Math.random() - 0.5);
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < shuffled.length) {
        setVisibleTags((prev) => [...prev, shuffled[idx]]);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-6 py-12"
    >
      {/* Image with scanning effect */}
      {imagePreview && (
        <div className="relative w-40 h-40 rounded-2xl overflow-hidden">
          <img src={imagePreview} alt="Analyzing" className="w-full h-full object-cover" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-primary/30 to-transparent"
            animate={{ y: ["0%", "100%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 border-2 border-primary/40 rounded-2xl" />
        </div>
      )}

      {/* Scanning indicator */}
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-5 h-5 text-primary" />
        </motion.div>
        <p className="font-display font-semibold text-foreground">Extracting your vibe...</p>
      </div>

      {/* Streaming vibe tags */}
      <div className="flex flex-wrap gap-2 justify-center max-w-xs">
        <AnimatePresence>
          {visibleTags.map((tag) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
            >
              {tag}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <p className="text-xs text-muted-foreground">This usually takes 3–5 seconds</p>
    </motion.div>
  );
};

export default VibeLoading;
