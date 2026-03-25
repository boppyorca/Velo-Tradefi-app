"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AlertCondition, AlertConditionType } from "@/lib/types";

interface AlertConditionBuilderProps {
  conditions: AlertCondition[];
  onChange: (conditions: AlertCondition[]) => void;
  basePrice?: number;
}

const CONDITION_LABELS: Record<AlertConditionType, string> = {
  price_above: "Giá trên ▲",
  price_below: "Giá dưới ▼",
  percent_change: "Thay đổi %",
};

const CONDITION_HINTS: Record<AlertConditionType, string> = {
  price_above: "VD: 150000 → alert khi giá ≥ 150,000",
  price_below: "VD: 100000 → alert khi giá ≤ 100,000",
  percent_change: "VD: 5 → alert khi thay đổi ≥ 5% từ lúc tạo",
};

export function AlertConditionBuilder({
  conditions,
  onChange,
  basePrice,
}: AlertConditionBuilderProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editType, setEditType] = useState<AlertConditionType>("price_above");
  const [editValue, setEditValue] = useState("");

  function addCondition() {
    const newCondition: AlertCondition = { type: editType, value: Number(editValue) };
    if (!Number.isFinite(newCondition.value) || newCondition.value <= 0) return;
    onChange([...conditions, newCondition]);
    setEditValue("");
    setEditingIndex(null);
  }

  function removeCondition(index: number) {
    onChange(conditions.filter((_, i) => i !== index));
  }

  function formatCondition(c: AlertCondition): string {
    if (c.type === "percent_change") return `${c.type}: ±${c.value}%`;
    return `${c.type}: ${c.value}`;
  }

  return (
    <div className="space-y-3">
      {/* Active conditions */}
      {conditions.length > 0 && (
        <div className="space-y-2">
          {conditions.map((cond, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg bg-[#1E1E26] border border-white/[0.06] px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    cond.type === "price_above"
                      ? "bg-[#A3E635]/15 text-[#A3E635]"
                      : cond.type === "price_below"
                        ? "bg-[#F05252]/15 text-[#F05252]"
                        : "bg-[#6366F1]/15 text-[#6366F1]"
                  }`}
                >
                  {CONDITION_LABELS[cond.type]}
                </span>
                <span className="text-xs text-[#F0F0F0] font-mono">
                  {cond.type === "percent_change"
                    ? `±${cond.value}%`
                    : `₫${cond.value.toLocaleString("vi-VN")}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeCondition(idx)}
                className="text-[#4A4A5A] hover:text-[#F05252] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add condition form */}
      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-white/[0.10] p-3">
        <div className="flex items-center gap-2">
          <Select
            value={editType}
            onValueChange={(v) => setEditType(v as AlertConditionType)}
          >
            <SelectTrigger className="h-7 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price_above">Giá trên ▲</SelectItem>
              <SelectItem value="price_below">Giá dưới ▼</SelectItem>
              <SelectItem value="percent_change">Thay đổi %</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder={
              editType === "percent_change"
                ? "VD: 5 (5%)"
                : "Giá (VD: 150000)"
            }
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-7 flex-1 text-xs font-mono"
            min={0}
            step={editType === "percent_change" ? 0.1 : 1}
          />
          <Button
            size="xs"
            variant="outline"
            onClick={addCondition}
            disabled={!editValue || Number(editValue) <= 0}
            className="h-7 shrink-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <p className="text-[10px] text-[#4A4A5A]">{CONDITION_HINTS[editType]}</p>
        {editType === "percent_change" && basePrice != null && basePrice > 0 && editValue && (
          <p className="text-[10px] text-[#A3E635]">
            Giá hiện tại: {basePrice.toLocaleString("vi-VN")} → thay đổi ±{Number(editValue)}% = ±{((Number(editValue) * basePrice) / 100).toLocaleString("vi-VN")}
          </p>
        )}
      </div>
    </div>
  );
}
