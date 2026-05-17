// Robust JSON extraction for AI responses that may include markdown fences,
// prose preamble, or trailing commentary (common with grounded/search-tool calls).
export function extractJson(text: string): any | null {
  if (!text) return null;
  // 1. Direct parse
  try { return JSON.parse(text); } catch {}
  // 2. Strip ```json ... ``` or ``` ... ``` fences
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try { return JSON.parse(fence[1].trim()); } catch {}
  }
  // 3. Greedy outermost {...}
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch {}
  }
  return null;
}
