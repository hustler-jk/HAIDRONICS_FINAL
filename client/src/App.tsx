import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocation, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import SiteShell, { useCart } from "./components/SiteShell";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Support from "./pages/Support";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

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
    <Route path="/404"><NotFound /></Route>
    <Route><NotFound /></Route>
  </Switch>;
}

function AppContent() {
  const cart = useCart();
  const [location] = useLocation();
  if (location.startsWith("/admin")) return <Admin />;
  return <SiteShell cart={cart}><StoreRouter cart={cart} /></SiteShell>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><AppContent /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
