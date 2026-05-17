import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, ArrowRight, ArrowLeft, Sparkles, Loader2, RefreshCw, Copy, Check,
  Clock, Trash2, Lightbulb, AlertTriangle, Package, Info, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type Reason = {
  id: string;
  title: string;
  category: string;
  icon_hint: string;
  tagline: string;
  time_relevance: string;
  specific_anchor: string | null;
  approximate_dates: string | null;
  confidence: number;
};

type Recommendation = {
  id: string;
  title: string;
  type: string;
  neighborhood: string | null;
  why_it_fits: string;
  details: string;
  price_band: string;
  best_time: string | null;
  insider_tip: string | null;
  tags: string[];
};

type Result = {
  answer_summary: string;
  intent_understood: string;
  recommendations: Recommendation[];
  what_to_pack: string[];
  watch_outs: string[];
  follow_up_prompts: string[];
  data_freshness_warning: string | null;
};

type HistoryItem = {
  id: string;
  destination: string;
  reason: string;
  user_query: string | null;
  response_json: Result | null;
  response_md: string | null;
  suggested_reasons: Reason[] | null;
  answer_summary: string | null;
  created_at: string;
};

type Step = "destination" | "reason" | "question" | "result";

const CATEGORY_LABEL: Record<string, string> = {
  festival_event: "Festival",
  iconic_tourism: "Tourism",
  religious_pilgrimage: "Pilgrimage",
  food_cuisine: "Food",
  shopping_goods: "Shopping",
  wedding_family: "Wedding / Family",
  wellness_retreat: "Wellness",
  adventure_outdoor: "Adventure",
  solo_self_discovery: "Solo",
  bleisure_workation: "Workation",
  content_creation: "Content",
  screen_inspired: "Screen-inspired",
  education_campus: "Education",
  sports_fan: "Sports",
  custom: "Custom",
};

const ICON_FOR_HINT: Record<string, string> = {
  festival: "🎉", temple: "🛕", mountain: "🏔", shopping_bag: "🛍",
  wedding_ring: "💍", camera: "📸", food: "🍜", beach: "🏖", music: "🎶",
  yoga: "🧘", trek: "🥾", coffee: "☕", surf: "🏄", sparkles: "✨",
};

const STARTER_BY_CATEGORY: Record<string, string[]> = {
  wedding_family: [
    "Where do I shop for wedding outfits?",
    "Best gift to bring for the bride's family?",
    "Etiquette tips I should know",
  ],
  festival_event: [
    "What should I wear?",
    "Where do locals actually go around the event?",
    "How do I avoid the worst crowds?",
  ],
  shopping_goods: [
    "Best markets and what to bargain to?",
    "Where do locals actually shop?",
    "What's the one thing I should take home?",
  ],
  food_cuisine: [
    "Top 5 dishes I have to try and where",
    "Best street food trail",
    "One restaurant locals love",
  ],
  religious_pilgrimage: [
    "Dress code and customs",
    "Best time of day to visit",
    "How to skip the worst queues",
  ],
  iconic_tourism: [
    "Itinerary for one packed day",
    "Underrated spot most tourists miss",
    "How to get around cheaply",
  ],
  wellness_retreat: [
    "Reputable retreats for first-timers",
    "Daily cost and what to pack",
    "What to look out for",
  ],
  adventure_outdoor: [
    "Best operator and gear list",
    "Right season for this",
    "Safety things I should know",
  ],
  bleisure_workation: [
    "Best cafés to work from",
    "Coliving options worth the money",
    "Wifi and power reliability",
  ],
  solo_self_discovery: [
    "Where do solo travellers hang out?",
    "Safety tips for evenings",
    "A slow itinerary for 5 days",
  ],
  content_creation: [
    "Best spots for photos at golden hour",
    "Permits I need for shooting",
    "Underrated reels-worthy locations",
  ],
  screen_inspired: [
    "Actual filming locations I can visit",
    "Themed experiences worth doing",
    "How to do it in 2 days",
  ],
  education_campus: [
    "How to plan the campus visit",
    "Where to stay nearby on a budget",
    "What else to do in town",
  ],
  sports_fan: [
    "How to score tickets last minute",
    "Best bars to watch with locals",
    "Logistics on match day",
  ],
  custom: [
    "Where do locals actually go?",
    "What's the one thing not to miss?",
    "Best place to eat nearby",
  ],
};

const PRICE_HINT: Record<string, string> = {
  "₹": "Under ₹500",
  "₹₹": "₹500–2k",
  "₹₹₹": "₹2k–8k",
  "₹₹₹₹": "₹8k+",
  free: "Free",
  "n/a": "",
};

