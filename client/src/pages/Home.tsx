import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  MessageCircle,
  MoveUpRight,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Link } from "wouter";
import { ProductCard } from "@/components/CatalogUI";
import {
  categoriesForProducts,
  formatINR,
  normalizeApiProducts,
  whatsappLink,
} from "@/lib/catalog";
import { useBusinessSettings, useCart } from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

const localBannerSlides: BannerSlide[] = [
  {
    id: "community-instagram",
    kind: "instagram",
    title: "Ideas start here.",
    body: "Discover the people, projects, and electronics that make building together more fun.",
    url: "",
    imageUrl: new URL("../../../coursel_images/haidronics_insta.jpg", import.meta.url).href,
    badge: "HAIDRONICS community",
  },
  {
    id: "arduino-uno",
    kind: "announcement",
    title: "Make your first idea real.",
    body: "Start with familiar tools and turn a simple sketch into something you can hold, test, and improve.",
    url: "",
    imageUrl: new URL("../../../coursel_images/audrinouno.jpg", import.meta.url).href,
    badge: "Start building / Arduino",
  },
  {
    id: "bluetooth-module",
    kind: "announcement",
    title: "Bring your build to life.",
    body: "Explore wireless control and connect your electronics projects to the world around them.",
    url: "",
    imageUrl: new URL("../../../coursel_images/bluetoothmod.jpg", import.meta.url).href,
    badge: "Explore / Bluetooth",
  },
  {
    id: "buck-converter",
    kind: "announcement",
    title: "Power every possibility.",
    body: "Find the practical parts that help your next prototype move from a bright idea to a working build.",
    url: "",
    imageUrl: new URL("../../../coursel_images/buck_converter.jpg", import.meta.url).href,
    badge: "Build essentials / Power",
  },
  {
    id: "esp32",
    kind: "announcement",
    title: "Make your ideas connected.",
    body: "Build smarter IoT projects with versatile components for wireless, sensing, and experimentation.",
    url: "",
    imageUrl: new URL("../../../coursel_images/esp32.jpg", import.meta.url).href,
    badge: "Explore / ESP32",
  },
  {
    id: "haidenlabs-instagram",
    kind: "instagram",
    title: "See what makers are making.",
    body: "Get a closer look at experiments, builds, and the ideas taking shape in the HAIDRONICS community.",
    url: "",
    imageUrl: new URL("../../../coursel_images/haidenlabs_insta.jpg", import.meta.url).href,
    badge: "From the community / Instagram",
  },
  {
    id: "li-ion",
    kind: "announcement",
    title: "Take your project further.",
    body: "Explore components for portable builds, thoughtful prototypes, and ideas that are ready to move.",
    url: "",
    imageUrl: new URL("../../../coursel_images/li-ion.jpg", import.meta.url).href,
    badge: "Build essentials / Portable power",
  },
  {
    id: "rfid",
    kind: "announcement",
    title: "Turn a tap into an idea.",
    body: "Try RFID and bring access, identification, and interactive experiments into your next project.",
    url: "",
    imageUrl: new URL("../../../coursel_images/rfid.jpg", import.meta.url).href,
    badge: "Explore / RFID",
  },
  {
    id: "haidenlabs-youtube",
    kind: "youtube",
    title: "Learn it. Build it. Make it yours.",
    body: "Follow along with electronics projects and pick up inspiration for the next thing on your workbench.",
    url: "",
    imageUrl: new URL("../../../coursel_images/haidenlabsyt.jpg", import.meta.url).href,
    badge: "Watch & learn / Haiden Labs",
  },
];

