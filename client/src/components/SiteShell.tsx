import { Link, useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChevronRight, Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem, Product, cartMessage, formatINR, whatsappLink } from "@/lib/catalog";

const emptyCart: CartItem[] = [];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="HAIDRONICS home">
      <span className="brand-mark" aria-hidden="true">
        <span className="brand-mark-line brand-mark-line-a" />
        <span className="brand-mark-line brand-mark-line-b" />
        <span className="brand-mark-node brand-mark-node-a" />
        <span className="brand-mark-node brand-mark-node-b" />
      </span>
      <span className="leading-none">
        <span className="block font-display text-[1.1rem] font-semibold tracking-[0.19em] text-white group-hover:text-orange-300 transition-colors">HAIDRONICS</span>
        {!compact && <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.22em] text-white/45">Where engineering starts</span>}
      </span>
    </Link>
  );
}

export function useCart() {
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

  const add = (product: Product) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      return existing
        ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }];
    });
  };
  const remove = (id: string) => setItems((current) => current.filter((item) => item.id !== id));
  const changeQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return remove(id);
    setItems((current) => current.map((item) => item.id === id ? { ...item, quantity } : item));
  };
  const clear = () => setItems([]);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { items, add, remove, changeQuantity, clear, count, total };
}

export default function SiteShell({ children, cart }: { children: React.ReactNode; cart: ReturnType<typeof useCart> }) {
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
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
    <div className="min-h-screen bg-[#090b0d] text-[#f6f3ee] selection:bg-orange-500/30">
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
            <button type="button" className="icon-button relative" aria-label="Open cart" onClick={() => setCartOpen(true)}>
              <ShoppingBag size={18} strokeWidth={1.7} />
              {cart.count > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[#ff6417] font-mono text-[9px] font-bold text-black">{cartLabel}</span>}
            </button>
            <a href={whatsappLink("Hi HAIDRONICS, I have a question about your products.")} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-full bg-[#ff6417] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-black transition-transform hover:-translate-y-0.5 active:scale-95 md:inline-flex">
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
              <a href={whatsappLink("Hi HAIDRONICS, I have a question about your products.")} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-md bg-[#ff6417] px-3 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-black"><MessageCircle size={15} /> Chat on WhatsApp</a>
            </nav>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/[0.08] bg-[#070809]">
        <div className="container grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <BrandMark />
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/46">A focused parts catalog for builders, students, and teams moving from first sketch to working prototype.</p>
            <div className="mt-7 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300/80"><span className="h-px w-8 bg-orange-500" /> cloud catalog / v1</div>
          </div>
          <div>
            <p className="eyebrow mb-5">Explore</p>
            <div className="grid gap-3 text-sm text-white/55">
              <Link href="/products" className="hover:text-orange-300">Products</Link>
              <Link href="/support" className="hover:text-orange-300">Project support</Link>
              <Link href="/about" className="hover:text-orange-300">About HAIDRONICS</Link>
              <Link href="/contact" className="hover:text-orange-300">Contact</Link>
            </div>
          </div>
          <div>
            <p className="eyebrow mb-5">Need a hand?</p>
            <p className="max-w-[220px] text-sm leading-6 text-white/55">Send a product question or project brief. We’ll continue the conversation on WhatsApp.</p>
            <a href={whatsappLink("Hi HAIDRONICS, I need help choosing components.")} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300 hover:text-white">Start a conversation <ArrowUpRight size={14} /></a>
          </div>
        </div>
        <div className="container flex flex-col gap-3 border-t border-white/[0.08] py-5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 HAIDRONICS / cloud catalog</span>
          <span>Product availability and final pricing confirmed on enquiry</span>
        </div>
      </footer>

      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setCartOpen(false)}>
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#101416] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="eyebrow">Your selection</p><h2 className="mt-2 font-display text-2xl text-white">Cart <span className="text-white/35">/{cart.count}</span></h2></div><button type="button" className="icon-button" onClick={() => setCartOpen(false)}><X size={18} /></button></div>
            {cart.items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center"><ShoppingBag size={28} className="text-white/20" /><p className="mt-4 font-display text-lg">Your cart is clear.</p><p className="mt-2 max-w-[230px] text-sm leading-6 text-white/45">Add a few parts to prepare an order enquiry.</p><Link href="/products" className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300">Browse products <ChevronRight size={14} /></Link></div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto py-6">{cart.items.map((item) => <div key={item.id} className="flex gap-3 border-b border-white/[0.08] pb-4"><div className="product-mini-art" data-variant={item.image}><span>{item.image === "board" ? "ESP32" : item.image.toUpperCase()}</span></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{item.name}</p><p className="mt-1 font-mono text-xs text-orange-300">{formatINR(item.price)} × {item.quantity}</p><div className="mt-2 flex items-center gap-2"><button type="button" className="quantity-button" onClick={() => cart.changeQuantity(item.id, item.quantity - 1)}>−</button><span className="font-mono text-xs text-white/70">{item.quantity}</span><button type="button" className="quantity-button" onClick={() => cart.changeQuantity(item.id, item.quantity + 1)}>+</button><button type="button" className="ml-auto font-mono text-[9px] uppercase tracking-[0.12em] text-white/35 hover:text-red-300" onClick={() => cart.remove(item.id)}>Remove</button></div></div></div>)}</div>
                <div className="border-t border-white/10 pt-5"><div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.12em] text-white/45"><span>Estimated total</span><strong className="text-base text-white">{formatINR(cart.total)}</strong></div><a href={whatsappLink(cartMessage(cart.items))} target="_blank" rel="noreferrer" className="mt-5 flex w-full items-center justify-center gap-2 rounded-sm bg-[#ff6417] px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-black hover:bg-orange-300 active:scale-[0.98]"><MessageCircle size={15} /> Send order enquiry</a><button type="button" className="mt-3 w-full py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35 hover:text-white" onClick={cart.clear}>Clear cart</button></div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
