import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import VibeInput from "./VibeInput";
import VibeLoading from "./VibeLoading";
import VibeResults from "./VibeResults";
import VibeHistory from "./VibeHistory";

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
      if (data.resolved_image_url) setImagePreview(data.resolved_image_url);
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

  const readFileAsDataUrl = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Could not preview the selected image."));
      };
      reader.onerror = () => reject(new Error("Could not preview the selected image."));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleImageSelected = useCallback(async (file: File) => {
    if (!user) return;

    try {
      const previewUrl = await readFileAsDataUrl(file);
      setImagePreview(previewUrl);
      setState("loading");

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
  }, [user, processVibeMatch, readFileAsDataUrl]);

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

      <VibeHistory
        onRestore={({ imagePreview: img, extractedVibe, matchExplanation, matchedDestinations }) => {
          setImagePreview(img);
          setResults({
            extracted_vibe: extractedVibe,
            match_explanation: matchExplanation,
            matched_destinations: matchedDestinations,
          });
          setState("results");
        }}
      />
    </div>
  );
};

export default VibeMatchTab;
