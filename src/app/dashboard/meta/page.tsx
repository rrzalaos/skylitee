"use client";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { metaCampaigns, kpis } from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";
import { FileSpreadsheet, FileText } from "lucide-react";

const signalConfig: Record<string, { label: string; variant: "green" | "amber" | "red" | "blue" | "gray" }> = {
  scale: { label: "Scale ↑", variant: "green" },
  monitor: { label: "Monitor", variant: "amber" },
  review: { label: "Review", variant: "amber" },
  pause: { label: "Pause", variant: "red" },
  kill: { label: "Kill", variant: "red" },
};

function downloadCSV() {
  const rows = [
    ["Campaign", "Status", "Spend", "Impressions", "Clicks", "CTR", "CPM", "A2C", "Orders", "AOV", "ROAS"],
    ...metaCampaigns.map(c => [c.name, c.status, formatINR(c.spend), c.impressions, c.clicks, `${c.ctr}%`, formatINR(c.cpm), c.a2c, c.orders, c.aov ? formatINR(c.aov) : "—", c.roas]),
  ];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "meta-campaigns.csv"; a.click();
}

export default function MetaPage() {
  const activeCount = metaCampaigns.filter(c => c.status === "active").length;
  const bestCampaign = metaCampaigns.reduce((a, b) => a.roas > b.roas ? a : b);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Meta Campaigns</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">Meta Business Suite · Aug 1–19, 2025</p>
        </div>
        <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-[#1a7a3a] text-[#1a7a3a] bg-[#f0faf4]">
          <FileSpreadsheet size={13} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2.5 mb-4">
        <KPICard label="Total Spend" value={formatINR(kpis.adSpend)} />
        <KPICard label="Best ROAS campaign" value={`ROAS ${bestCampaign.roas}`} />
        <KPICard label="Active campaigns" value={`${activeCount}`} />
        <KPICard label="Campaigns to fix" value={`${metaCampaigns.length - activeCount}`} changeLabel="Paused / review" change={-1} />
      </div>

      <Card>
        <CardHeader title="Campaign performance" right="All campaigns" />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="border-b border-black/[0.09]">
                {["Campaign", "Status", "Spend", "CTR", "Orders", "ROAS", "Action"].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-[11px] font-semibold text-[#686864] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metaCampaigns.map((c, i) => (
                <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                  <td className="py-2 px-2 font-medium max-w-[160px] truncate" title={c.name}>{c.name}</td>
                  <td className="py-2 px-2">
                    <Badge variant={c.status === "active" ? "green" : "gray"}>{c.status === "active" ? "Active" : "Paused"}</Badge>
                  </td>
                  <td className="py-2 px-2 font-semibold">{formatINR(c.spend)}</td>
                  <td className="py-2 px-2">{c.ctr}%</td>
                  <td className="py-2 px-2 font-semibold">{c.orders}</td>
                  <td className="py-2 px-2">
                    <Badge variant={c.roas >= 1.5 ? "green" : c.roas >= 1 ? "amber" : "red"}>{c.roas.toFixed(2)}</Badge>
                  </td>
                  <td className="py-2 px-2">
                    <Badge variant={signalConfig[c.signal]?.variant}>{signalConfig[c.signal]?.label}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
