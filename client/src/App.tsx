import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocation, Route, Switch } from "wouter";
import { lazy, Suspense, useEffect, useState } from "react";
import { logoIconImage } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import SiteShell, { useCart } from "./components/SiteShell";
const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Support = lazy(() => import("./pages/Support"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Cart = lazy(() => import("./pages/Cart"));
const Account = lazy(() => import("./pages/Account"));
const BusinessInfo = lazy(() => import("./pages/BusinessInfo"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));

function StoreRouter({ cart }: { cart: ReturnType<typeof useCart> }) {
  return <Switch>
    <Route path="/"><Home cart={cart} /></Route>
    <Route path="/products"><Products cart={cart} /></Route>
    <Route path="/products/:id"><ProductDetail cart={cart} /></Route>
    <Route path="/support"><Support /></Route>
    <Route path="/about"><About /></Route>
    <Route path="/contact"><Contact /></Route>
    <Route path="/cart"><Cart cart={cart} /></Route>
    <Route path="/account"><Account /></Route>
    <Route path="/faq"><BusinessInfo /></Route>
    <Route path="/shipping-returns"><BusinessInfo /></Route>
    <Route path="/privacy"><BusinessInfo /></Route>
    <Route path="/terms"><BusinessInfo /></Route>
    <Route path="/404"><NotFound /></Route>
    <Route><NotFound /></Route>
  </Switch>;
}

function AppContent() {
  const cart = useCart();
  const [location] = useLocation();
  const trackEvent = trpc.analytics.track.useMutation();

  useEffect(() => {
    if (location.startsWith("/admin")) return;
    trackEvent.mutate({ event: "page_view", path: location.split("?")[0] });
  }, [location]);

  if (location.startsWith("/admin")) return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#eef0f0] text-sm text-black/50">Loading operations workspace…</div>}><Admin /></Suspense>;
  return <SiteShell cart={cart}><Suspense fallback={<div className="grid min-h-[60vh] place-items-center text-sm text-white/45">Loading page…</div>}><StoreRouter cart={cart} /></Suspense></SiteShell>;
}

function StartupIntro({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(onFinish, 2850);
    return () => window.clearTimeout(timeout);
  }, [onFinish]);

  return (
    <div className="startup-intro" role="status" aria-label="Loading HAIDRONICS">
      <div className="startup-grid" aria-hidden="true" />
      <div className="startup-core" aria-hidden="true">
        <span className="startup-ring startup-ring-outer" />
        <span className="startup-ring startup-ring-inner" />
        <span className="startup-halo" />
        <span className="startup-crosshair startup-crosshair-x" />
        <span className="startup-crosshair startup-crosshair-y" />
        <img src={logoIconImage} alt="" />
      </div>
      <div className="startup-brand" aria-hidden="true">
        <p className="startup-wordmark">HAIDRONICS</p>
        <p className="startup-tagline">WHERE ENGINEERING STARTS</p>
      </div>
      <div className="startup-progress" aria-hidden="true"><span /></div>
      <button type="button" className="startup-skip" onClick={onFinish}>Skip intro</button>
    </div>
  );
}

function App() {
  const [showIntro, setShowIntro] = useState(true);
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <AppContent />
          {showIntro && <StartupIntro onFinish={() => setShowIntro(false)} />}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
