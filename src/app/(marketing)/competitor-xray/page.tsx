import XrayTool from "./xray-tool";

export const metadata = {
  title: "Free Competitor X-Ray - see any brand's live Meta ads | Skylitee",
  description: "Paste a competitor's Facebook page and see how many ads they run, their longest-running (proven) ad and the offer they push. Free, no login.",
};

export default function CompetitorXrayPage() {
  return (
    <section className="bg-[#0A0A0A] text-white py-16 sm:py-24 px-4 relative overflow-hidden min-h-[80vh]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-15 rounded-full"
          style={{ background: "radial-gradient(ellipse, #22C55E 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>
      <div className="relative max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-bold mb-5 border bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30">
            Free tool · No login
          </div>
          <h1 className="text-[36px] sm:text-[48px] font-black leading-[1.08] mb-4">
            Competitor X-Ray.{" "}
            <span style={{ background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              See what they&apos;re running.
            </span>
          </h1>
          <p className="text-[17px] sm:text-[18px] text-[#A1A1AA] leading-relaxed max-w-xl mx-auto">
            Paste any brand&apos;s Facebook page. In about a minute you&apos;ll see how many ads they run, the ad they&apos;ve kept running longest - their proven winner - and the offer they push.
          </p>
        </div>
        <XrayTool />
      </div>
    </section>
  );
}
