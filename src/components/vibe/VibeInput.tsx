import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Link2, Camera, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface VibeInputProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  onUrlSubmitted: (url: string) => void;
  disabled?: boolean;
}

const VibeInput = ({ onImageSelected, onUrlSubmitted, disabled }: VibeInputProps) => {
  const [mode, setMode] = useState<"upload" | "url" | null>(null);
  const [urlValue, setUrlValue] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    onImageSelected(file, previewUrl);
  }, [onImageSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleUrlSubmit = () => {
    if (!urlValue.trim()) return;
    setPreview(urlValue.trim());
    onUrlSubmitted(urlValue.trim());
  };

  const clearPreview = () => {
    setPreview(null);
    setUrlValue("");
    setMode(null);
  };

  if (preview) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-2xl overflow-hidden border border-border"
      >
        <img src={preview} alt="Vibe preview" className="w-full h-48 sm:h-64 object-cover" />
        <button
          onClick={clearPreview}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3 p-8 sm:p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
          ${dragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
          }
          ${disabled ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
          <ImageIcon className="w-7 h-7 text-white" />
        </div>
        <div className="text-center">
          <p className="font-display font-semibold text-foreground">Drop a travel photo</p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse — we'll match your vibe
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          disabled={disabled}
        />
      </div>

      {/* Alternative methods */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2 rounded-xl"
          onClick={() => setMode(mode === "url" ? null : "url")}
          disabled={disabled}
        >
          <Link2 className="w-4 h-4" />
          Paste URL
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2 rounded-xl"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
        >
          <Camera className="w-4 h-4" />
          Camera
        </Button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          disabled={disabled}
        />
      </div>

      {/* URL input */}
      {mode === "url" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex gap-2"
        >
          <Input
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://example.com/travel-photo.jpg"
            className="flex-1 rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            disabled={disabled}
          />
          <Button onClick={handleUrlSubmit} size="sm" className="rounded-xl" disabled={disabled || !urlValue.trim()}>
            Go
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VibeInput;
