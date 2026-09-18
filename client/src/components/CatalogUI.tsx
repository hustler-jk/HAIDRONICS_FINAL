import { Link } from "wouter";
import { ArrowUpRight, Plus } from "lucide-react";
import { Product, formatINR } from "@/lib/catalog";
import { Button } from "@/components/ui/button";

export function ProductVisual({ product, large = false }: { product: Product; large?: boolean }) {
  return (
    <div className={`product-art ${large ? "product-art-large" : ""}`} data-variant={product.image} style={{ "--accent": product.accent } as React.CSSProperties}>
      <div className="art-grid" />
      <div className="art-glow" />
      {product.image === "board" && <><div className="chip chip-main">ESP32</div><div className="chip chip-small">WROOM</div><div className="pin-row" /><div className="board-usb">USB</div></>}
      {product.image === "oled" && <><div className="oled-screen"><span>0.96&quot;</span><b>◌</b><i>DISPLAY</i></div><div className="oled-pins" /></>}
      {product.image === "sensor" && <><div className="sensor-cap"><span /></div><div className="sensor-legs"><i /><i /><i /></div><div className="sensor-label">DHT11</div></>}
      {product.image === "uno" && <><div className="uno-board"><div className="uno-chip">ATmega</div><div className="uno-port" /><div className="uno-pinset" /></div><span className="art-caption">UNO R3</span></>}
      {product.image === "ultrasonic" && <><div className="ultra-eye ultra-left" /><div className="ultra-eye ultra-right" /><div className="ultra-body" /></>}
      {product.image === "relay" && <><div className="relay-body"><div /><div /></div><span className="relay-label">RELAY</span></>}
      <span className="art-index">01 / {product.category.slice(0, 3).toUpperCase()}</span>
    </div>
  );
}

export function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  return (
    <article className="product-card group">
      <Link href={`/products/${product.id}`} className="block"><ProductVisual product={product} /></Link>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="eyebrow text-orange-300/80">{product.category}</p><Link href={`/products/${product.id}`} className="mt-2 block font-display text-lg leading-tight text-white transition-colors group-hover:text-orange-300">{product.name}</Link></div><p className="font-mono text-sm font-semibold text-orange-300">{formatINR(product.price)}</p></div>
        <p className="mt-3 min-h-10 text-sm leading-5 text-white/46">{product.shortDescription}</p>
        <div className="mt-5 flex items-center justify-between gap-3"><Link href={`/products/${product.id}`} className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/75 hover:text-orange-300">View product <ArrowUpRight size={13} /></Link><Button size="sm" variant="outline" className="h-8 border-white/15 bg-transparent px-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-white/65 hover:border-orange-400 hover:bg-orange-500/10 hover:text-orange-300" onClick={() => onAdd(product)}><Plus size={13} /> Cart</Button></div>
      </div>
    </article>
  );
}
