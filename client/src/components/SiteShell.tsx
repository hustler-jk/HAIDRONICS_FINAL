import { Link, useLocation } from "wouter";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowUpRight, ChevronRight, Menu, MessageCircle, Search, ShoppingBag, UserRound, X, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem, Product, cartMessage, formatINR, logoIconImage, logoImage, moneyToPaise, normalizeApiProducts, paiseToMoney, whatsappLink } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const emptyCart: CartItem[] = [];
export type BusinessSettings = { businessName: string; whatsappNumber: string; phone: string; email: string; address: string; businessHours: string; mapsUrl: string; instagramUrl: string; youtubeUrl: string; shippingFee: number };
const defaultBusinessSettings: BusinessSettings = { businessName: "HAIDRONICS", whatsappNumber: "918248453861", phone: "", email: "", address: "", businessHours: "", mapsUrl: "", instagramUrl: "https://www.instagram.com/haidronics", youtubeUrl: "https://www.youtube.com/@haidenlabs", shippingFee: 50 };
const BusinessSettingsContext = createContext<BusinessSettings>(defaultBusinessSettings);
export function useBusinessSettings() { return useContext(BusinessSettingsContext); }

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="HAIDRONICS home">
      <img
        src={logoImage}
        alt=""
        aria-hidden="true"
        className={`${compact ? "size-8" : "size-10"} shrink-0 object-contain transition-opacity group-hover:opacity-80`}
      />
      <span className="flex flex-col">
        <span className="font-display text-[17px] font-bold tracking-[0.11em] text-white sm:text-lg">HAIDRONICS</span>
        <span className="hidden font-mono text-[8px] uppercase tracking-[0.14em] text-orange-300/80 sm:block">Where Engineering Starts</span>
      </span>
    </Link>
  );
}

export function useCart() {
  const { data: catalogRows } = trpc.catalog.list.useQuery(undefined, { refetchInterval: 45_000 });
  const trackEvent = trpc.analytics.track.useMutation();
  const liveProducts = useMemo(
    () => new Map(normalizeApiProducts(catalogRows as Array<Record<string, unknown>> | undefined).map((product) => [product.id, product])),
    [catalogRows]
  );
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("haidronics-cart") || "[]");
    } catch {
      return emptyCart;
    }
  });

  useEffect(() => {
    localStorage.setItem("haidronics-cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!catalogRows) return;
    setItems((current) => {
      let changed = false;
      const updated = current.map((item) => {
        const latest = liveProducts.get(item.id);
        if (!latest) {
          if (item.stockStatus === "Out of stock") return item;
          changed = true;
          return { ...item, stock: 0, stockStatus: "Out of stock" };
        }
        const needsUpdate = item.price !== latest.price
          || item.name !== latest.name
          || item.sku !== latest.sku
          || item.stock !== latest.stock
          || item.stockStatus !== latest.stockStatus
          || item.imageUrl !== latest.imageUrl
          || JSON.stringify(item.images || []) !== JSON.stringify(latest.images || []);
        if (!needsUpdate) return item;
        changed = true;
        return { ...item, ...latest, quantity: item.quantity };
      });
      return changed ? updated : current;
    });
  }, [catalogRows, liveProducts]);

  const add = (product: Product, quantity = 1) => {
    const currentProduct = liveProducts.get(product.id) || product;
    const existingItem = items.find((item) => item.id === currentProduct.id);
    if (currentProduct.stockStatus === "Out of stock" || currentProduct.stock === 0) {
      toast.error(`${currentProduct.name} is out of stock.`);
      return false;
    }
    if (currentProduct.stockStatus === "Limited" && currentProduct.stock !== undefined && (existingItem?.quantity || 0) + quantity > currentProduct.stock) {
      toast.error(`Only ${currentProduct.stock} ${currentProduct.name} available.`);
      return false;
    }
    setItems((current) => {
      const existing = current.find((item) => item.id === currentProduct.id);
      return existing
        ? current.map((item) => item.id === currentProduct.id ? { ...currentProduct, quantity: item.quantity + quantity } : item)
        : [...current, { ...currentProduct, quantity }];
    });
    trackEvent.mutate({ event: "add_to_cart", productId: currentProduct.id });
    return true;
  };
  const remove = (id: string) => setItems((current) => current.filter((item) => item.id !== id));
  const changeQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return remove(id);
    const item = items.find((entry) => entry.id === id);
    if (item?.stockStatus === "Limited" && item.stock !== undefined && quantity > item.stock) {
      toast.error(`Only ${item.stock} ${item.name} available.`);
      return;
    }
    setItems((current) => current.map((item) => item.id === id ? { ...item, quantity } : item));
  };
  const clear = () => setItems([]);
  const trackWhatsApp = (path: string) => trackEvent.mutate({ event: "whatsapp_click", path });
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = paiseToMoney(items.reduce((sum, item) => sum + moneyToPaise(item.price) * item.quantity, 0));
  return { items, add, remove, changeQuantity, clear, count, total, trackWhatsApp };
}

