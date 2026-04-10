import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import VibeInput from "./VibeInput";
import VibeLoading from "./VibeLoading";
import VibeResults from "./VibeResults";

interface VibeMatchTabProps {
  onDestinationClick: (dest: any) => void;
}

type VibeState = "input" | "loading" | "results";

const VibeMatchTab = ({ onDestinationClick }: VibeMatchTabProps) => {
  const { user } = useAuth();
  const [state, setState] = useState<VibeState>("input");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [results, setResults] = useState<{
    extracted_vibe: any;
    match_explanation: string;
    matched_destinations: any[];
  } | null>(null);

  const processVibeMatch = useCallback(async (imageUrl: string) => {
    setState("loading");
    try {
      const { data, error } = await supabase.functions.invoke("vibe-match", {
        body: { image_url: imageUrl },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResults(data);
      setState("results");
    } catch (err: any) {
      console.error("Vibe match error:", err);
      toast({
        title: "Vibe match failed",
        description: err.message || "Could not analyze image. Please try again.",
        variant: "destructive",
      });
      setState("input");
    }
  }, []);

  const handleImageSelected = useCallback(async (file: File) => {
    if (!user) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to storage
    setState("loading");
    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("vibe-images")
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("vibe-images")
        .getPublicUrl(uploadData.path);

      await processVibeMatch(urlData.publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
      setState("input");
    }
  }, [user, processVibeMatch]);

  const handleUrlSubmitted = useCallback(async (url: string) => {
    setImagePreview(url);
    await processVibeMatch(url);
  }, [processVibeMatch]);

  const handleReset = () => {
    setState("input");
    setImagePreview(null);
    setResults(null);
  };

  return (
    <div className="py-4">
      <AnimatePresence mode="wait">
        {state === "input" && (
          <VibeInput
            key="input"
            onImageSelected={handleImageSelected}
            onUrlSubmitted={handleUrlSubmitted}
          />
        )}

        {state === "loading" && (
          <VibeLoading
            key="loading"
            imagePreview={imagePreview || undefined}
          />
        )}

        {state === "results" && results && (
          <VibeResults
            key="results"
            extractedVibe={results.extracted_vibe}
            matchExplanation={results.match_explanation}
            matchedDestinations={results.matched_destinations}
            imagePreview={imagePreview || undefined}
            onDestinationClick={onDestinationClick}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VibeMatchTab;
