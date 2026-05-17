"use client";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { kpis } from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";
import { FileSpreadsheet, FileText } from "lucide-react";

function GoalBar({ label, current, target, currentLabel, targetLabel, color, note }: {
  label: string; current: number; target: number; currentLabel: string; targetLabel: string; color: string; note?: string;
}) {
  const pct = Math.min(Math.round((current / target) * 100), 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[14px] mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-[#686864]">{currentLabel} / {targetLabel}</span>
      </div>
      <div className="h-2 bg-[#f7f7f5] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[13px] mt-1 text-[#686864]">
        <span>{pct}%</span>
        {note && <span className={pct < 60 ? "text-[#d94040]" : "text-[#e89820]"}>{note}</span>}
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [salesTarget, setSalesTarget] = useState(450000);
  const [roasTarget, setRoasTarget] = useState(1.5);
  const [aovTarget, setAovTarget] = useState(800);
  const [toast, setToast] = useState(false);

  const handleUpdate = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Monthly Goals</h2>
          <p className="text-[15px] text-[#686864] mt-0.5">{new Date().toLocaleString("default", { month: "long", year: "numeric" })} · {new Date().getDate()}/{new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} days</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-medium border border-[#1a7a3a] text-[#1a7a3a] bg-[#f0faf4]">
            <FileSpreadsheet size={12} /> CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-medium border border-[#c0392b] text-[#c0392b] bg-[#fdf3f3]">
            <FileText size={12} /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="Goal configuration" />
          <div className="mb-3">
            <label className="text-[13px] text-[#686864] mb-1 block">Gross Sales Target (₹)</label>
            <input
              type="number" value={salesTarget}
              onChange={e => setSalesTarget(Number(e.target.value))}
              className="w-full px-2.5 py-2 bg-[#f7f7f5] rounded-lg text-[16px] font-semibold border border-black/[0.09] focus:outline-none focus:border-[#17a773]"
            />
          </div>
          <div className="mb-3">
            <label className="text-[13px] text-[#686864] mb-1 block">Target ROAS</label>
            <input
              type="number" step="0.1" value={roasTarget}
              onChange={e => setRoasTarget(Number(e.target.value))}
              className="w-full px-2.5 py-2 bg-[#f7f7f5] rounded-lg text-[16px] font-semibold border border-black/[0.09] focus:outline-none focus:border-[#17a773]"
            />
          </div>
          <div className="mb-4">
            <label className="text-[13px] text-[#686864] mb-1 block">Target AOV (₹)</label>
            <input
              type="number" value={aovTarget}
              onChange={e => setAovTarget(Number(e.target.value))}
              className="w-full px-2.5 py-2 bg-[#f7f7f5] rounded-lg text-[16px] font-semibold border border-black/[0.09] focus:outline-none focus:border-[#17a773]"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 border border-black/[0.16] rounded-lg text-[14px] text-[#181816] hover:bg-[#f7f7f5] transition-colors">
              Reset
            </button>
            <button
              onClick={handleUpdate}
              className="flex-[2] py-2 bg-[#17a773] text-white rounded-lg text-[14px] font-semibold hover:bg-[#0d6b4f] transition-colors"
            >
              Update & Generate
            </button>
          </div>
          {toast && (
            <div className="mt-2 text-[13px] text-[#064d38] bg-[#e0f5ee] rounded-lg px-2.5 py-1.5">
              ✓ Goals updated successfully
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Pace tracker" />
          <GoalBar
            label="Gross Sales" current={kpis.grossSales} target={salesTarget}
            currentLabel={formatINR(kpis.grossSales)} targetLabel={formatINR(salesTarget)}
            color="bg-[#17a773]" note={`Need ${formatINR(salesTarget - kpis.grossSales)} in 12 days`}
          />
          <GoalBar
            label="ROAS" current={kpis.blendedROAS} target={roasTarget}
            currentLabel={kpis.blendedROAS.toString()} targetLabel={roasTarget.toString()}
            color="bg-[#e89820]" note={`−${(roasTarget - kpis.blendedROAS).toFixed(2)} gap`}
          />
          <GoalBar
            label="Ad Spend" current={kpis.adSpend} target={kpis.adSpendBudget}
            currentLabel={formatINR(kpis.adSpend)} targetLabel={formatINR(kpis.adSpendBudget)}
            color="bg-[#3478d4]"
          />
          <GoalBar
            label="Days elapsed" current={19} target={31}
            currentLabel="19" targetLabel="31"
            color="bg-[#B5D4F4]" note="12 days left"
          />
        </Card>
      </div>
    </div>
  );
}
