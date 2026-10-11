import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { Product, formatINR } from "@/lib/catalog";
import { Button } from "@/components/ui/button";

export function ProductVisual({ product, large = false }: { product: Product; large?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = product.images?.[0] || product.imageUrl;
  useEffect(() => setImageFailed(false), [imageUrl]);
  const showUploadedImage = Boolean(imageUrl) && !imageFailed;
  return (
    <div className={`product-art ${large ? "product-art-large" : ""}`} data-variant={product.image} style={{ "--accent": product.accent } as React.CSSProperties}>
      {showUploadedImage && <img src={imageUrl} alt={product.name} className="product-uploaded-image" onError={() => setImageFailed(true)} />}
      {!showUploadedImage && <>
      <div className="art-grid" />
      <div className="art-glow" />
      {product.image === "board" && <><div className="chip chip-main">ESP32</div><div className="chip chip-small">WROOM</div><div className="pin-row" /><div className="board-usb">USB</div></>}
      {product.image === "oled" && <><div className="oled-screen"><span>0.96&quot;</span><b>◌</b><i>DISPLAY</i></div><div className="oled-pins" /></>}
      {product.image === "sensor" && <><div className="sensor-cap"><span /></div><div className="sensor-legs"><i /><i /><i /></div><div className="sensor-label">DHT11</div></>}
      {product.image === "uno" && <><div className="uno-board"><div className="uno-chip">ATmega</div><div className="uno-port" /><div className="uno-pinset" /></div><span className="art-caption">UNO R3</span></>}
      {product.image === "ultrasonic" && <><div className="ultra-eye ultra-left" /><div className="ultra-eye ultra-right" /><div className="ultra-body" /></>}
      {product.image === "relay" && <><div className="relay-body"><div /><div /></div><span className="relay-label">RELAY</span></>}
      </>}
      <span className="art-index">01 / {product.category.slice(0, 3).toUpperCase()}</span>
    </div>
  );
}

export function ProductCard({ product, onAdd, compact = false, cartQuantity = 0 }: { product: Product; onAdd: (product: Product) => boolean | void; compact?: boolean; cartQuantity?: number }) {
  const [added, setAdded] = useState(false);
  const unavailable = product.stockStatus === "Out of stock" || product.stock === 0;
  const inCart = cartQuantity > 0 || added;
  const add = () => {
    if (onAdd(product) === false) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };
  return (
    <article className={`product-card group ${compact ? "catalog-product-card" : ""}`}>
      <Link href={`/products/${product.id}`} className="block"><ProductVisual product={product} /></Link>
      <div className="catalog-product-info p-5">
        <div className="catalog-product-heading flex items-start justify-between gap-3"><div className="min-w-0"><p className="catalog-product-category eyebrow text-orange-300/80">{product.category}</p><Link href={`/products/${product.id}`} className="catalog-product-name mt-2 block font-display text-lg leading-tight text-white transition-colors group-hover:text-orange-300">{product.name}</Link></div><p className="catalog-product-price shrink-0 font-mono text-sm font-semibold text-orange-300">{formatINR(product.price)}</p></div>
        <p className="catalog-product-description mt-3 min-h-10 text-sm leading-5 text-white/46">{product.shortDescription}</p>
        <div className="catalog-product-actions mt-5 flex items-center justify-between gap-3"><div><Link href={`/products/${product.id}`} className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/75 hover:text-orange-300">View product <ArrowUpRight size={13} /></Link><p className={`mt-2 font-mono text-[9px] uppercase tracking-[0.12em] ${unavailable ? "text-red-300" : product.stockStatus === "Limited" ? "text-amber-300" : "text-emerald-300"}`}>{unavailable ? "Out of stock" : product.stockStatus || "In stock"}</p></div><Button disabled={unavailable} size="sm" variant="outline" aria-label={inCart ? `${product.name}, ${cartQuantity || 1} in cart. Add one more.` : `Add ${product.name} to cart`} className={`h-8 border-white/15 bg-transparent px-2.5 font-mono text-[9px] uppercase tracking-[0.1em] hover:border-orange-400 hover:bg-orange-500/10 hover:text-orange-300 disabled:opacity-40 ${inCart ? "border-emerald-400/50 text-emerald-300" : "text-white/65"}`} onClick={add}>{inCart ? <><Check size={13} /> In cart{cartQuantity > 1 ? ` · ${cartQuantity}` : ""}</> : <><Plus size={13} /> Cart</>}</Button></div>
      </div>
    </article>
  );
}
