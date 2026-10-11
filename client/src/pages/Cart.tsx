import { FormEvent, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, CheckCircle2, Loader2, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, UserRound } from "lucide-react";
import { Link } from "wouter";
import { useBusinessSettings, useCart } from "@/components/SiteShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { cartMessage, formatINR, whatsappLink } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Cart({ cart }: { cart: ReturnType<typeof useCart> }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const settings = useBusinessSettings();
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [showCheckout, setShowCheckout] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderResult, setOrderResult] = useState<{ orderNumber: string; total: number; subtotal: number; shipping: number } | null>(null);
  const whatsappPopup = useRef<Window | null>(null);
  const trackEvent = trpc.analytics.track.useMutation();

  const createOrder = trpc.checkout.create.useMutation({
    onSuccess: (result) => {
      setOrderResult(result);
      setSubmitted(true);
      toast.success(`Order ${result.orderNumber} created successfully!`);
      const fullMessage = cartMessage(cart.items, customer, result.orderNumber);
      const url = whatsappLink(fullMessage, settings.whatsappNumber);
      if (whatsappPopup.current && !whatsappPopup.current.closed) {
        trackEvent.mutate({ event: "whatsapp_click", path: "/cart" });
        whatsappPopup.current.location.href = url;
      }
      whatsappPopup.current = null;
    },
    onError: (err) => {
      whatsappPopup.current?.close();
      whatsappPopup.current = null;
      toast.error(err.message || "Failed to submit order request");
    },
  });

  const submitCheckout = (event: FormEvent) => {
    event.preventDefault();
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) {
      toast.error("Please fill in your name, phone, and delivery address.");
      return;
    }

    // Open a blank tab during the click gesture so popup blockers allow the
    // WhatsApp redirect after the order request finishes asynchronously.
    whatsappPopup.current = window.open("about:blank", "_blank");
    if (whatsappPopup.current) whatsappPopup.current.opener = null;

    createOrder.mutate({
      customerName: customer.name,
      phone: customer.phone,
      address: customer.address,
      items: cart.items.map((item) => ({ slug: item.id, quantity: item.quantity })),
    });
  };

  const shippingFee = settings.shippingFee;
  const unavailableItems = cart.items.filter(item => item.stockStatus === "Out of stock");
  const estimatedTotal = cart.total + shippingFee;

  return (
    <div className="container min-h-[75vh] py-12 md:py-20">
      <Link href="/products" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/40 hover:text-orange-300">
        <ArrowLeft size={14} /> Continue browsing
      </Link>

      <div className="cart-heading mt-8 flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-orange-300">Selection / WhatsApp order flow</p>
          <h1 className="mt-3 font-display text-5xl tracking-[-0.05em] text-white md:text-7xl">
            Your cart<span className="text-white/25">.</span>
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-white/45">
          Order requests are registered in the HAIDRONICS system and redirected to WhatsApp for payment verification and dispatch.
        </p>
      </div>

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center border-b border-white/10 py-24 text-center">
          <ShoppingBag className="text-white/25" size={40} />
          <h2 className="mt-5 font-display text-2xl text-white">Your cart is empty.</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">
            Explore our development boards, sensors, displays, and robotics modules.
          </p>
          <Link href="/products" className="mt-7 inline-flex items-center gap-2 rounded-md bg-[#ff6417] px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-black hover:bg-orange-400">
            Browse catalog <ArrowUpRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="cart-layout grid gap-12 pt-10 lg:grid-cols-[1fr_0.45fr]">
          {/* Cart Items List */}
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="cart-line-item flex flex-col gap-4 rounded-lg border border-white/[0.08] bg-[#0d1012] p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="product-mini-art" data-variant={item.image}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{item.image === "board" ? "ESP32" : item.image.toUpperCase()}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <Link href={`/products/${item.id}`} className="font-display text-lg text-white hover:text-orange-300">
                    {item.name}
                  </Link>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                    {item.sku} · {formatINR(item.price)} each
                  </p>
                  {item.stockStatus === "Out of stock" && <p className="mt-2 font-mono text-[9px] font-bold uppercase tracking-wider text-red-300">Out of stock — remove to continue</p>}
                </div>

                <div className="cart-item-controls flex items-center justify-between gap-6 sm:justify-end">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 rounded border border-white/15 bg-white/5 px-2 py-1">
                    <button
                      type="button"
                      className="text-white/50 hover:text-white"
                      onClick={() => cart.changeQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="min-w-6 text-center font-mono text-xs text-white">{item.quantity}</span>
                    <button
                      type="button"
                      className="text-white/50 hover:text-white"
                      onClick={() => cart.changeQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <p className="min-w-24 text-right font-mono text-base font-semibold text-orange-300">
                    {formatINR(item.price * item.quantity)}
                  </p>

                  <button
                    type="button"
                    className="text-white/30 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => cart.remove(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={cart.clear}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40 hover:text-white"
              >
                Clear entire cart
              </button>
            </div>
          </div>

          {/* Checkout / Order Summary Box */}
          <aside className="cart-summary h-fit rounded-xl border border-orange-400/30 bg-[#121518] p-6 shadow-2xl">
            <p className="eyebrow text-orange-300">Order Summary</p>

            <div className="mt-6 space-y-3 border-b border-white/10 pb-5 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Items Subtotal</span>
                <span className="font-mono text-white">{formatINR(cart.total)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Standard Shipping</span>
                <span className="font-mono text-white">{formatINR(shippingFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 font-mono text-base font-bold text-white">
                <span>Estimated Total</span>
                <span className="text-orange-300 text-xl">{formatINR(estimatedTotal)}</span>
              </div>
            </div>

            {submitted && orderResult ? (
              <div className="mt-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-5">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider font-semibold">
                  <CheckCircle2 size={18} /> Order Reference Created
                </div>
                <p className="mt-3 font-mono text-xl font-bold text-white tracking-wide">
                  {orderResult.orderNumber}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/70">
                  Your order request has been logged in HAIDRONICS. Click below to continue on WhatsApp and confirm with the engineering team.
                </p>

                <a
                  href={whatsappLink(cartMessage(cart.items, customer, orderResult.orderNumber), settings.whatsappNumber)}
                  onClick={() => trackEvent.mutate({ event: "whatsapp_click", path: "/cart" })}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-black hover:bg-emerald-400 transition-colors"
                >
                  <MessageCircle size={16} /> Open WhatsApp Chat Now
                </a>
              </div>
            ) : !showCheckout || !isAuthenticated ? (
              <div className="mt-6 space-y-4">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => setShowCheckout(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-[#ff6417] px-5 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-black hover:bg-orange-400 transition-colors"
                  >
                    <UserRound size={15} /> Proceed to checkout
                  </button>
                ) : (
                  <Link
                    href="/account?next=%2Fcart"
                    aria-disabled={authLoading}
                    className={`flex w-full items-center justify-center gap-2 rounded-md bg-[#ff6417] px-5 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-colors ${authLoading ? "pointer-events-none opacity-60" : "hover:bg-orange-400"}`}
                  >
                    <UserRound size={15} /> {authLoading ? "Checking account..." : "Sign in to checkout"}
                  </Link>
                )}
                <p className="text-center font-mono text-[9px] uppercase tracking-[0.12em] text-white/35 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={12} className="text-orange-400" /> WhatsApp Hand-off with Order Ledger
                </p>
              </div>
            ) : (
              <form onSubmit={submitCheckout} className="mt-6 space-y-4">
                {unavailableItems.length > 0 && <p role="alert" className="rounded-md border border-red-400/25 bg-red-400/5 p-3 text-xs leading-5 text-red-200">Some items are unavailable or over current stock. Remove them or lower their quantity before placing this order.</p>}
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-300">
                  Enter delivery details
                </p>

                <label className="block">
                  <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-white/50">Full Name *</span>
                  <input
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="h-11 w-full rounded-md border border-white/15 bg-[#0a0c0e] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-orange-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-white/50">WhatsApp / Phone Number *</span>
                  <input
                    required
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    className="h-11 w-full rounded-md border border-white/15 bg-[#0a0c0e] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-orange-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-white/50">Delivery Address *</span>
                  <textarea
                    required
                    rows={3}
                    placeholder="House/Building, Street, City, State, PIN code"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    className="w-full resize-y rounded-md border border-white/15 bg-[#0a0c0e] p-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-orange-400"
                  />
                </label>

                <button
                  type="submit"
                  disabled={createOrder.isPending || unavailableItems.length > 0}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-[#ff6417] px-5 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
                >
                  {createOrder.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Creating Order Reference...
                    </>
                  ) : (
                    <>
                      <MessageCircle size={16} /> Place Order & Open WhatsApp
                    </>
                  )}
                </button>
              </form>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