export default function SiteShell({ children, cart }: { children: React.ReactNode; cart: ReturnType<typeof useCart> }) {
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);
  const { isAuthenticated } = useAuth();
  const { data: storedSettings } = trpc.catalog.settings.useQuery(undefined, { refetchInterval: 60_000 });
  const businessSettings: BusinessSettings = { businessName: storedSettings?.businessName || defaultBusinessSettings.businessName, whatsappNumber: storedSettings?.whatsappNumber || defaultBusinessSettings.whatsappNumber, phone: storedSettings?.phone || "", email: storedSettings?.email || "", address: storedSettings?.address || "", businessHours: storedSettings?.businessHours || "", mapsUrl: storedSettings?.mapsUrl || "", instagramUrl: storedSettings?.instagramUrl || defaultBusinessSettings.instagramUrl, youtubeUrl: storedSettings?.youtubeUrl || defaultBusinessSettings.youtubeUrl, shippingFee: Number(storedSettings?.shippingFee ?? defaultBusinessSettings.shippingFee) };
  const newsletter = trpc.newsletter.subscribe.useMutation({ onSuccess: () => { setNewsletterSent(true); setNewsletterEmail(""); } });
  const navItems = [
    ["Products", "/products"],
    ["Project support", "/support"],
    ["About", "/about"],
    ["Contact", "/contact"],
  ];

  useEffect(() => {
    setMenuOpen(false);
    setCartOpen(false);
  }, [location]);

  const cartLabel = useMemo(() => cart.count > 9 ? "9+" : String(cart.count), [cart.count]);

  return (
    <BusinessSettingsContext.Provider value={businessSettings}>
    <div className="storefront-shell min-h-screen text-[#f6f3ee] selection:bg-orange-500/30">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#090b0d]/90 backdrop-blur-xl">
        <div className="container flex h-[74px] items-center justify-between gap-5">
          <BrandMark />
          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className={`nav-link ${location.startsWith(href) ? "nav-link-active" : ""}`}>{label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/products" aria-label="Search products" className="icon-button hidden sm:inline-flex"><Search size={18} strokeWidth={1.7} /></Link>
            <Link href="/account" aria-label="Account" className="icon-button hidden sm:inline-flex"><UserRound size={18} strokeWidth={1.7} /></Link>
            <button type="button" className="icon-button relative" aria-label="Open cart" onClick={() => setCartOpen(true)}>
              <ShoppingBag size={18} strokeWidth={1.7} />
              {cart.count > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[#ff6417] font-mono text-[9px] font-bold text-black">{cartLabel}</span>}
            </button>
            <a href={whatsappLink("Hi HAIDRONICS, I have a question about your products.", businessSettings.whatsappNumber)} onClick={() => cart.trackWhatsApp(location)} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-full bg-[#ff6417] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-black transition-transform hover:-translate-y-0.5 active:scale-95 md:inline-flex">
              <MessageCircle size={15} /> WhatsApp
            </a>
            <button type="button" className="icon-button lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-white/[0.08] bg-[#0d1012] px-5 py-4 lg:hidden">
            <nav className="container flex flex-col gap-1">
              {navItems.map(([label, href]) => <Link key={href} href={href} className="rounded-md px-2 py-3 font-mono text-xs uppercase tracking-[0.16em] text-white/65 hover:bg-white/5 hover:text-orange-300">{label}</Link>)}
              <Link href="/account" className="rounded-md px-2 py-3 font-mono text-xs uppercase tracking-[0.16em] text-white/65 hover:bg-white/5 hover:text-orange-300">Account / sign in</Link>
              <a href={whatsappLink("Hi HAIDRONICS, I have a question about your products.", businessSettings.whatsappNumber)} onClick={() => cart.trackWhatsApp(location)} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-md bg-[#ff6417] px-3 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-black"><MessageCircle size={15} /> Chat on WhatsApp</a>
            </nav>
          </div>
        )}
      </header>

      <main className={cart.count > 0 && location !== "/cart" ? "pb-24 md:pb-0" : ""}>{children}</main>

      <footer className="border-t border-white/[0.08] bg-[#070809]">
        <div className="container grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <BrandMark />
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/46">Electronics components, sourcing, and engineering support for practical builds.</p>
            <div className="mt-7 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300/80"><span className="h-px w-8 bg-orange-500" /> Electronics · IoT · Engineering</div>
          </div>
          <div>
            <p className="eyebrow mb-5">Explore</p>
            <div className="grid gap-3 text-sm text-white/55">
              <Link href="/products" className="hover:text-orange-300">Products</Link>
              <Link href="/support" className="hover:text-orange-300">Project support</Link>
              <Link href="/about" className="hover:text-orange-300">About HAIDRONICS</Link>
              <Link href="/contact" className="hover:text-orange-300">Contact</Link>
              <Link href="/faq" className="hover:text-orange-300">FAQ</Link>
              <Link href="/shipping-returns" className="hover:text-orange-300">Shipping & returns</Link>
              <Link href="/privacy" className="hover:text-orange-300">Privacy</Link>
              <Link href="/terms" className="hover:text-orange-300">Terms</Link>
            </div>
          </div>
          <div>
            <p className="eyebrow mb-5">Build notes / occasional</p>
            <p className="max-w-[250px] text-sm leading-6 text-white/55">Get practical component drops and build notes. No noise.</p>
            {newsletterSent ? (
              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.13em] text-emerald-300">You’re on the list.</p>
            ) : isAuthenticated ? (
              <form className="mt-5 flex max-w-[280px] gap-2" onSubmit={(event) => { event.preventDefault(); newsletter.mutate({ email: newsletterEmail }); }}>
                <input type="email" required value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} placeholder="you@example.com" className="h-10 min-w-0 flex-1 border border-white/15 bg-white/[0.04] px-3 text-xs text-white outline-none focus:border-orange-400" />
                <button type="submit" disabled={newsletter.isPending} className="h-10 bg-orange-500 px-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-black">Join</button>
              </form>
            ) : (
              <Link href={`/account?next=${encodeURIComponent(location)}`} className="mt-5 inline-flex font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-orange-300 hover:text-white">
                Sign in to join the list
              </Link>
            )}
          </div>
          <div>
            <p className="eyebrow mb-5">Need a hand?</p>
            <p className="max-w-[220px] text-sm leading-6 text-white/55">Send a product question or project brief. We’ll continue the conversation on WhatsApp.</p>
            <a href={whatsappLink("Hi HAIDRONICS, I need help choosing components.", businessSettings.whatsappNumber)} onClick={() => cart.trackWhatsApp(location)} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300 hover:text-white">Start a conversation <ArrowUpRight size={14} /></a>
            <div className="mt-6 grid gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">{businessSettings.email && <a href={`mailto:${businessSettings.email}`} className="hover:text-orange-300">Email / {businessSettings.email}</a>}<a href={businessSettings.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-orange-300">Instagram / @haidronics</a><a href={businessSettings.youtubeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-orange-300"><Youtube size={13} /> YouTube / Haiden Labs</a></div>
          </div>
        </div>
        <div className="container flex flex-col gap-3 border-t border-white/[0.08] py-5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 HAIDRONICS / cloud catalog</span>
          <span>Product availability and final pricing confirmed on enquiry</span>
        </div>
      </footer>

      {cart.count > 0 && location !== "/cart" && (
        <div className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-xl border border-orange-300/35 bg-[#111619]/95 p-3 shadow-[0_18px_60px_rgba(0,0,0,.55)] backdrop-blur-xl md:inset-x-auto md:bottom-6 md:right-6 md:mx-0 md:w-[380px]">
          <div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-white/45">{cart.count} item{cart.count === 1 ? "" : "s"} in your cart</p><p className="truncate font-mono text-sm font-bold text-orange-300">{formatINR(cart.total)}</p></div>
          <Link href="/cart" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#ff6417] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[.12em] text-black hover:bg-orange-300">Buy now <ArrowUpRight size={14} /></Link>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setCartOpen(false)}>
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#101416] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="eyebrow">Your selection</p><h2 className="mt-2 font-display text-2xl text-white">Cart <span className="text-white/35">/{cart.count}</span></h2></div><button type="button" className="icon-button" onClick={() => setCartOpen(false)}><X size={18} /></button></div>
            {cart.items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center"><ShoppingBag size={28} className="text-white/20" /><p className="mt-4 font-display text-lg">Your cart is clear.</p><p className="mt-2 max-w-[230px] text-sm leading-6 text-white/45">Add a few parts to prepare an order enquiry.</p><Link href="/products" className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300">Browse products <ChevronRight size={14} /></Link></div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto py-6">{cart.items.map((item) => <div key={item.id} className="flex gap-3 border-b border-white/[0.08] pb-4"><div className="product-mini-art" data-variant={item.image}><span>{item.image === "board" ? "ESP32" : item.image.toUpperCase()}</span></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{item.name}</p><p className="mt-1 font-mono text-xs text-orange-300">{formatINR(item.price)} × {item.quantity}</p><div className="mt-2 flex items-center gap-2"><button type="button" className="quantity-button" onClick={() => cart.changeQuantity(item.id, item.quantity - 1)}>−</button><span className="font-mono text-xs text-white/70">{item.quantity}</span><button type="button" className="quantity-button" onClick={() => cart.changeQuantity(item.id, item.quantity + 1)}>+</button><button type="button" className="ml-auto font-mono text-[9px] uppercase tracking-[0.12em] text-white/35 hover:text-red-300" onClick={() => cart.remove(item.id)}>Remove</button></div></div></div>)}</div>
                <div className="border-t border-white/10 pt-5"><div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.12em] text-white/45"><span>Estimated total</span><strong className="text-base text-white">{formatINR(cart.total)}</strong></div><Link href="/cart" className="mt-5 flex w-full items-center justify-center gap-2 rounded-sm bg-[#ff6417] px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-black hover:bg-orange-300 active:scale-[0.98]"><MessageCircle size={15} /> Continue to checkout</Link><button type="button" className="mt-3 w-full py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35 hover:text-white" onClick={cart.clear}>Clear cart</button></div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
    </BusinessSettingsContext.Provider>
  );
}
