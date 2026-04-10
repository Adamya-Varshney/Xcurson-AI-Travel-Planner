import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

interface DestinationImageCarouselProps {
  images: string[];
  destinationName: string;
}

const DestinationImageCarousel = ({ images, destinationName }: DestinationImageCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  if (!images || images.length === 0) return null;

  const validImages = images.filter((_, i) => !failedImages.has(i));
  if (validImages.length === 0) return null;

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
      className="mt-2 rounded-xl overflow-hidden border border-border bg-muted/30"
    >
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
          <ImageIcon className="w-3 h-3" /> Attractions
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); scrollPrev(); }}
            className="p-0.5 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); scrollNext(); }}
            className="p-0.5 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden px-2 pb-2" ref={emblaRef}>
        <div className="flex gap-2">
          {images.map((url, i) => (
            <div
              key={i}
              className="flex-[0_0_45%] sm:flex-[0_0_35%] min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              {!failedImages.has(i) && (
                <img
                  src={url}
                  alt={`${destinationName} attraction ${i + 1}`}
                  loading="lazy"
                  className="w-full h-24 sm:h-28 object-cover rounded-lg"
                  onError={() => setFailedImages((prev) => new Set(prev).add(i))}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DestinationImageCarousel;
