import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ArrowRight, ArrowLeft, Sparkles, Loader2, RefreshCw, Copy, Check, Clock, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type Reason = { label: string; icon: string; description: string };
type HistoryItem = {
  id: string;
  destination: string;
  reason: string;
  response_md: string | null;
  suggested_reasons: Reason[] | null;
  created_at: string;
};

type Step = "destination" | "reason" | "result";

const TripAssistTab = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("destination");
  const [destination, setDestination] = useState("");
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loadingReasons, setLoadingReasons] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("trip_assist_queries")
      .select("id, destination, reason, response_md, suggested_reasons, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data as any) || []);
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const reset = () => {
    setStep("destination");
    setDestination("");
    setReasons([]);
    setSelectedReason("");
    setCustomReason("");
    setMarkdown("");
  };

  const submitDestination = async () => {
    const d = destination.trim();
    if (!d) return;
    setLoadingReasons(true);
    setStep("reason");
    setReasons([]);
    try {
      const { data, error } = await supabase.functions.invoke("trip-assist-reasons", {
        body: { destination: d },
      });
      if (error) throw error;
      setReasons(data?.reasons || []);
    } catch (err: any) {
      toast({ title: "Couldn't fetch reasons", description: err.message, variant: "destructive" });
      setStep("destination");
    } finally {
      setLoadingReasons(false);
    }
  };

  const submitReason = async (reasonText: string, isCustom: boolean) => {
    const r = reasonText.trim();
    if (!r) return;
    setSelectedReason(r);
    setLoadingResult(true);
    setStep("result");
    setMarkdown("");
    try {
      const { data, error } = await supabase.functions.invoke("trip-assist-recommend", {
        body: {
          destination: destination.trim(),
          reason: r,
          is_custom_reason: isCustom,
          suggested_reasons: reasons,
        },
      });
      if (error) throw error;
      setMarkdown(data?.markdown || "");
      loadHistory();
    } catch (err: any) {
      toast({ title: "Couldn't generate recommendation", description: err.message, variant: "destructive" });
    } finally {
      setLoadingResult(false);
    }
  };

  const openHistoryItem = (h: HistoryItem) => {
    setDestination(h.destination);
    setSelectedReason(h.reason);
    setReasons(h.suggested_reasons || []);
    setMarkdown(h.response_md || "");
    setStep("result");
  };

  const deleteHistoryItem = async (id: string) => {
    await supabase.from("trip_assist_queries").delete().eq("id", id);
    loadHistory();
  };

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {step === "destination" && (
          <motion.div
            key="dest"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl glass p-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-xl text-foreground">Trip Assist</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Tell us where you're going and we'll tailor the answers to your trip — markets, outfits, gifts, food, anything.
            </p>
            <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" /> Destination
            </label>
            <div className="flex gap-2">
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitDestination()}
                placeholder="e.g. Jaipur, Kyoto, Lisbon…"
                className="h-12"
                autoFocus
              />
              <Button onClick={submitDestination} disabled={!destination.trim()} size="lg" className="h-12">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "reason" && (
          <motion.div
            key="reason"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl glass p-6"
          >
            <button
              onClick={() => setStep("destination")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <h2 className="font-display font-bold text-xl text-foreground mb-1">
              Why are you visiting <span className="text-primary">{destination}</span>?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">Pick one — or type your own reason below.</p>

            {loadingReasons ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reasons.map((r, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => submitReason(r.label, false)}
                    className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{r.icon}</span>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {r.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {r.description}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-border">
              <label className="text-sm font-medium text-foreground mb-2 block">Or describe your own reason</label>
              <div className="flex gap-2">
                <Input
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && customReason.trim() && submitReason(customReason, true)}
                  placeholder="e.g. attending a wedding, photography trip…"
                  className="h-11"
                />
                <Button
                  onClick={() => submitReason(customReason, true)}
                  disabled={!customReason.trim()}
                  className="h-11"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl glass p-6"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <MapPin className="w-3 h-3" /> {destination}
                </div>
                <h2 className="font-display font-bold text-xl text-foreground leading-tight">{selectedReason}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="shrink-0">
                <RefreshCw className="w-4 h-4 mr-1.5" /> New
              </Button>
            </div>

            {loadingResult ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Crafting your recommendation…</p>
              </div>
            ) : (
              <>
                <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-semibold prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2 prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-primary prose-ul:my-2">
                  <ReactMarkdown>{markdown}</ReactMarkdown>
                </article>
                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" onClick={copyMarkdown}>
                    {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && step === "destination" && (
        <div className="rounded-2xl glass p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-display font-semibold text-foreground">Recent assists</h3>
          </div>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="group flex items-center justify-between gap-2 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <button onClick={() => openHistoryItem(h)} className="flex-1 min-w-0 text-left">
                  <div className="font-medium text-sm text-foreground truncate">{h.destination}</div>
                  <div className="text-xs text-muted-foreground truncate">{h.reason}</div>
                </button>
                <button
                  onClick={() => deleteHistoryItem(h.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripAssistTab;