const TripAssistTab = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("destination");
  const [destination, setDestination] = useState("");
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [selectedReason, setSelectedReason] = useState<Reason | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loadingReasons, setLoadingReasons] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("trip_assist_queries")
      .select("id, destination, reason, user_query, response_json, response_md, suggested_reasons, answer_summary, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data as any) || []);
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const reset = () => {
    setStep("destination");
    setDestination("");
    setReasons([]);
    setSelectedReason(null);
    setCustomReason("");
    setUserQuery("");
    setResult(null);
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

  const pickReason = (r: Reason) => {
    setSelectedReason(r);
    setUserQuery("");
    setStep("question");
  };

  const pickCustomReason = () => {
    const txt = customReason.trim();
    if (!txt) return;
    setSelectedReason({
      id: "custom",
      title: txt,
      category: "custom",
      icon_hint: "sparkles",
      tagline: "",
      time_relevance: "year_round",
      specific_anchor: null,
      approximate_dates: null,
      confidence: 1,
    });
    setUserQuery("");
    setStep("question");
  };

  const submitQuery = async (q?: string) => {
    const query = (q ?? userQuery).trim();
    if (!query || !selectedReason) return;
    setUserQuery(query);
    setLoadingResult(true);
    setStep("result");
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("trip-assist-recommend", {
        body: {
          destination: destination.trim(),
          reason: selectedReason.title,
          is_custom_reason: selectedReason.id === "custom",
          selected_reason: selectedReason,
          suggested_reasons: reasons,
          user_query: query,
        },
      });
      if (error) throw error;
      setResult({
        answer_summary: data?.answer_summary || "",
        intent_understood: data?.intent_understood || "",
        recommendations: data?.recommendations || [],
        what_to_pack: data?.what_to_pack || [],
        watch_outs: data?.watch_outs || [],
        follow_up_prompts: data?.follow_up_prompts || [],
        data_freshness_warning: data?.data_freshness_warning || null,
      });
      loadHistory();
    } catch (err: any) {
      toast({ title: "Couldn't generate recommendation", description: err.message, variant: "destructive" });
      setStep("question");
    } finally {
      setLoadingResult(false);
    }
  };

  const askFollowUp = (prompt: string) => {
    setUserQuery(prompt);
    setStep("question");
  };

  const openHistoryItem = (h: HistoryItem) => {
    setDestination(h.destination);
    const r: Reason = {
      id: "history",
      title: h.reason,
      category: "custom",
      icon_hint: "sparkles",
      tagline: "",
      time_relevance: "year_round",
      specific_anchor: null,
      approximate_dates: null,
      confidence: 1,
    };
    setSelectedReason(r);
    setReasons(h.suggested_reasons || []);
    setUserQuery(h.user_query || "");
    if (h.response_json) {
      setResult(h.response_json);
      setStep("result");
    } else if (h.response_md) {
      // Legacy markdown — render as a single "details" card
      setResult({
        answer_summary: h.answer_summary || "",
        intent_understood: "",
        recommendations: [{
          id: "legacy", title: "Recommendation", type: "tip", neighborhood: null,
          why_it_fits: "", details: h.response_md, price_band: "n/a",
          best_time: null, insider_tip: null, tags: [],
        }],
        what_to_pack: [], watch_outs: [], follow_up_prompts: [], data_freshness_warning: null,
      });
      setStep("result");
    }
  };

  const deleteHistoryItem = async (id: string) => {
    await supabase.from("trip_assist_queries").delete().eq("id", id);
    loadHistory();
  };

  const copyResult = async () => {
    if (!result) return;
    const text = [
      result.answer_summary,
      "",
      ...result.recommendations.map((r) =>
        `${r.title}${r.neighborhood ? ` (${r.neighborhood})` : ""} — ${r.price_band}\n${r.details}${r.insider_tip ? `\nTip: ${r.insider_tip}` : ""}`
      ),
    ].join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const starters = selectedReason ? (STARTER_BY_CATEGORY[selectedReason.category] || STARTER_BY_CATEGORY.custom) : [];

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
              Where are you headed? We'll figure out why, then answer the specific stuff — markets, outfits, gifts, food, etiquette.
            </p>
            <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" /> Destination
            </label>
            <div className="flex gap-2">
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitDestination()}
                placeholder="e.g. Jaipur, Pushkar, Goa, Lisbon…"
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
            <p className="text-sm text-muted-foreground mb-5">Pick the closest match — or describe your own.</p>

            {loadingReasons ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reasons.map((r, i) => (
                  <motion.button
                    key={r.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => pickReason(r)}
                    className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{ICON_FOR_HINT[r.icon_hint] || "✨"}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {r.title}
                          </div>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                            {CATEGORY_LABEL[r.category] || r.category}
                          </Badge>
                        </div>
                        {r.tagline && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.tagline}</div>
                        )}
                        {r.approximate_dates && (
                          <div className="text-[11px] text-primary/80 mt-1.5 font-medium">
                            {r.approximate_dates}
                          </div>
                        )}
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
                  onKeyDown={(e) => e.key === "Enter" && customReason.trim() && pickCustomReason()}
                  placeholder="e.g. attending a friend's wedding, photography trip…"
                  className="h-11"
                />
                <Button onClick={pickCustomReason} disabled={!customReason.trim()} className="h-11">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "question" && selectedReason && (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl glass p-6"
          >
            <button
              onClick={() => setStep("reason")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <MapPin className="w-3 h-3" /> {destination}
              <span className="mx-1">·</span>
              <span>{selectedReason.title}</span>
            </div>
            <h2 className="font-display font-bold text-xl text-foreground mb-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> What do you want to know?
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Ask anything — markets, outfits, gifts, food, etiquette, logistics.
            </p>

            <Textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="e.g. Where do I shop for wedding outfits in the old city?"
              className="min-h-[88px] resize-none"
              autoFocus
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {starters.map((s, i) => (
                <button
                  key={i}
                  onClick={() => submitQuery(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary hover:bg-primary/5 text-foreground/80 hover:text-primary transition-all"
                >
                  {s}
                </button>
              ))}
            </div>

            <Button
              onClick={() => submitQuery()}
              disabled={!userQuery.trim()}
              size="lg"
              className="w-full mt-5"
            >
              <Sparkles className="w-4 h-4 mr-1.5" /> Get recommendations
            </Button>
          </motion.div>
        )}

        {step === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="rounded-2xl glass p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 flex-wrap">
                    <MapPin className="w-3 h-3" /> {destination}
                    <span className="mx-1">·</span>
                    <span>{selectedReason?.title}</span>
                  </div>
                  <h2 className="font-display font-bold text-xl text-foreground leading-tight">
                    {userQuery || "Recommendation"}
                  </h2>
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
              ) : result ? (
                <>
                  {result.answer_summary && (
                    <p className="text-base text-foreground/90 leading-relaxed font-medium mb-5">
                      {result.answer_summary}
                    </p>
                  )}

                  {result.data_freshness_warning && (
                    <div className="flex gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 mb-4">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{result.data_freshness_warning}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {result.recommendations.map((r) => (
                      <div key={r.id} className="rounded-xl border border-border bg-card/50 p-4">
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="min-w-0">
                            <h3 className="font-display font-semibold text-foreground leading-tight">{r.title}</h3>
                            {r.neighborhood && (
                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {r.neighborhood}
                              </div>
                            )}
                          </div>
                          {r.price_band !== "n/a" && (
                            <Badge variant="secondary" className="shrink-0 text-[11px]">
                              {r.price_band}{PRICE_HINT[r.price_band] ? ` · ${PRICE_HINT[r.price_band]}` : ""}
                            </Badge>
                          )}
                        </div>
                        {r.why_it_fits && (
                          <p className="text-xs text-primary/90 mb-2 italic">{r.why_it_fits}</p>
                        )}
                        <p className="text-sm text-foreground/85 leading-relaxed">{r.details}</p>
                        {r.best_time && (
                          <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {r.best_time}
                          </div>
                        )}
                        {r.insider_tip && (
                          <div className="flex gap-2 mt-2.5 p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs text-foreground/90">
                            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                            <span><span className="font-semibold text-primary">Insider tip:</span> {r.insider_tip}</span>
                          </div>
                        )}
                        {r.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {r.tags.map((t, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {result.what_to_pack.length > 0 && (
                    <div className="mt-5 p-4 rounded-xl border border-border bg-card/50">
                      <div className="flex items-center gap-1.5 mb-2 font-semibold text-sm text-foreground">
                        <Package className="w-4 h-4 text-primary" /> What to pack
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.what_to_pack.map((p, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground/80">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.watch_outs.length > 0 && (
                    <div className="mt-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                      <div className="flex items-center gap-1.5 mb-2 font-semibold text-sm text-destructive">
                        <AlertTriangle className="w-4 h-4" /> Watch outs
                      </div>
                      <ul className="space-y-1 text-sm text-foreground/85">
                        {result.watch_outs.map((w, i) => (
                          <li key={i} className="flex gap-2"><span className="text-destructive">·</span> {w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" onClick={copyResult}>
                      {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </>
              ) : null}
            </div>

            {result && result.follow_up_prompts.length > 0 && !loadingResult && (
              <div className="rounded-2xl glass p-5">
                <div className="flex items-center gap-1.5 mb-3 text-sm font-semibold text-foreground">
                  <MessageSquare className="w-4 h-4 text-primary" /> Ask next
                </div>
                <div className="flex flex-col gap-2">
                  {result.follow_up_prompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => askFollowUp(p)}
                      className="text-left text-sm px-3 py-2.5 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 text-foreground/85 hover:text-primary transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
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
                  <div className="font-medium text-sm text-foreground truncate">
                    {h.destination} <span className="text-muted-foreground font-normal">· {h.reason}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {h.user_query || h.answer_summary || "Tap to view"}
                  </div>
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
