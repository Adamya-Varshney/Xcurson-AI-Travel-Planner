import { useState, useCallback, useEffect, useRef } from "react";
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
  const objectPreviewRef = useRef<string | null>(null);

  const updateImagePreview = useCallback((nextPreview: string | null) => {
    if (objectPreviewRef.current && objectPreviewRef.current !== nextPreview) {
      URL.revokeObjectURL(objectPreviewRef.current);
      objectPreviewRef.current = null;
    }

    if (nextPreview?.startsWith("blob:")) {
      objectPreviewRef.current = nextPreview;
    }

    setImagePreview(nextPreview);
  }, []);

  useEffect(() => {
    return () => {
      if (objectPreviewRef.current) {
        URL.revokeObjectURL(objectPreviewRef.current);
      }
    };
  }, []);

  const processVibeMatch = useCallback(async (imageUrl: string) => {
    setState("loading");
    try {
      const { data, error } = await supabase.functions.invoke("vibe-match", {
        body: { image_url: imageUrl },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResults(data);
      if (data.resolved_image_url) {
        updateImagePreview(data.resolved_image_url);
      }
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
  }, [updateImagePreview]);

  const handleImageSelected = useCallback(async (file: File, previewUrl: string) => {
    if (!user) return;

    updateImagePreview(previewUrl);
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
  }, [user, processVibeMatch, updateImagePreview]);

  const handleUrlSubmitted = useCallback(async (url: string) => {
    updateImagePreview(url);
    await processVibeMatch(url);
  }, [processVibeMatch, updateImagePreview]);

  const handleReset = () => {
    setState("input");
    updateImagePreview(null);
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
          updateImagePreview(img);
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
