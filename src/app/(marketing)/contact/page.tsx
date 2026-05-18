import { Mail, MessageSquare, Clock, MapPin } from "lucide-react";

export const metadata = { title: "Contact — Skylitee" };

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#0A0A0A] text-white py-20 sm:py-28 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] opacity-15 rounded-full"
            style={{ background: "radial-gradient(ellipse, #F97316 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="relative max-w-xl mx-auto">
          <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-3">Get in touch</div>
          <h1 className="text-[40px] sm:text-[52px] font-black leading-tight mb-4">
            We&apos;re here.<br />
            <span style={{ background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              We reply fast.
            </span>
          </h1>
          <p className="text-[17px] sm:text-[18px] text-[#71717A]">
            Whether it&apos;s a bug, a billing question or a feature idea — we read every message.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <a href="mailto:support@skylitee.io"
            className="rounded-2xl border border-black/[0.06] bg-white p-6 sm:p-7 hover:border-[#F97316]/30 hover:shadow-lg transition-all group flex flex-col gap-4">
            <div className="w-12 h-12 bg-[#FFF7ED] rounded-xl flex items-center justify-center group-hover:bg-[#F97316]/15 transition-colors">
              <Mail size={22} className="text-[#F97316]" />
            </div>
            <div>
              <div className="text-[17px] font-bold text-[#18181B] mb-1">App Support</div>
              <div className="text-[15px] text-[#F97316] font-medium mb-1.5">support@skylitee.io</div>
              <div className="text-[14px] text-[#A1A1AA]">For bugs, feature requests and technical help</div>
            </div>
          </a>
          <a href="mailto:account@skylitee.io"
            className="rounded-2xl border border-black/[0.06] bg-white p-6 sm:p-7 hover:border-[#F97316]/30 hover:shadow-lg transition-all group flex flex-col gap-4">
            <div className="w-12 h-12 bg-[#FFF7ED] rounded-xl flex items-center justify-center group-hover:bg-[#F97316]/15 transition-colors">
              <MessageSquare size={22} className="text-[#F97316]" />
            </div>
            <div>
              <div className="text-[17px] font-bold text-[#18181B] mb-1">General Enquiries</div>
              <div className="text-[15px] text-[#F97316] font-medium mb-1.5">account@skylitee.io</div>
              <div className="text-[14px] text-[#A1A1AA]">For billing, accounts and partnerships</div>
            </div>
          </a>
        </div>

        {/* Info bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl bg-[#F5F5F4] border border-black/[0.04] px-5 py-4 flex items-center gap-3.5">
            <Clock size={18} className="text-[#F97316] shrink-0" />
            <div>
              <div className="text-[14px] font-bold text-[#18181B]">Response time</div>
              <div className="text-[14px] text-[#71717A]">Usually within a few hours</div>
            </div>
          </div>
          <div className="rounded-2xl bg-[#F5F5F4] border border-black/[0.04] px-5 py-4 flex items-center gap-3.5">
            <MapPin size={18} className="text-[#F97316] shrink-0" />
            <div>
              <div className="text-[14px] font-bold text-[#18181B]">Based in</div>
              <div className="text-[14px] text-[#71717A]">India — Orange Sky team</div>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-7 sm:p-9 shadow-sm">
          <h2 className="text-[22px] font-bold text-[#18181B] mb-6">Send us a message</h2>
          <form className="space-y-5" action="mailto:support@skylitee.io" method="get" encType="text/plain">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] font-bold text-[#18181B] uppercase tracking-[0.08em] block mb-2">Your name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  className="w-full border border-black/[0.10] rounded-xl px-4 py-3.5 text-[15px] text-[#18181B] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 transition-all placeholder:text-[#A1A1AA]"
                />
              </div>
              <div>
                <label className="text-[13px] font-bold text-[#18181B] uppercase tracking-[0.08em] block mb-2">Email address</label>
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full border border-black/[0.10] rounded-xl px-4 py-3.5 text-[15px] text-[#18181B] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 transition-all placeholder:text-[#A1A1AA]"
                />
              </div>
            </div>
            <div>
              <label className="text-[13px] font-bold text-[#18181B] uppercase tracking-[0.08em] block mb-2">Subject</label>
              <input
                name="subject"
                type="text"
                placeholder="What can we help with?"
                className="w-full border border-black/[0.10] rounded-xl px-4 py-3.5 text-[15px] text-[#18181B] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 transition-all placeholder:text-[#A1A1AA]"
              />
            </div>
            <div>
              <label className="text-[13px] font-bold text-[#18181B] uppercase tracking-[0.08em] block mb-2">Message</label>
              <textarea
                name="body"
                rows={5}
                placeholder="Tell us more — the more detail, the faster we can help."
                className="w-full border border-black/[0.10] rounded-xl px-4 py-3.5 text-[15px] text-[#18181B] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 transition-all resize-none placeholder:text-[#A1A1AA]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[16px] transition-all shadow-[0_0_16px_rgba(249,115,22,0.25)] hover:shadow-[0_0_28px_rgba(249,115,22,0.4)]">
              Send message →
            </button>
          </form>
        </div>

        {/* Shopify review note */}
        <div className="mt-8 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] p-5 sm:p-6 flex items-start gap-3.5">
          <span className="text-2xl shrink-0">💬</span>
          <div>
            <div className="text-[15px] font-bold text-[#EA580C] mb-1">Already using Skylitee?</div>
            <p className="text-[14px] text-[#92400E] leading-relaxed">
              If you&apos;re enjoying the app, a review on the Shopify App Store helps other D2C brands discover us — and it means a lot to a small team.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
