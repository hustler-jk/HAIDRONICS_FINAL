import { useState } from "react";
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
import { Link } from "wouter";
import { formatINR, logoIconImage, whatsappLink } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Account() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const historyQuery = trpc.account.history.useQuery(undefined, { enabled: isAuthenticated, retry: false });

  // Auth form state
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Edit Profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Welcome back!");
      window.location.reload();
    },
    onError: (err) => {
      toast.error(err.message || "Login failed");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Account created successfully!");
      window.location.reload();
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed");
    },
  });

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
      <div className="container py-16 md:py-24">
        <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[#101315] p-6 sm:p-10 shadow-2xl">
          {/* Logo & Header */}
          <div className="text-center">
            <img src={logoIconImage} alt="HAIDRONICS" className="mx-auto h-14 w-auto object-contain" />
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white">
              Customer Portal
            </h1>
            <p className="mt-1 text-xs text-white/50">
              Sign in to manage your component orders and delivery details.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="mt-8 flex rounded-lg bg-[#0a0c0e] p-1 border border-white/10">
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
            </form>
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

          {/* Social OAuth Fallback */}
          <div className="mt-6 border-t border-white/10 pt-5 text-center">
            <button
              type="button"
              onClick={() => startLogin()}
              className="inline-flex items-center gap-2 text-xs font-mono text-white/60 hover:text-orange-300"
            >
              Or sign in with Google OAuth <ArrowRight size={13} />
            </button>
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
    <div className="container py-12 md:py-18 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-orange-300">Customer Dashboard</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
            My Account<span className="text-orange-400">.</span>
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
                        href={whatsappLink(`Hi HAIDRONICS, I have a question about my order ${order.orderNumber}:`, "918248453861")}
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
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 p-12 text-center text-sm text-white/40">
              You haven't placed any component orders yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
