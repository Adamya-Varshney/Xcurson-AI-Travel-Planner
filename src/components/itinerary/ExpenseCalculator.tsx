import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calculator, ChevronDown, ChevronUp, Equal, Divide, X as TimesIcon, Minus } from "lucide-react";

const CURRENCIES = [
  "INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SEK",
  "NZD", "MXN", "SGD", "HKD", "NOK", "KRW", "TRY", "RUB", "BRL", "ZAR",
  "TWD", "DKK", "PLN", "THB", "IDR", "HUF", "CZK", "ILS", "CLP", "PHP",
  "AED", "COP", "SAR", "MYR", "RON", "BGN", "HRK", "PEN", "EGP", "VND",
  "PKR", "BDT", "LKR", "NGN", "KES", "GHS", "QAR", "KWD", "BHD", "OMR",
];

type Operation = "add" | "subtract" | "multiply" | "divide";

interface ExpenseRow {
  id: string;
  label: string;
  amount: string;
  operation: Operation;
  splitBy: string;
}

const OP_ICONS: Record<Operation, React.ReactNode> = {
  add: <Plus className="w-3 h-3" />,
  subtract: <Minus className="w-3 h-3" />,
  multiply: <TimesIcon className="w-3 h-3" />,
  divide: <Divide className="w-3 h-3" />,
};

const OP_LABELS: Record<Operation, string> = {
  add: "Add",
  subtract: "Deduct",
  multiply: "Multiply",
  divide: "Split",
};

const makeId = () => Math.random().toString(36).slice(2, 8);

const ExpenseCalculator = () => {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const [rows, setRows] = useState<ExpenseRow[]>([
    { id: makeId(), label: "Accommodation", amount: "", operation: "add", splitBy: "1" },
    { id: makeId(), label: "Transport", amount: "", operation: "add", splitBy: "1" },
    { id: makeId(), label: "Food", amount: "", operation: "add", splitBy: "1" },
  ]);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { id: makeId(), label: "", amount: "", operation: "add", splitBy: "1" }]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRow = useCallback((id: string, updates: Partial<ExpenseRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  const computeTotal = () => {
    let total = 0;
    for (const row of rows) {
      const amt = parseFloat(row.amount) || 0;
      const split = parseFloat(row.splitBy) || 1;

      switch (row.operation) {
        case "add":
          total += amt;
          break;
        case "subtract":
          total -= amt;
          break;
        case "multiply":
          total *= amt || 1;
          break;
        case "divide":
          if (split !== 0) total = total; // divide applies per-row below
          break;
      }

      if (row.operation === "divide" && split > 0) {
        // For divide: add the amount first, then the total reflects the split
        total += amt / split;
      } else if (row.operation === "add" && split > 1) {
        // If splitting an "add" row, adjust
        total = total - amt + amt / split;
      }
    }
    return total;
  };

  const total = computeTotal();

  const formatNumber = (n: number) => {
    if (Number.isInteger(n)) return n.toLocaleString("en-IN");
    return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            Expense Calculator
          </span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CardTitle>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4">
          {/* Currency selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Currency:</span>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expense rows */}
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="space-y-1.5 p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-1.5">
                  {/* Operation */}
                  <Select
                    value={row.operation}
                    onValueChange={(v) => updateRow(row.id, { operation: v as Operation })}
                  >
                    <SelectTrigger className="w-20 sm:w-24 h-8 text-[10px] sm:text-xs shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(OP_LABELS) as Operation[]).map((op) => (
                        <SelectItem key={op} value={op} className="text-xs">
                          <span className="flex items-center gap-1">{OP_ICONS[op]} {OP_LABELS[op]}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Label */}
                  <Input
                    value={row.label}
                    onChange={(e) => updateRow(row.id, { label: e.target.value })}
                    placeholder="Label"
                    className="h-8 text-[10px] sm:text-xs flex-1 min-w-0"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(row.id)}
                  >
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Amount */}
                  <Input
                    type="number"
                    step="0.000001"
                    value={row.amount}
                    onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                    placeholder="0.00"
                    className="h-8 text-[10px] sm:text-xs flex-1 min-w-0"
                  />

                  {/* Split-by */}
                  {(row.operation === "add" || row.operation === "divide") && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] sm:text-xs text-muted-foreground">÷</span>
                      <Input
                        type="number"
                        step="1"
                        min="1"
                        value={row.splitBy}
                        onChange={(e) => updateRow(row.id, { splitBy: e.target.value })}
                        className="h-8 text-[10px] sm:text-xs w-12 sm:w-14"
                        placeholder="1"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={addRow} className="w-full text-xs gap-1">
            <Plus className="w-3 h-3" /> Add Row
          </Button>

          {/* Total */}
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
              <Equal className="w-4 h-4" /> Total
            </span>
            <span className="font-bold text-primary text-lg">
              {currency} {formatNumber(total)}
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ExpenseCalculator;
