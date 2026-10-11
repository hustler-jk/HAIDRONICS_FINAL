import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Edit3,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  ShieldCheck,
  Truck,
  User,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { formatINR, logoIconImage, whatsappLink } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useBusinessSettings } from "@/components/SiteShell";

export default function Account() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const settings = useBusinessSettings();
  const [location, navigate] = useLocation();
  const utils = trpc.useUtils();
  const trackEvent = trpc.analytics.track.useMutation();
  const historyQuery = trpc.account.history.useQuery(undefined, { enabled: isAuthenticated, retry: false, refetchInterval: 30_000 });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "google_oauth") {
      toast.error("Google sign-in could not be completed. Please try again.");
      params.delete("error");
      const remainingQuery = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}`);
    }
  }, [location]);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const next = new URLSearchParams(window.location.search).get("next");
    if (next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) navigate(next);
  }, [loading, isAuthenticated, navigate, location]);

  // Auth form state
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);

  // Edit Profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      toast.success("Welcome back!");
      await utils.auth.me.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Login failed");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      setVerificationSent(true);
      toast.success("Verification link sent. Check your email to activate your account.");
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed");
    },
  });

  const verifyEmailMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => { toast.success("Email verified. You can sign in now."); setAuthMode("signin"); setVerificationSent(false); },
    onError: (error) => toast.error(error.message),
  });
  const resendVerificationMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: () => toast.success("If that address has an unverified account, a new link has been sent."),
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("verify");
    if (!token) return;
    params.delete("verify");
    window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
    verifyEmailMutation.mutate({ token });
  }, [location]);

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profile details updated!");
      setIsEditingProfile(false);
      await utils.auth.me.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in required fields");
      return;
    }
    registerMutation.mutate({ name, email, password, phone, address });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: editName || user?.name || undefined,
      phone: editPhone || user?.phone || undefined,
      address: editAddress || user?.address || undefined,
    });
  };

  if (loading) {
    return (
      <div className="container grid min-h-[70vh] place-items-center">
        <Loader2 className="animate-spin text-orange-400 size-8" />
      </div>
    );
  }

  // If Not Authenticated -> Show Customer Login & Registration Portal
  if (!isAuthenticated) {
    return (
      <div className="container customer-portal-wrap py-10 md:py-16">
        <div className="customer-portal-layout">
          <aside className="customer-portal-brand">
            <div className="customer-portal-brand-top">
              <img src={logoIconImage} alt="" aria-hidden="true" />
              <span>HAIDRONICS <i> / </i> CUSTOMER ACCESS</span>
            </div>
            <div className="customer-portal-message">
              <p className="eyebrow text-orange-200/80">Your build starts here</p>
              <h1 className="font-display">Good to have you <span>back.</span></h1>
              <p className="customer-portal-description">
                One account for your component orders, delivery details, and project conversations with the HAIDRONICS team.
              </p>
            </div>
            <div className="customer-portal-points">
              <div><PackageCheck size={17} /><span><b>Track your orders</b><small>Follow every order from request to delivery.</small></span></div>
              <div><MessageCircle size={17} /><span><b>Talk to real engineers</b><small>Get practical help for your next build.</small></span></div>
              <div><ShieldCheck size={17} /><span><b>Your account, protected</b><small>Your profile and order history stay private.</small></span></div>
            </div>
            <div className="customer-portal-circuit" aria-hidden="true">
              <span /><span /><span /><i /><i /><i />
            </div>
            <Link href="/products" className="customer-portal-back">
              Explore components <ArrowRight size={14} />
            </Link>
          </aside>

          <div className="customer-portal-form">
            <div className="customer-portal-form-heading">
              <p className="eyebrow text-orange-300">{authMode === "signin" ? "Customer sign in" : "Join the workshop"}</p>
              <h2 className="font-display">{authMode === "signin" ? "Your HAIDRONICS account" : "Create your account"}</h2>
              <p>{authMode === "signin" ? "Sign in to pick up where your build left off." : "Set up your account to manage orders and project requests."}</p>
            </div>

          {/* Tab Switcher */}
          <div className="customer-portal-tabs mt-7 flex rounded-lg bg-[#0a0c0e] p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setAuthMode("signin")}
              className={`flex-1 rounded-md py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
                authMode === "signin"
                  ? "bg-orange-500 text-black shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className={`flex-1 rounded-md py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
                authMode === "signup"
                  ? "bg-orange-500 text-black shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Sign In Form */}
          {authMode === "signin" ? (
            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  Email Address
                </span>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-md border border-white/15 bg-[#0b0e0f] pl-10 pr-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-orange-400"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  Password
                </span>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-md border border-white/15 bg-[#0b0e0f] pl-10 pr-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-orange-400"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-[#ff6417] py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
              >
                {loginMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                Sign In to Account
              </button>
              <button type="button" onClick={() => email && resendVerificationMutation.mutate({ email })} disabled={!email || resendVerificationMutation.isPending} className="w-full py-2 font-mono text-[9px] uppercase tracking-wider text-white/45 hover:text-orange-300 disabled:opacity-40">Resend email verification</button>
            </form>
          ) : verificationSent ? (
            <div className="mt-6 rounded-lg border border-emerald-500/25 bg-emerald-500/[.08] p-5 text-sm text-white/75">
              <CheckCircle2 className="mb-3 text-emerald-300" size={22} />
              <p className="font-display text-lg text-white">Check your inbox</p>
              <p className="mt-2 leading-6">We sent an activation link to <strong>{email}</strong>. The link expires after 30 minutes.</p>
              <button type="button" onClick={() => resendVerificationMutation.mutate({ email })} disabled={resendVerificationMutation.isPending} className="mt-4 font-mono text-[10px] font-bold uppercase tracking-wider text-orange-300 disabled:opacity-50">Send another link</button>
              <button type="button" onClick={() => { setVerificationSent(false); setAuthMode("signin"); }} className="ml-4 font-mono text-[10px] uppercase tracking-wider text-white/55">Back to sign in</button>
            </div>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignUp} className="mt-6 space-y-3.5">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  Full Name *
                </span>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="h-11 w-full rounded-md border border-white/15 bg-[#0b0e0f] pl-10 pr-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-orange-400"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  Email Address *
                </span>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-md border border-white/15 bg-[#0b0e0f] pl-10 pr-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-orange-400"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  Password *
                </span>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="h-11 w-full rounded-md border border-white/15 bg-[#0b0e0f] pl-10 pr-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-orange-400"
                  />
                </div>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                    Phone / WhatsApp
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="h-11 w-full rounded-md border border-white/15 bg-[#0b0e0f] px-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-orange-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                    City / PIN
                  </span>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="City, State"
                    className="h-11 w-full rounded-md border border-white/15 bg-[#0b0e0f] px-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-orange-400"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-[#ff6417] py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
              >
                {registerMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                Create Customer Account
              </button>
            </form>
          )}

          <div className="customer-portal-google mt-6">
            <button
              type="button"
              onClick={() => startLogin()}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/15 bg-white px-4 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#17191b] transition-colors hover:bg-orange-50"
            >
              <span aria-hidden="true" className="grid size-5 place-items-center rounded-full border border-black/10 font-display text-sm font-bold text-[#4285f4]">G</span>
              Continue with Google
            </button>
            <p className="mt-2 text-center text-[11px] text-white/40">New here? Google will create your customer account securely.</p>
            <div className="mt-5 flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-white/10" /><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">or use email</span><span className="h-px flex-1 bg-white/10" /></div>
          </div>
          <p className="customer-portal-terms">By continuing, you agree to use your account for your HAIDRONICS orders and project enquiries.</p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated View
  const orders = historyQuery.data?.orders || [];
  const projects = historyQuery.data?.projects || [];
  const requests = historyQuery.data?.products || [];

  return (
    <div className="container customer-dashboard py-10 md:py-14 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-orange-300">{user?.role === "admin" ? "HAIDRONICS / ADMIN + CUSTOMER" : "HAIDRONICS / CUSTOMER PORTAL"}</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
            Your workspace<span className="text-orange-400">.</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-md bg-orange-500/20 border border-orange-400/40 px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-orange-300 hover:bg-orange-500/30"
            >
              <ShieldCheck size={14} /> Open Admin Control Room →
            </Link>
          )}
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3.5 py-2 font-mono text-[10px] uppercase text-white/60 hover:text-red-300 hover:border-red-400/40"
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>

      {/* Customer Profile & Default Address */}
      <div className="mt-8 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-white/10 bg-[#111416] p-6 md:p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="grid size-14 place-items-center rounded-full bg-orange-500/15 text-orange-300">
                <User size={26} />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-white">{user?.name || "Customer"}</p>
                <p className="font-mono text-xs text-white/50">{user?.email}</p>
                <span className="mt-2 inline-flex rounded-full border border-orange-400/25 bg-orange-400/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-orange-300">
                  {user?.role === "admin" ? "Administrator" : "Customer"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditName(user?.name || "");
                setEditPhone(user?.phone || "");
                setEditAddress(user?.address || "");
                setIsEditingProfile(!isEditingProfile);
              }}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-orange-300 hover:underline"
            >
              <Edit3 size={13} /> {isEditingProfile ? "Cancel" : "Edit Details"}
            </button>
          </div>

          {/* Profile Details or Edit Form */}
          {!isEditingProfile ? (
            <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm text-white/70">
              <div className="flex items-center gap-3">
                <Phone size={15} className="text-orange-400 shrink-0" />
                <span className="font-mono text-xs">{user?.phone || "No phone number saved yet"}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={15} className="text-orange-400 shrink-0 mt-0.5" />
                <span className="text-xs leading-5">{user?.address || "No delivery address saved yet"}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="mt-6 space-y-3 border-t border-white/10 pt-5">
              <label className="block">
                <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-white/40">Full Name</span>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 w-full rounded border border-white/15 bg-[#0a0c0e] px-3 text-xs text-white outline-none focus:border-orange-400"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-white/40">Phone Number</span>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="h-10 w-full rounded border border-white/15 bg-[#0a0c0e] px-3 text-xs text-white outline-none focus:border-orange-400"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-white/40">Delivery Address</span>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full rounded border border-white/15 bg-[#0a0c0e] p-2.5 text-xs text-white outline-none focus:border-orange-400"
                />
              </label>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="rounded-md bg-[#ff6417] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-black hover:bg-orange-400 disabled:opacity-50"
              >
                Save Shipping Profile
              </button>
            </form>
          )}
        </div>

        {/* Quick Summary Card */}
        <div className="rounded-xl border border-orange-400/25 bg-[#14110e] p-6 md:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <PackageCheck size={26} className="text-orange-300" />
            <p className="mt-4 font-display text-2xl font-bold text-white">Direct Engineering Support</p>
            <p className="mt-2 text-xs leading-6 text-white/60">
              All electronics orders are bench-tested and verified by our team. You can reach out directly on WhatsApp for technical specs or custom component orders.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-md bg-[#ff6417] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black hover:bg-orange-400"
            >
              Browse Catalog <ArrowRight size={13} />
            </Link>
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2.5 font-mono text-[10px] uppercase text-white hover:text-orange-300"
            >
              View Cart
            </Link>
          </div>
        </div>
      </div>

      {/* Orders History Ledger */}
      <section className="mt-12">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="eyebrow text-orange-300">Order History</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-white">Your Component Orders ({orders.length})</h2>
          </div>
        </div>

        {historyQuery.isError && <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-400/20 bg-red-500/5 p-4 text-sm text-red-200"><span>Your order history is temporarily unavailable. Check your connection and try again.</span><button type="button" onClick={() => historyQuery.refetch()} className="rounded border border-red-200/25 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-wider">Try again</button></div>}
        {historyQuery.isLoading && <p className="mt-5 text-sm text-white/45">Loading your order history…</p>}
        <div className="mt-6 space-y-4">
          {orders.length ? (
            orders.map((order) => {
              const statusSteps = [
                { key: "ORDER_REQUESTED", label: "Requested" },
                { key: "PAYMENT_PENDING", label: "Payment Pending" },
                { key: "ORDER_CONFIRMED", label: "Confirmed" },
                { key: "PACKED", label: "Packed" },
                { key: "SHIPPED", label: "Shipped" },
                { key: "DELIVERED", label: "Delivered" },
              ];

              const currentStepIdx = statusSteps.findIndex((s) => s.key === order.status);

              return (
                <div key={order.id} className="rounded-xl border border-white/10 bg-[#111416] p-6 shadow-sm">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-white/10 pb-4">
                    <div>
                      <span className="font-mono text-xs font-bold text-orange-400">
                        {order.orderNumber || `HAI-ORDER-${order.id}`}
                      </span>
                      <p className="mt-0.5 text-xs text-white/50 font-mono">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="font-mono text-xl font-bold text-white">
                        {formatINR(order.finalAmount || order.total)}
                      </p>
                      <a
                        href={whatsappLink(`Hi HAIDRONICS, I have a question about my order ${order.orderNumber}:`, settings.whatsappNumber)}
                        onClick={() => trackEvent.mutate({ event: "whatsapp_click", path: "/account" })}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/20"
                      >
                        <MessageCircle size={13} /> WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* Status Pipeline Progress */}
                  <div className="mt-5">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-white/40 mb-3 font-semibold">
                      Order Status: <span className="text-orange-300">{order.status.replaceAll("_", " ")}</span>
                    </p>
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                      {statusSteps.map((step, idx) => {
                        const isDone = currentStepIdx >= idx;
                        const isCurrent = currentStepIdx === idx;
                        return (
                          <div key={step.key} className="flex items-center gap-1 shrink-0">
                            <span
                              className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase font-bold tracking-wider ${
                                isCurrent
                                  ? "bg-orange-500 text-black"
                                  : isDone
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-white/5 text-white/30"
                              }`}
                            >
                              {step.label}
                            </span>
                            {idx < statusSteps.length - 1 && (
                              <span className={`text-xs ${isDone ? "text-emerald-500" : "text-white/20"}`}>→</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          ) : !historyQuery.isLoading && !historyQuery.isError ? (
            <div className="rounded-xl border border-dashed border-white/15 p-12 text-center text-sm text-white/40">
              You haven't placed any component orders yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
