import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, Cpu, Layers3, MessageCircle, Minus, Package, Plus, ShieldCheck, ShoppingBag, Sparkles, Zap } from "lucide-react";
import { Link, useRoute } from "wouter";
import { ProductCard, ProductVisual } from "@/components/CatalogUI";
import { ComboKit, formatINR, normalizeApiComboKits, normalizeApiProducts, productEnquiry, recommendedProducts, whatsappLink } from "@/lib/catalog";
import { useBusinessSettings, useCart } from "@/components/SiteShell";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ProductDetail({ cart }: { cart: ReturnType<typeof useCart> }) {
  const settings = useBusinessSettings();
  const [, params] = useRoute("/products/:id");
  const { data: liveProduct, isLoading: productLoading, error: productError } = trpc.catalog.get.useQuery({ slug: params?.id || "" }, { enabled: Boolean(params?.id), retry: false, refetchInterval: 45_000 });
  const { data: catalogRows } = trpc.catalog.list.useQuery(undefined, { refetchInterval: 45_000 });
  const { data: comboRows } = trpc.catalog.comboKits.useQuery(undefined, { refetchInterval: 60_000 });
  const trackEvent = trpc.analytics.track.useMutation();
  
  const liveProductValue = useMemo(
    () => normalizeApiProducts(liveProduct ? [liveProduct as unknown as Record<string, unknown>] : undefined)[0],
    [liveProduct]
  );
  const liveProducts = useMemo(
    () => normalizeApiProducts(catalogRows as Array<Record<string, unknown>> | undefined),
    [catalogRows]
  );
  const sourceProducts = liveProducts;
  const product = liveProductValue;
  const productPhotos = product ? (product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : []) : [];
  const kits = normalizeApiComboKits(comboRows as Array<Record<string, unknown>> | undefined);
  
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeSpec, setActiveSpec] = useState(0);
  const [activePhoto, setActivePhoto] = useState(0);
  useEffect(() => setActivePhoto(0), [product?.id]);
  useEffect(() => { if (product?.id) trackEvent.mutate({ event: "product_view", productId: product.id }); }, [product?.id]);

  // Recommendations
  const related = useMemo(() => (product ? recommendedProducts(product, sourceProducts) : []), [product, sourceProducts]);
  const relatedKits = useMemo(() => (product ? kits.filter((kit) => kit.items.some((item) => item.productSlug === product.id)) : []), [kits, product]);

  // Frequently Bought Together Bundle state
  const [selectedBundleSlugs, setSelectedBundleSlugs] = useState<string[]>([]);
  const initializedBundleFor = useRef<string | null>(null);

  useEffect(() => {
    if (!product || !related.length || initializedBundleFor.current === product.id) return;
    setSelectedBundleSlugs(related.slice(0, 2).map((p) => p.id));
    initializedBundleFor.current = product.id;
  }, [product?.id, related]);

  if (!product && productLoading) {
    return (
      <div className="container grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-white/15 border-t-orange-400" />
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Loading component details</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-28 text-center">
        <p className="eyebrow text-orange-300">{productError ? "Catalog / unable to load" : "404 / component not found"}</p>
        <h1 className="mt-4 font-display text-4xl text-white">{productError ? "We couldn’t load this component." : "Product not in catalog."}</h1>
        <p className="mt-3 text-sm text-white/45">{productError ? "Please try again in a moment, or browse the catalog for available components." : "The requested component may have moved or been unlisted."}</p>
        <Link href="/products" className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-orange-300 hover:text-white">
          Back to catalog <ArrowUpRight size={14} />
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stockStatus === "Out of stock" || (product.stock !== undefined && product.stock <= 0);
  const isLowStock = !isOutOfStock && (product.stockStatus === "Limited" || (product.stock !== undefined && product.stock > 0 && product.stock <= (product.lowStockThreshold ?? 5)));
  const cartQuantity = cart.items.find((item) => item.id === product.id)?.quantity ?? 0;

  const addProductToCart = () => {
    if (!cart.add(product, quantity)) return;
    setAdded(true);
    toast.success(`Added ${quantity}× ${product.name} to cart`);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const addKit = (kit: ComboKit) => {
    let addedAll = true;
    kit.items.forEach((item) => {
      const kitProduct = sourceProducts.find((candidate) => candidate.id === item.productSlug);
      if (kitProduct) {
        if (!cart.add(kitProduct, item.quantity)) addedAll = false;
      }
    });
    if (addedAll) toast.success(`Added ${kit.name} bundle to cart!`);
  };

  const toggleBundleItem = (slug: string) => {
    setSelectedBundleSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const bundleSelectedProducts = related.filter((p) => selectedBundleSlugs.includes(p.id));
  const bundleTotalPrice = product.price + bundleSelectedProducts.reduce((sum, p) => sum + p.price, 0);

  const addBundleToCart = () => {
    // Add main product
    cart.add(product);
    // Add selected bundle products
    bundleSelectedProducts.forEach((p) => cart.add(p));
    toast.success(`Added combo bundle (${1 + bundleSelectedProducts.length} items) to cart!`);
  };

  const directOrderMessage = `⚡ *HAIDRONICS Fast Order*\n\n` +
    `*Product:* ${product.name}\n` +
    `*SKU:* ${product.sku}\n` +
    `*Quantity:* ${quantity}\n` +
    `*Unit Price:* ${formatINR(product.price)}\n` +
    `*Subtotal:* ${formatINR(product.price * quantity)}\n\n` +
    `Please confirm stock availability and shipping instructions.`;

  return (
    <div className="product-detail-page pb-20">
      {/* Product Hero Section */}
      <section className="product-detail-hero border-b border-white/[0.08] bg-[#090b0d]">
        <div className="container py-8 md:py-12">
          <Link href="/products" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/40 hover:text-orange-300">
            <ArrowLeft size={14} /> Back to catalog
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            {/* Visual Column */}
            <div className="relative">
              <ProductVisual product={{ ...product, imageUrl: productPhotos[activePhoto] }} large />
              {productPhotos.length > 1 && (
                <div className="mt-3 grid grid-cols-4 gap-3" aria-label="Product photos">
                  {productPhotos.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      onClick={() => setActivePhoto(index)}
                      aria-label={`Show product photo ${index + 1}`}
                      aria-pressed={activePhoto === index}
                      className={`aspect-square overflow-hidden rounded-md border transition-colors ${activePhoto === index ? "border-orange-400 ring-1 ring-orange-400/50" : "border-white/15 hover:border-white/40"}`}
                    >
                      <img src={photo} alt={`${product.name} view ${index + 1}`} className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <div className="product-art-badge">
                <span className="pulse-dot" /> SKU / {product.sku}
              </div>
              <div className="product-art-stamp">
                <Cpu size={16} />
                <span>BENCH<br />TESTED<br />OEM</span>
              </div>
            </div>

            {/* Details Column */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <p className="eyebrow text-orange-300">{product.category}</p>
                  {/* Stock Availability Badge */}
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-red-300">
                      <span className="size-1.5 rounded-full bg-red-400" /> Out of stock
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-amber-300">
                      <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" /> Limited availability
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-300">
                      <span className="size-1.5 rounded-full bg-emerald-400" /> In stock
                    </span>
                  )}
                </div>

                <h1 className="mt-3 font-display text-4xl leading-[1.0] tracking-[-0.04em] text-white md:text-5xl lg:text-6xl">
                  {product.name}
                </h1>

                <p className="mt-5 text-base leading-7 text-white/60">
                  {product.description || product.shortDescription}
                </p>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Purchase Card */}
              <div className="purchase-card mt-8 rounded-lg border border-orange-400/25 bg-[#121517] p-6 shadow-xl">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Unit Price</p>
                    <p className="mt-1 font-mono text-3xl font-semibold tracking-[-0.04em] text-orange-300">
                      {formatINR(product.price)}
                    </p>
                  </div>
                  {quantity > 1 && (
                    <div className="text-right">
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Total ({quantity} units)</p>
                      <p className="mt-1 font-mono text-xl font-bold text-white">
                        {formatINR(product.price * quantity)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quantity Selector + Add Actions */}
                <div className="mt-6 grid gap-4 sm:grid-cols-[130px_1fr]">
                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between rounded-md border border-white/15 bg-[#0a0c0e] px-3 py-2">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="text-white/60 hover:text-orange-400 disabled:opacity-20"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="font-mono text-sm font-semibold text-white">{quantity}</span>
                    <button
                      type="button"
                      disabled={isOutOfStock || (product.stock !== undefined && quantity >= product.stock)}
                      onClick={() => setQuantity((q) => Math.min(product.stock ?? q + 1, q + 1))}
                      className="text-white/60 hover:text-orange-400 disabled:opacity-20"
                      aria-label="Increase quantity"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    onClick={addProductToCart}
                    disabled={isOutOfStock}
                    className="h-12 w-full rounded-md bg-[#ff6417] px-5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-black hover:bg-orange-400 disabled:opacity-40"
                  >
                    {cartQuantity > 0 ? (
                      <><Check size={16} /> In cart ({cartQuantity}) · Add another</>
                    ) : added ? (
                      <>
                        <Check size={16} /> Added to cart
                      </>
                    ) : (
                      <>
                        <Plus size={16} /> Add to cart
                      </>
                    )}
                  </Button>
                </div>

                {/* Direct WhatsApp Action */}
                <div className="mt-3">
                    <a
                    href={whatsappLink(directOrderMessage, settings.whatsappNumber)}
                      onClick={() => trackEvent.mutate({ event: "whatsapp_click", productId: product.id, path: `/products/${product.id}` })}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/[0.04] px-5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white hover:border-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <MessageCircle size={15} className="text-emerald-400" /> Order via WhatsApp Direct
                  </a>
                </div>

                <p className="mt-4 flex items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">
                  <ShieldCheck size={13} className="text-orange-300" /> WhatsApp checkout with order reference ID & instant support
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Badges */}
      <section className="container grid gap-5 border-b border-white/10 py-6 sm:grid-cols-3">
        {[
          [Zap, "Engineered Ready", "Tested and verified pinouts and signals"],
          [Layers3, "Build Integration", "Standard logic levels & modular footprints"],
          [MessageCircle, "Direct Engineer Chat", "Ask questions before you wire"],
        ].map(([Icon, title, body]) => (
          <div key={title as string} className="flex gap-3 border-white/10 sm:border-r sm:pr-5 last:border-0">
            <Icon size={18} className="mt-0.5 text-orange-300 shrink-0" />
            <div>
              <p className="font-display text-base text-white">{title as string}</p>
              <p className="mt-1 text-xs leading-5 text-white/40">{body as string}</p>
            </div>
          </div>
        ))}
      </section>

      {/* FREQUENTLY BOUGHT TOGETHER / BUY THIS WITH THIS (Recommendation Engine) */}
      {related.length > 0 && (
        <section className="container py-14 md:py-20 border-b border-white/10">
          <div className="rounded-xl border border-orange-500/20 bg-[#111417] p-6 md:p-10 shadow-2xl">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end border-b border-white/10 pb-6">
              <div>
                <p className="eyebrow text-orange-300 flex items-center gap-2">
                  <Sparkles size={14} /> Frequently Bought Together
                </p>
                <h2 className="mt-2 font-display text-3xl md:text-4xl text-white">
                  Buy this with this<span className="text-orange-400">.</span>
                </h2>
                <p className="mt-2 text-sm text-white/50">
                  Engineers frequently pair {product.name} with these matching modules and sensors.
                </p>
              </div>

              {/* Bundle Action */}
              <div className="flex items-center gap-4 bg-[#0a0c0e] px-5 py-3 rounded-lg border border-white/10">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Bundle Total</p>
                  <p className="font-mono text-2xl font-bold text-orange-300">{formatINR(bundleTotalPrice)}</p>
                </div>
                <Button
                  onClick={addBundleToCart}
                  className="rounded-md bg-[#ff6417] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black hover:bg-orange-300"
                >
                  <Plus size={14} /> Add Bundle to Cart
                </Button>
              </div>
            </div>

            {/* Bundle Items Cards */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {/* Primary Item */}
              <div className="rounded-lg border border-orange-500/40 bg-white/[0.03] p-4 flex flex-col justify-between">
                <div>
                  <span className="rounded bg-orange-500/20 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-orange-300">
                    This item
                  </span>
                  <h3 className="mt-2 font-display text-lg text-white">{product.name}</h3>
                  <p className="font-mono text-xs text-white/40">{product.sku}</p>
                </div>
                <p className="mt-4 font-mono text-lg font-semibold text-orange-300">{formatINR(product.price)}</p>
              </div>

              {/* Related Items with Checkboxes */}
              {related.slice(0, 2).map((item) => {
                const isSelected = selectedBundleSlugs.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleBundleItem(item.id)}
                    className={`cursor-pointer rounded-lg border p-4 transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-orange-500/40 bg-white/[0.03]"
                        : "border-white/10 bg-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-400">
                          Recommended pair
                        </span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="size-4 accent-orange-500 cursor-pointer"
                        />
                      </div>
                      <h3 className="mt-2 font-display text-lg text-white">{item.name}</h3>
                      <p className="font-mono text-xs text-white/40">{item.sku}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="font-mono text-lg font-semibold text-orange-300">{formatINR(item.price)}</p>
                      <span className="font-mono text-[9px] uppercase text-white/40">
                        {isSelected ? "Selected" : "Click to add"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Technical Specs Readout */}
      {product.specs && product.specs.length > 0 && (
        <section className="container grid gap-14 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="eyebrow text-orange-300">Technical readout</p>
            <h2 className="mt-3 font-display text-4xl tracking-[-0.04em] text-white md:text-5xl">
              Know the signal<br />
              <span className="text-white/30">before you wire it.</span>
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/50">
              {product.shortDescription} Use the quick readout below as a starting point, then ask our team on WhatsApp if your build has specific voltage or pinout constraints.
            </p>

            <div className="mt-9 overflow-hidden rounded-lg border border-white/10">
              {product.specs.map((spec, index) => (
                <button
                  type="button"
                  key={spec.label}
                  onClick={() => setActiveSpec(index)}
                  className={`grid w-full grid-cols-[1fr_1fr_auto] items-center gap-4 border-b border-white/[0.08] px-5 py-4 text-left last:border-0 transition-colors ${
                    activeSpec === index ? "bg-orange-500/[0.08]" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-white/35">
                    0{index + 1} / {spec.label}
                  </span>
                  <span className="text-sm font-medium text-white/80">{spec.value}</span>
                  <ChevronRight size={15} className={activeSpec === index ? "text-orange-300" : "text-white/20"} />
                </button>
              ))}
            </div>
          </div>

          <div className="detail-note-panel rounded-lg border border-white/10 bg-[#101315] p-8">
            <div className="flex items-center justify-between">
              <span className="eyebrow text-orange-300">Build note / 0{activeSpec + 1}</span>
              <Sparkles size={17} className="text-orange-300" />
            </div>
            <p className="mt-8 font-display text-3xl leading-tight text-white">
              {product.specs[activeSpec]?.value || product.name}
            </p>
            <p className="mt-4 text-sm leading-6 text-white/45">
              Spec parameter: <strong className="text-white/80">{product.specs[activeSpec]?.label}</strong>. Pair this with the proper decoupling capacitor, pull-up resistors, and power rail specifications.
            </p>
            <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
              <span className="size-2 rounded-full bg-orange-400" /> {product.category} / Verified specification
            </div>
          </div>
        </section>
      )}

      {/* Admin Curated Combo Kit Feature */}
      {relatedKits.length > 0 && (
        <section className="container py-12 md:py-16">
          <div className="combo-feature rounded-xl border border-orange-400/30 bg-[#14110e] p-8 md:p-12">
            <div>
              <p className="eyebrow text-orange-300">Admin-Curated Kit</p>
              <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight text-white md:text-5xl">
                Start with the<br />
                <span className="text-orange-300">{relatedKits[0].name}.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">
                {relatedKits[0].tagline}. {relatedKits[0].description}
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {relatedKits[0].items.map((item) => (
                  <span key={item.productSlug} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/70">
                    {item.quantity} × {sourceProducts.find((p) => p.id === item.productSlug)?.name || item.productSlug}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <p className="font-mono text-3xl font-bold text-orange-300">{formatINR(relatedKits[0].price)}</p>
                <button
                  type="button"
                  onClick={() => addKit(relatedKits[0])}
                  className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black hover:bg-orange-400"
                >
                  Add kit components <Plus size={14} />
                </button>
              </div>
            </div>
            <div className="combo-mark">
              <ShoppingBag size={34} />
              <span>kit / {relatedKits[0].items.length} items</span>
            </div>
          </div>
        </section>
      )}

      {/* More Catalog Recommendations Grid */}
      <section className="border-t border-white/10 bg-[#0d1012] py-16 md:py-24">
        <div className="container">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow text-orange-300">Complementary Components</p>
              <h2 className="mt-3 font-display text-4xl text-white md:text-5xl">
                More for your workbench<span className="text-orange-300">.</span>
              </h2>
            </div>
            <Link href="/products" className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300 hover:text-white">
              See all components <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item, index) => (
              <div key={item.id} className="relative">
                <span className="recommendation-label">
                  {index === 0 ? "best match" : index === 1 ? "common pairing" : "useful next step"}
                </span>
                <ProductCard product={item} onAdd={cart.add} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