export default function Home({ cart }: { cart: ReturnType<typeof useCart> }) {
  const settings = useBusinessSettings();
  const trackEvent = trpc.analytics.track.useMutation();
  const { data: catalogRows } = trpc.catalog.list.useQuery(undefined, { refetchInterval: 60_000 });
  const { data: storiesRows } = trpc.catalog.customerStories.useQuery(undefined, { refetchInterval: 60_000 });
  const { data: updateRows } = trpc.catalog.updates.useQuery(undefined, { refetchInterval: 60_000 });
  const liveProducts = normalizeApiProducts(
    catalogRows as Array<Record<string, unknown>> | undefined
  );
  const sourceProducts = liveProducts;
  const categoryCards = categoriesForProducts(liveProducts).filter((category) => category !== "All");
  const featured = sourceProducts.filter(product => product.featured);
  const latestProducts = sourceProducts.slice(0, 4);
  const hasStories = Array.isArray(storiesRows) && storiesRows.length > 0;
  const orderedLocalSlides = [...localBannerSlides].sort((a, b) => {
    const order = ["community-instagram", "esp32", "arduino-uno", "bluetooth-module", "buck-converter", "li-ion", "rfid", "haidenlabs-instagram", "haidenlabs-youtube"];
    return order.indexOf(a.id) - order.indexOf(b.id);
  }).map(slide => ({ ...slide, artwork: true, url: slide.kind === "instagram" ? settings.instagramUrl : slide.kind === "youtube" ? settings.youtubeUrl : "/products" }));
  const updateSlides: BannerSlide[] = (updateRows ?? []).map(update => ({
      id: `update-${update.id}`,
      kind: update.kind as "instagram" | "youtube" | "announcement",
      title: update.title,
      body: update.body || "",
      url: update.url || "",
      imageUrl: update.imageUrl || "",
      badge: update.kind === "instagram" ? "Instagram" : update.kind === "youtube" ? "YouTube" : "HAIDRONICS update",
    }));
  const bannerSlides: BannerSlide[] = [...orderedLocalSlides.slice(0, -2), ...updateSlides, ...orderedLocalSlides.slice(-2)];

  return (
    <>
      <HeroBannerCarousel slides={bannerSlides} />

      <nav
        aria-label="On this page"
        className="sticky top-[74px] z-30 border-y border-white/[0.08] bg-[#0b0f12]/95 backdrop-blur"
      >
        <div className="container flex gap-6 overflow-x-auto py-4 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">
          <a className="shrink-0 hover:text-orange-300" href="#new-arrivals">
            New arrivals
          </a>
          <a className="shrink-0 hover:text-orange-300" href="#home-banners">
            Featured banners
          </a>
          <a className="shrink-0 hover:text-orange-300" href="#collections">
            Browse by category
          </a>
          {hasStories && (
            <a
              className="shrink-0 hover:text-orange-300"
              href="#customer-builds"
            >
              Customer builds
            </a>
          )}
          <a className="shrink-0 hover:text-orange-300" href="#why-haidronics">
            Why HAIDRONICS
          </a>
          <a className="shrink-0 hover:text-orange-300" href="#contact-team">
            Talk to our team
          </a>
        </div>
      </nav>

      <section
        id="new-arrivals"
        className="container scroll-mt-36 py-20 md:py-28"
      >
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-orange-300">
              Catalog / latest additions
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight text-white md:text-5xl">
              New to the catalog.
              <br />
              <span className="text-white/35">Ready for your workbench.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">
              Recently added components, shown from the current catalog. Check
              the product page for specifications and availability.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-orange-300 hover:text-white"
          >
            View full catalog <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latestProducts.map(product => (
            <ProductCard key={product.id} product={product} cartQuantity={cart.items.find(item => item.id === product.id)?.quantity ?? 0} onAdd={cart.add} />
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="border-y border-white/[0.08] bg-[#0c0f11] py-16 md:py-20">
          <div className="container">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="eyebrow text-orange-300">Selected components</p>
                <h2 className="mt-3 max-w-xl font-display text-4xl leading-tight text-white md:text-5xl">
                  Picks for your
                  <br />
                  <span className="text-white/35">next prototype.</span>
                </h2>
              </div>
              <Link
                href="/products"
                className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-orange-300 hover:text-white"
              >
                Explore all parts{" "}
                <ArrowUpRight className="ml-1 inline" size={14} />
              </Link>
            </div>
            <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {featured.slice(0, 4).map(product => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group flex items-center gap-4 border border-white/10 bg-white/[0.025] p-3 transition-colors hover:border-orange-400/40"
                >
                  <span className="grid size-16 shrink-0 place-items-center border border-orange-300/20 bg-orange-300/[0.06] text-orange-300">
                    <CircuitBoard size={23} />
                  </span>
                  <div className="min-w-0">
                    <p className="eyebrow text-orange-300/80">
                      {product.category}
                    </p>
                    <p className="mt-1 truncate font-display text-sm text-white group-hover:text-orange-200">
                      {product.name}
                    </p>
                    <p className="mt-1 font-mono text-xs text-white/50">
                      {formatINR(product.price)}
                    </p>
                  </div>
                  <ArrowUpRight
                    className="ml-auto shrink-0 text-white/30 group-hover:text-orange-300"
                    size={15}
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section
        id="collections"
        className="scroll-mt-36 border-y border-white/[0.08] bg-[#0d1012] py-16 md:py-20"
      >
        <div className="container">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="eyebrow text-orange-300">Shop by discipline</p>
              <h2 className="mt-3 font-display text-4xl text-white md:text-5xl">
                Find your starting point.
              </h2>
            </div>
            <Link
              href="/products"
              className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-orange-300"
            >
              Browse all categories{" "}
              <ArrowUpRight className="ml-1 inline" size={14} />
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categoryCards.map((category, index) => (
                <Link
                  key={category}
                  href={`/products?category=${encodeURIComponent(category)}`}
                  className="group border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-orange-400/50 hover:bg-orange-500/[0.06]"
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-orange-300">
                    0{index + 1} / collection
                  </p>
                  <p className="mt-8 font-display text-2xl text-white group-hover:text-orange-300">
                    {category}
                  </p>
                  <p className="mt-2 text-sm text-white/35">
                    {
                      sourceProducts.filter(
                        product => product.category === category
                      ).length
                    }{" "}
                    catalog items
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {hasStories && (
        <section
          id="customer-builds"
          className="scroll-mt-36 border-y border-white/[0.08] bg-[#111416] py-20 md:py-28"
        >
          <div className="container">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="eyebrow text-orange-300">Customer projects</p>
                <h2 className="mt-3 max-w-2xl font-display text-4xl text-white md:text-6xl">
                  Real builds.
                  <br />
                  <span className="text-white/30">Engineering in action.</span>
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-6 text-white/50">
                  A look at the ideas customers are bringing to life with
                  electronics and engineering.
                </p>
              </div>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-orange-300 hover:text-white"
              >
                Start your project <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {(storiesRows as Array<Record<string, unknown>>)
                .slice(0, 6)
                .map(story => (
                  <article
                    key={String(story.id)}
                    className="overflow-hidden border border-white/10 bg-white/[0.03]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#0a0d0e]">
                      {story.imageUrl ? (
                        <img
                          src={String(story.imageUrl)}
                          alt={String(story.title)}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center font-mono text-[10px] uppercase tracking-[0.14em] text-white/25">
                          Project documentation
                        </div>
                      )}
                      <span className="absolute left-4 top-4 border border-orange-400/30 bg-black/70 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.13em] text-orange-300">
                        {String(story.projectType || "Customer build")}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-2xl text-white">
                        {String(story.title)}
                      </h3>
                      {story.customerName ? (
                        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.13em] text-orange-300">
                          {String(story.customerName)}
                        </p>
                      ) : null}
                      {story.caption ? (
                        <p className="mt-3 text-sm leading-6 text-white/50">
                          {String(story.caption)}
                        </p>
                      ) : null}
                    </div>
                  </article>
                ))}
            </div>
          </div>
        </section>
      )}

      <section
        id="why-haidronics"
        className="scroll-mt-36 border-y border-white/[0.08] bg-[#f2eee7] py-20 text-[#111416] md:py-28"
      >
        <div className="container grid items-end gap-12 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow text-[#ec5c19]">The HAIDRONICS approach</p>
            <h2 className="mt-4 max-w-md font-display text-4xl leading-[0.97] tracking-[-0.04em] md:text-6xl">
              Less friction.
              <br />
              <span className="text-black/35">More building.</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-black/55">
              A straightforward place to find components and get practical
              support for your electronics project.
            </p>
          </div>
          <div className="grid gap-0 border-t border-black/15 sm:grid-cols-2">
            <div className="border-b border-black/15 py-5 sm:pr-6">
              <p className="font-display text-xl">01 / Clear information</p>
              <p className="mt-2 text-sm leading-6 text-black/55">
                Specs and product details to help you choose.
              </p>
            </div>
            <div className="border-b border-black/15 py-5 sm:pl-6">
              <p className="font-display text-xl">02 / Built for projects</p>
              <p className="mt-2 text-sm leading-6 text-black/55">
                Components for learning, prototyping, and making.
              </p>
            </div>
            <div className="py-5 sm:pr-6">
              <p className="font-display text-xl">03 / Human support</p>
              <p className="mt-2 text-sm leading-6 text-black/55">
                Talk through a part, a project, or a sourcing question.
              </p>
            </div>
            <div className="py-5 sm:pl-6">
              <p className="font-display text-xl">04 / Clear next steps</p>
              <p className="mt-2 text-sm leading-6 text-black/55">
                Confirm stock, final pricing, and delivery with our team.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="contact-team"
        className="scroll-mt-36 border-y border-white/[0.08] bg-[#0c0f11] py-16 md:py-20"
      >
        <div className="container grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-2 text-orange-300">
              <ShieldCheck size={17} />
              <p className="eyebrow text-orange-300">Talk to the team</p>
            </div>
            <h2 className="mt-4 max-w-2xl font-display text-3xl text-white md:text-5xl">
              Have a build in mind?
              <br />
              <span className="text-white/40">Let’s find the right parts.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">
              Send a project brief or contact us directly to discuss components,
              availability, and next steps.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-sm bg-[#ff6417] px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black"
            >
              Request project support <ArrowUpRight size={14} />
            </Link>
            <a
              href={whatsappLink(
                "Hi HAIDRONICS, I would like to discuss an electronics project.",
                settings.whatsappNumber
              )}
              onClick={() => trackEvent.mutate({ event: "whatsapp_click", path: "/" })}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-sm border border-white/15 px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/75 hover:border-orange-400 hover:text-orange-300"
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.08] bg-[#0c0f11] py-8">
        <div className="container flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-white/55">
            <Boxes size={20} className="text-orange-300" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
              New to electronics?
            </span>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-orange-300 hover:text-white"
          >
            Start with the essentials <MoveUpRight size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}

type BannerSlide = {
  id: string;
  kind: "instagram" | "youtube" | "announcement";
  title: string;
  body: string;
  url: string;
  imageUrl: string;
  badge: string;
  artwork?: boolean;
};

function HeroBannerCarousel({ slides }: { slides: BannerSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const next = () => setActiveIndex(index => (index + 1) % slides.length);
  const previous = () => setActiveIndex(index => (index - 1 + slides.length) % slides.length);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (slides.length < 2 || isPaused || prefersReducedMotion || document.hidden) return;
    const timer = window.setInterval(() => {
      setActiveIndex(index => (index + 1) % slides.length);
    }, 7500);
    return () => window.clearInterval(timer);
  }, [slides.length, isPaused, prefersReducedMotion]);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  useEffect(() => {
    const pauseWhenHidden = () => setIsPaused(document.hidden);
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  return (
    <section
      id="home-banners"
      aria-label="Featured HAIDRONICS banners"
      className="hero-banner-section relative isolate overflow-hidden border-b border-white/10 bg-[#080b0d]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false);
      }}
    >
      <div
        role="region"
        aria-label="Rotating storefront banners"
        aria-roledescription="carousel"
        aria-live="off"
        className="relative w-full overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false);
        }}
      >
        <div
          className={`flex w-full transition-transform duration-1000 ease-[cubic-bezier(.22,.75,.25,1)] motion-reduce:transition-none ${prefersReducedMotion ? "!transition-none" : ""}`}
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((card, index) => {
            const external = card.url.startsWith("https://");
            const href = external ? card.url : "/products";
            return (
              <div key={card.id} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}`} className="min-w-full shrink-0">
              <div className={`hero-banner-slide group/banner relative min-h-0 w-full overflow-hidden bg-[#080a0c] ${index === activeIndex ? "is-active" : ""} ${card.artwork ? "hero-banner-artwork" : ""}`}>
                  <div className={`hero-banner-fallback absolute inset-0 ${card.imageUrl ? "hidden" : ""}`}>
                    <span className="hero-banner-fallback-grid" />
                    <span className="hero-banner-orbit hero-banner-orbit-one" />
                    <span className="hero-banner-orbit hero-banner-orbit-two" />
                    <span className="hero-banner-fallback-mark">H<span>.</span></span>
                  </div>
                  {card.imageUrl && (
                    <img
                      src={card.imageUrl}
                      alt=""
                      aria-hidden="true"
                      loading={index === activeIndex ? "eager" : "lazy"}
                      className="hero-banner-backdrop absolute inset-0 size-full object-cover"
                    />
                  )}
                  {card.imageUrl && (
                    <img
                      src={card.imageUrl}
                      alt=""
                      loading={index === activeIndex ? "eager" : "lazy"}
                      fetchPriority={index === activeIndex ? "high" : "auto"}
                      onError={(event) => {
                        event.currentTarget.classList.add("hidden");
                        event.currentTarget.parentElement?.querySelector(".hero-banner-fallback")?.classList.remove("hidden");
                      }}
                      className="hero-banner-image absolute inset-0 size-full object-contain"
                    />
                  )}
                  {!card.artwork && <div className="hero-banner-shade absolute inset-0" />}
                  {!card.artwork && <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-5 sm:px-9 sm:py-8 lg:px-14">
                    <Link href="/" className="inline-flex items-center gap-3 text-white/90">
                      <span className="grid size-9 place-items-center rounded-sm border border-orange-300/40 bg-black/20 font-display text-lg font-bold text-orange-300">H</span>
                      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] sm:text-[10px]">HAIDRONICS <i className="text-white/35">/</i> ENGINEERING</span>
                    </Link>
                    <span className="hidden items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.14em] text-white/75 backdrop-blur sm:inline-flex">
                      <span className="size-1.5 animate-pulse rounded-full bg-orange-400" /> FEATURED / {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>}
                  {!card.artwork && <div key={`${card.id}-${index === activeIndex ? activeIndex : "idle"}`} className={`hero-banner-copy absolute inset-x-0 bottom-0 z-10 pl-20 pr-6 pb-24 pt-28 sm:pl-24 sm:pr-10 sm:pb-28 lg:pl-28 lg:pr-16 lg:pb-32 ${index === activeIndex ? "is-active" : ""}`}>
                    <div className="max-w-3xl">
                      <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-orange-300/30 bg-black/30 px-3.5 py-2 font-mono text-[8px] uppercase tracking-[0.15em] text-orange-100 backdrop-blur sm:text-[9px]">
                        <span className="size-1.5 shrink-0 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,.9)]" />
                        <span className="truncate">{card.badge}</span>
                      </div>
                      <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.8rem,8vw,7.5rem)] font-semibold leading-[.9] tracking-[-.065em] text-white">
                        {card.title}
                      </h1>
                      <p className="mt-5 max-w-2xl whitespace-pre-line text-sm leading-6 text-white/75 sm:text-base sm:leading-7 lg:text-lg">
                        {card.body}
                      </p>
                      <div className="mt-7 flex flex-wrap gap-3">
                        {external ? (
                          <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 rounded-sm bg-[#ff6417] px-5 py-3.5 font-mono text-[9px] font-bold uppercase tracking-[.14em] text-black transition hover:-translate-y-0.5 hover:bg-orange-300 sm:text-[10px]">
                            {card.kind === "youtube" ? "Watch the feature" : card.kind === "instagram" ? "See the post" : "Learn more"}
                            <ArrowUpRight size={15} />
                          </a>
                        ) : (
                          <Link href="/products" className="inline-flex items-center gap-3 rounded-sm bg-[#ff6417] px-5 py-3.5 font-mono text-[9px] font-bold uppercase tracking-[.14em] text-black transition hover:-translate-y-0.5 hover:bg-orange-300 sm:text-[10px]">
                            Explore components <ArrowUpRight size={15} />
                          </Link>
                        )}
                        <Link href="/support" className="inline-flex items-center gap-3 rounded-sm border border-white/30 bg-black/15 px-5 py-3.5 font-mono text-[9px] font-bold uppercase tracking-[.14em] text-white backdrop-blur transition hover:border-white/70 hover:bg-black/30 sm:text-[10px]">
                          Build with us <MoveUpRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>}
              </div>
              </div>
            );
          })}
        </div>
        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous banner"
              onClick={previous}
              className="absolute left-4 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/35 text-white shadow-lg backdrop-blur transition hover:scale-105 hover:border-orange-300 hover:bg-black/70 sm:left-8 lg:left-10"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Next banner"
              onClick={next}
              className="absolute right-4 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/35 text-white shadow-lg backdrop-blur transition hover:scale-105 hover:border-orange-300 hover:bg-black/70 sm:right-8 lg:right-10"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <div className="container flex items-center justify-between pb-5 sm:pb-7">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/60">
          BANNER / {String(activeIndex + 1).padStart(2, "0")} <span className="text-white/35">OF {String(slides.length).padStart(2, "0")}</span>
        </span>
        <div className="pointer-events-auto flex max-w-[65vw] items-center gap-1.5 overflow-x-auto px-1 py-2 sm:gap-2">
          {slides.map((card, index) => (
            <button
              key={card.id}
              type="button"
              aria-label={`Show banner ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 shrink-0 rounded-full transition-all ${index === activeIndex ? "w-8 bg-orange-400" : "w-2 bg-white/40 hover:bg-white/80"}`}
            />
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
