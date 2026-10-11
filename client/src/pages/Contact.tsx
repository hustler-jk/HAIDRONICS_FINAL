import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Cpu,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Youtube,
} from "lucide-react";
import { Link } from "wouter";
import { useBusinessSettings } from "@/components/SiteShell";
import { whatsappLink } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";

export default function Contact() {
  const settings = useBusinessSettings();
  const trackEvent = trpc.analytics.track.useMutation();
  const whatsappHref = whatsappLink(
    "Hi HAIDRONICS, I have a question about components or project support.",
    settings.whatsappNumber
  );

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#0d1216]">
        <div className="hero-circuit-backdrop" aria-hidden="true" />
        <div className="container relative grid gap-12 py-16 md:py-24 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="eyebrow text-orange-300">
              HAIDRONICS / Sales & engineering
            </p>
            <h1 className="mt-5 font-display text-5xl leading-[0.98] tracking-[-0.055em] text-white md:text-7xl">
              Let’s get your
              <br />
              <span className="text-orange-400">next build moving.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/60 md:text-lg">
              Need a component, sourcing help, or a sounding board for your
              project? Tell us what you’re building and we’ll help you work out
              a practical next step.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={whatsappHref}
                onClick={() => trackEvent.mutate({ event: "whatsapp_click", path: "/contact" })}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 rounded-md bg-[#ff6417] px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle size={15} /> Start a WhatsApp chat
                <ArrowUpRight size={14} />
              </a>
              <Link
                href="/support"
                className="inline-flex items-center gap-2.5 rounded-md border border-white/15 bg-white/[0.035] px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/80 hover:border-orange-400/50 hover:text-orange-200"
              >
                Send a project brief <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <aside className="border border-white/10 bg-[#10171c]/90 p-6 shadow-2xl backdrop-blur md:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center border border-orange-400/25 bg-orange-400/[0.08] text-orange-300">
                <MessageCircle size={18} />
              </span>
              <div>
                <p className="eyebrow text-orange-300">Direct contact</p>
                <h2 className="mt-1 font-display text-xl text-white">
                  Talk to HAIDRONICS
                </h2>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/50">
              For component questions, product availability, or project
              discussions, message our team with a little context about your
              build.
            </p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex items-center justify-between border-t border-white/10 pt-5 font-mono text-xs text-white/75 hover:text-orange-200"
            >
              <span>{settings.whatsappNumber || "WhatsApp"}</span>
              <ArrowUpRight size={16} className="text-orange-300" />
            </a>
            <p className="mt-4 font-mono text-[9px] uppercase leading-5 tracking-[0.1em] text-white/35">
              Include product names, quantities, or project requirements to help
              us understand your enquiry.
            </p>
          </aside>
        </div>
      </section>

      <section className="container grid gap-12 py-16 md:py-20 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="eyebrow text-orange-300">Choose the right channel</p>
          <h2 className="mt-3 font-display text-3xl text-white md:text-4xl">
            How can we help?
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <Link
              href="/support?mode=request"
              className="group flex min-h-48 flex-col justify-between border border-white/10 bg-[#101416] p-5 transition-colors hover:border-orange-400/45 hover:bg-[#141719]"
            >
              <span className="flex items-center justify-between">
                <span className="grid size-10 place-items-center border border-white/10 bg-white/[0.03] text-orange-300">
                  <Cpu size={19} />
                </span>
                <ArrowUpRight
                  size={16}
                  className="text-white/30 transition-colors group-hover:text-orange-300"
                />
              </span>
              <span>
                <span className="block font-display text-xl text-white">
                  Find a component
                </span>
                <span className="mt-2 block text-sm leading-5 text-white/45">
                  Ask about stock or request a part that isn’t listed.
                </span>
              </span>
            </Link>
            <Link
              href="/support"
              className="group flex min-h-48 flex-col justify-between border border-white/10 bg-[#101416] p-5 transition-colors hover:border-orange-400/45 hover:bg-[#141719]"
            >
              <span className="flex items-center justify-between">
                <span className="grid size-10 place-items-center border border-white/10 bg-white/[0.03] text-orange-300">
                  <ShieldCheck size={19} />
                </span>
                <ArrowUpRight
                  size={16}
                  className="text-white/30 transition-colors group-hover:text-orange-300"
                />
              </span>
              <span>
                <span className="block font-display text-xl text-white">
                  Plan a project
                </span>
                <span className="mt-2 block text-sm leading-5 text-white/45">
                  Share a project brief and discuss parts or engineering needs.
                </span>
              </span>
            </Link>
          </div>
          <div className="mt-5 flex items-start gap-3 border-l-2 border-orange-400/50 bg-white/[0.025] px-4 py-4">
            <ShieldCheck
              size={17}
              className="mt-0.5 shrink-0 text-orange-300"
            />
            <p className="text-xs leading-5 text-white/45">
              Project and product request forms require a customer account. Sign
              in before submitting so your enquiry can be associated with your
              account.
            </p>
          </div>
        </div>

        <aside className="border-t border-white/10 pt-7 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <p className="eyebrow text-orange-300">Business information</p>
          <h2 className="mt-3 font-display text-3xl text-white">HAIDRONICS</h2>
          <div className="mt-7 space-y-5">
            {settings.phone && (
              <a
                href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}
                className="flex items-start gap-3 text-sm text-white/65 hover:text-orange-200"
              >
                <Phone size={17} className="mt-0.5 shrink-0 text-orange-300" />
                <span>
                  <span className="block text-xs text-white/35">Phone</span>
                  <span className="mt-1 block">{settings.phone}</span>
                </span>
              </a>
            )}
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="flex items-start gap-3 text-sm text-white/65 hover:text-orange-200"
              >
                <Mail size={17} className="mt-0.5 shrink-0 text-orange-300" />
                <span>
                  <span className="block text-xs text-white/35">Email</span>
                  <span className="mt-1 block">{settings.email}</span>
                </span>
              </a>
            )}
            {settings.address && (
              <div className="flex items-start gap-3 text-sm text-white/65">
                <MapPin size={17} className="mt-0.5 shrink-0 text-orange-300" />
                <span>
                  <span className="block text-xs text-white/35">Address</span>
                  <span className="mt-1 block leading-6">
                    {settings.address}
                  </span>
                  {settings.mapsUrl && (
                    <a
                      href={settings.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-orange-300 hover:text-white"
                    >
                      View map <ArrowUpRight size={12} />
                    </a>
                  )}
                </span>
              </div>
            )}
            {settings.businessHours && (
              <div className="flex items-start gap-3 text-sm text-white/65">
                <Clock3 size={17} className="mt-0.5 shrink-0 text-orange-300" />
                <span>
                  <span className="block text-xs text-white/35">
                    Business hours
                  </span>
                  <span className="mt-1 block leading-6">
                    {settings.businessHours}
                  </span>
                </span>
              </div>
            )}
            {!settings.phone &&
              !settings.email &&
              !settings.address &&
              !settings.businessHours && (
                <p className="text-sm leading-6 text-white/45">
                  Message us on WhatsApp for component enquiries, availability,
                  and project discussions.
                </p>
              )}
          </div>

          {(settings.instagramUrl || settings.youtubeUrl) && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="eyebrow">Follow our work</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {settings.instagramUrl && (
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="HAIDRONICS on Instagram"
                    className="icon-button"
                  >
                    <Instagram size={17} />
                  </a>
                )}
                {settings.youtubeUrl && (
                  <a
                    href={settings.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="HAIDRONICS on YouTube"
                    className="icon-button"
                  >
                    <Youtube size={17} />
                  </a>
                )}
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
