import { Mail, MessageSquare } from "lucide-react";

export const metadata = { title: "Contact — Skylitee" };

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-12">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">Get in touch</div>
        <h1 className="text-[40px] font-black text-[#18181B] mb-4">We&apos;re here to help</h1>
        <p className="text-[15px] text-[#71717A]">Reach out for support, feedback or anything else.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <a href="mailto:support@skylitee.io" className="rounded-2xl border border-black/[0.06] p-6 bg-white hover:border-[#F97316]/40 hover:shadow-md transition-all flex flex-col gap-3">
          <div className="w-10 h-10 bg-[#FFF7ED] rounded-xl flex items-center justify-center">
            <Mail size={18} className="text-[#F97316]" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-[#18181B] mb-0.5">Support</div>
            <div className="text-[13px] text-[#71717A]">support@skylitee.io</div>
            <div className="text-[12px] text-[#A1A1AA] mt-1">For app issues and help</div>
          </div>
        </a>
        <a href="mailto:account@skylitee.io" className="rounded-2xl border border-black/[0.06] p-6 bg-white hover:border-[#F97316]/40 hover:shadow-md transition-all flex flex-col gap-3">
          <div className="w-10 h-10 bg-[#FFF7ED] rounded-xl flex items-center justify-center">
            <MessageSquare size={18} className="text-[#F97316]" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-[#18181B] mb-0.5">General</div>
            <div className="text-[13px] text-[#71717A]">account@skylitee.io</div>
            <div className="text-[12px] text-[#A1A1AA] mt-1">For billing and accounts</div>
          </div>
        </a>
      </div>

      {/* Contact form */}
      <div className="rounded-2xl border border-black/[0.06] p-8 bg-white">
        <h2 className="text-[18px] font-bold text-[#18181B] mb-6">Send us a message</h2>
        <form className="space-y-4" action="mailto:support@skylitee.io" method="get" encType="text/plain">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-bold text-[#18181B] uppercase tracking-[0.08em] block mb-1.5">Name</label>
              <input name="name" type="text" placeholder="Your name" className="w-full border border-black/[0.10] rounded-xl px-4 py-2.5 text-[13px] text-[#18181B] outline-none focus:border-[#F97316] transition-colors" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-[#18181B] uppercase tracking-[0.08em] block mb-1.5">Email</label>
              <input name="email" type="email" placeholder="you@example.com" className="w-full border border-black/[0.10] rounded-xl px-4 py-2.5 text-[13px] text-[#18181B] outline-none focus:border-[#F97316] transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-bold text-[#18181B] uppercase tracking-[0.08em] block mb-1.5">Subject</label>
            <input name="subject" type="text" placeholder="How can we help?" className="w-full border border-black/[0.10] rounded-xl px-4 py-2.5 text-[13px] text-[#18181B] outline-none focus:border-[#F97316] transition-colors" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-[#18181B] uppercase tracking-[0.08em] block mb-1.5">Message</label>
            <textarea name="body" rows={5} placeholder="Tell us more..." className="w-full border border-black/[0.10] rounded-xl px-4 py-2.5 text-[13px] text-[#18181B] outline-none focus:border-[#F97316] transition-colors resize-none" />
          </div>
          <button type="submit" className="w-full py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[13px] transition-colors">
            Send Message →
          </button>
        </form>
      </div>
    </div>
  );
}
