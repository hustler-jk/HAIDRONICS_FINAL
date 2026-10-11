import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CirclePlus,
  ClipboardList,
  Download,
  Edit2,
  Eye,
  FileBarChart,
  FileText,
  Images,
  Layers3,
  LayoutDashboard,
  Loader2,
  LogIn,
  Megaphone,
  MessageCircle,
  Package,
  Printer,
  ReceiptText,
  RefreshCw,
  ScrollText,
  Search,
  Settings2,
  Tag,
  Trash2,
  TrendingUp,
  UploadCloud,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { defaultProductCategories } from "@shared/productCategories";
import {
  ComboKit,
  formatINR,
  logoIconImage,
  normalizeApiComboKits,
  normalizeApiProducts,
  Product,
  whatsappLink,
} from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

const nav = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["orders", "Orders", ClipboardList],
  ["inventory", "Inventory", Boxes],
  ["products", "Products", Package],
  ["categories", "Categories", Tag],
  ["comboKits", "Combo Kits", Layers3],
  ["comboRequests", "Kit Requests", MessageCircle],
  ["updates", "Store Updates", Megaphone],
  ["customerStories", "Customer Proof", Images],
  ["transactions", "Transactions", ReceiptText],
  ["reports", "Reports & Export", FileBarChart],
  ["audit", "Audit Logs", ScrollText],
  ["requests", "Requests", MessageCircle],
  ["analytics", "Analytics", BarChart3],
  ["settings", "Settings", Settings2],
] as const;

type SettingsForm = {
  businessName: string;
  whatsappNumber: string;
  phone: string;
  email: string;
  address: string;
  businessHours: string;
  mapsUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  shippingFee: number;
};

type CustomerStoryDraft = {
  title: string;
  customerName: string;
  projectType: string;
  caption: string;
  imageUrl?: string;
  image?: { filename: string; contentType: string; base64: string } | null;
};

type CustomerStoryAdmin = {
  id: number;
  title: string;
  customerName?: string | null;
  projectType?: string | null;
  caption?: string | null;
  imageUrl?: string | null;
};

type ProductPhotoContentType = "image/png" | "image/jpeg" | "image/webp";

type ProductDraft = {
  id?: number;
  slug: string;
  name: string;
  sku: string;
  price: string;
  shortDescription: string;
  description: string;
  category: string;
  images: string[];
  photos: { filename: string; contentType: ProductPhotoContentType; base64: string }[];
  stock: string;
  lowStockThreshold: string;
  stockStatus: "In stock" | "Limited" | "Out of stock";
  featured: boolean;
  active: boolean;
  hidden: boolean;
};

function isProductPhotoContentType(type: string): type is ProductPhotoContentType {
  return type === "image/png" || type === "image/jpeg" || type === "image/webp";
}

function suggestSku(category: string, name: string) {
  const categoryCode = category.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "PRT";
  const nameCode = name.replace(/[^a-z0-9]/gi, "").slice(0, 12).toUpperCase() || "NEW";
  return `HD-${categoryCode}-${nameCode}`;
}

export default function Admin() {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <AdminLoading />;
  if (!isAuthenticated) return <AdminGate />;
  if (user?.role !== "admin") return <AdminDenied />;
  return <AdminWorkspace />;
}

function AdminWorkspace() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [section, setSection] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showAddCombo, setShowAddCombo] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<any | null>(null);

  const [newProduct, setNewProduct] = useState<ProductDraft>({
    slug: "",
    name: "",
    sku: "",
    price: "",
    shortDescription: "",
    description: "",
    category: "Development boards",
    stock: "20",
    lowStockThreshold: "5",
    stockStatus: "In stock",
    featured: false,
    active: true,
    hidden: false,
    images: [],
    photos: [],
  });
  const createCategoryMutation = trpc.admin.categories.create.useMutation({
    onSuccess: async () => {
      setCategoryName("");
      toast.success("Product category added.");
      await utils.admin.categories.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteCategoryMutation = trpc.admin.categories.delete.useMutation({
    onSuccess: async () => {
      toast.success("Product category deleted.");
      await utils.admin.categories.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const [editingProduct, setEditingProduct] = useState<ProductDraft | null>(null);
  const [newCombo, setNewCombo] = useState({
    name: "",
    tagline: "",
    description: "",
    price: "",
    productSlugs: [] as string[],
  });

  const [newStory, setNewStory] = useState<CustomerStoryDraft>({
    title: "",
    customerName: "",
    projectType: "",
    caption: "",
    image: null,
  });
  const [newUpdate, setNewUpdate] = useState({
    kind: "announcement" as "instagram" | "youtube" | "announcement",
    title: "",
    body: "",
    url: "",
    imageUrl: "",
  });

  const [restockDraft, setRestockDraft] = useState<Record<string, string>>({});
  const [inventoryValues, setInventoryValues] = useState<Record<string, { stock: string; threshold: string }>>({});
  const [uploadingProductPhotos, setUploadingProductPhotos] = useState(false);
  const [settings, setSettings] = useState<SettingsForm>({
    businessName: "HAIDRONICS",
    whatsappNumber: "918248453861",
    phone: "",
    email: "",
    address: "",
    businessHours: "",
    mapsUrl: "",
    instagramUrl: "https://www.instagram.com/haidronics",
    youtubeUrl: "https://www.youtube.com/@haidenlabs",
    shippingFee: 50,
  });

  const utils = trpc.useUtils();
  const productsQuery = trpc.admin.products.list.useQuery(undefined, { retry: false, refetchInterval: 30_000 });
  const categoriesQuery = trpc.admin.categories.list.useQuery(undefined, { enabled: section === "categories" || section === "products" || showAdd || !!editingProduct, retry: false });
  const requestsQuery = trpc.admin.requests.list.useQuery(undefined, { enabled: section === "requests", retry: false });
  const analyticsQuery = trpc.admin.analytics.list.useQuery(undefined, { enabled: section === "analytics", retry: false });
  const comboQuery = trpc.admin.comboKits.list.useQuery(undefined, { enabled: section === "comboKits", retry: false });
  const comboRequestsQuery = trpc.admin.comboRequests.list.useQuery(undefined, { enabled: section === "comboRequests", retry: false });
  const storiesQuery = trpc.admin.customerStories.list.useQuery(undefined, { enabled: section === "customerStories", retry: false });
  const updatesQuery = trpc.admin.updates.list.useQuery(undefined, { enabled: section === "updates", retry: false });
  const ordersQuery = trpc.admin.orders.list.useQuery(undefined, { enabled: section === "orders" || section === "reports", retry: false });
  const inventoryQuery = trpc.admin.inventory.movements.useQuery(undefined, { enabled: section === "inventory" || section === "reports", retry: false });
  const transactionsQuery = trpc.admin.transactions.list.useQuery(undefined, { enabled: section === "transactions" || section === "reports", retry: false });
  const auditQuery = trpc.admin.audit.list.useQuery(undefined, { enabled: section === "audit", retry: false });
  const metricsQuery = trpc.admin.reports.metrics.useQuery(undefined, { retry: false });

  const createMutation = trpc.admin.products.create.useMutation({
    onSuccess: async () => {
      setShowAdd(false);
      toast.success("Product created in catalog!");
      await Promise.all([
        utils.admin.products.list.invalidate(),
        utils.admin.categories.list.invalidate(),
        utils.admin.inventory.movements.invalidate(),
        utils.admin.reports.metrics.invalidate(),
        utils.admin.audit.list.invalidate(),
        utils.catalog.list.invalidate(),
        utils.catalog.search.invalidate(),
        utils.catalog.get.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.admin.products.update.useMutation({
    onSuccess: async () => {
      setEditingProduct(null);
      toast.success("Product updated!");
      await Promise.all([
        utils.admin.products.list.invalidate(),
        utils.admin.categories.list.invalidate(),
        utils.admin.inventory.movements.invalidate(),
        utils.admin.reports.metrics.invalidate(),
        utils.admin.audit.list.invalidate(),
        utils.catalog.list.invalidate(),
        utils.catalog.search.invalidate(),
        utils.catalog.get.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const uploadMutation = trpc.admin.products.uploadImage.useMutation();
  const hideMutation = trpc.admin.products.hide.useMutation({
    onSuccess: async () => {
      toast.success("Product hidden from storefront.");
      await Promise.all([
        utils.admin.products.list.invalidate(),
        utils.catalog.list.invalidate(),
        utils.catalog.search.invalidate(),
        utils.catalog.get.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const createComboMutation = trpc.admin.comboKits.create.useMutation({
    onSuccess: async () => {
      setShowAddCombo(false);
      toast.success("Combo kit published!");
      await Promise.all([utils.admin.comboKits.list.invalidate(), utils.catalog.comboKits.invalidate()]);
    },
  });

  const hideComboMutation = trpc.admin.comboKits.hide.useMutation({
    onSuccess: async () => {
      toast.success("Combo kit removed.");
      await Promise.all([utils.admin.comboKits.list.invalidate(), utils.catalog.comboKits.invalidate()]);
    },
  });
  const approveComboRequestMutation = trpc.admin.comboRequests.approve.useMutation({
    onSuccess: async (order) => {
      toast.success(`Order ${order.orderNumber} created. Move it to payment pending when ready.`);
      await Promise.all([utils.admin.comboRequests.list.invalidate(), utils.admin.orders.list.invalidate(), utils.admin.audit.list.invalidate()]);
    },
    onError: (error) => toast.error(error.message),
  });

  const createStoryMutation = trpc.admin.customerStories.create.useMutation({
    onSuccess: async () => {
      setShowAddCombo(false);
      setNewStory({ title: "", customerName: "", projectType: "", caption: "", image: null });
      toast.success("Customer story added!");
      await Promise.all([utils.admin.customerStories.invalidate(), utils.catalog.customerStories.invalidate()]);
    },
  });

  const hideStoryMutation = trpc.admin.customerStories.hide.useMutation({
    onSuccess: async () => Promise.all([utils.admin.customerStories.invalidate(), utils.catalog.customerStories.invalidate()]),
  });
  const createUpdateMutation = trpc.admin.updates.create.useMutation({
    onSuccess: async () => {
      setNewUpdate({ kind: "announcement", title: "", body: "", url: "", imageUrl: "" });
      toast.success("Store update published.");
      await Promise.all([utils.admin.updates.list.invalidate(), utils.catalog.updates.invalidate()]);
    },
    onError: error => toast.error(error.message),
  });
  const hideUpdateMutation = trpc.admin.updates.hide.useMutation({
    onSuccess: async () => {
      toast.success("Store update hidden.");
      await Promise.all([utils.admin.updates.list.invalidate(), utils.catalog.updates.invalidate()]);
    },
    onError: error => toast.error(error.message),
  });

  const verifyPaymentMutation = trpc.admin.orders.verifyPayment.useMutation({
    onSuccess: async (res) => {
      toast.success(`Payment verified for order ${res.orderNumber}; invoice ${res.invoiceId} created and stock deducted.`);
      if (res.invoiceEmail.sent) {
        toast.success(`Invoice emailed to ${res.invoiceEmail.recipient}.`);
      } else {
        toast.error(`Payment is verified, but invoice email failed: ${res.invoiceEmail.error}`);
      }
      await Promise.all([
        utils.admin.orders.list.invalidate(),
        utils.admin.reports.metrics.invalidate(),
        utils.admin.inventory.movements.invalidate(),
        utils.admin.transactions.list.invalidate(),
        utils.admin.audit.list.invalidate(),
      ]);
    },
    onError: (err) => toast.error(`Verification error: ${err.message}`),
  });

  const sendInvoiceEmailMutation = trpc.admin.orders.sendInvoiceEmail.useMutation({
    onSuccess: async (res) => {
      if (res.sent) toast.success(`Invoice emailed to ${res.recipient}.`);
      else toast.error(`Invoice email failed: ${res.error}`);
      await Promise.all([utils.admin.orders.list.invalidate(), utils.admin.audit.list.invalidate()]);
    },
    onError: (error) => toast.error(`Invoice email error: ${error.message}`),
  });

  const rejectPaymentMutation = trpc.admin.orders.rejectPayment.useMutation({
    onSuccess: async () => {
      toast.info("Order payment marked rejected.");
      await Promise.all([
        utils.admin.orders.list.invalidate(),
        utils.admin.reports.metrics.invalidate(),
        utils.admin.audit.list.invalidate(),
      ]);
    },
  });

  const transitionOrderMutation = trpc.admin.orders.transition.useMutation({
    onSuccess: async (res) => {
      toast.success(`Order moved to ${res.status}`);
      await Promise.all([utils.admin.orders.list.invalidate(), utils.admin.audit.list.invalidate()]);
    },
    onError: (err) => toast.error(err.message),
  });

  const overrideAmountMutation = trpc.admin.orders.overrideAmount.useMutation({
    onSuccess: async (res) => {
      toast.success(`Order amount updated to ${formatINR(res.finalAmount)}`);
      await Promise.all([utils.admin.orders.list.invalidate(), utils.admin.audit.list.invalidate()]);
    },
  });

  const generateInvoiceMutation = trpc.admin.orders.generateInvoice.useMutation({
    onSuccess: async (res) => {
      toast.success(`Invoice ${res.invoiceId} ready!`);
      setActiveInvoiceOrder({ ...res.order, items: res.items });
      await utils.admin.orders.list.invalidate();
    },
  });

  const restockMutation = trpc.admin.inventory.restock.useMutation({
    onSuccess: async () => {
      setRestockDraft({});
      toast.success("Stock updated successfully!");
      await Promise.all([
        utils.admin.products.list.invalidate(),
        utils.admin.inventory.movements.invalidate(),
        utils.admin.reports.metrics.invalidate(),
        utils.admin.audit.list.invalidate(),
        utils.catalog.list.invalidate(),
        utils.catalog.search.invalidate(),
      ]);
    },
  });
  const saveInventoryMutation = trpc.admin.products.update.useMutation({
    onSuccess: async () => {
      toast.success("Inventory settings saved.");
      await Promise.all([utils.admin.products.list.invalidate(), utils.admin.inventory.movements.invalidate(), utils.admin.audit.list.invalidate(), utils.catalog.list.invalidate(), utils.catalog.search.invalidate(), utils.admin.reports.metrics.invalidate()]);
    },
    onError: (error) => toast.error(error.message),
  });

  const settingsQuery = trpc.catalog.settings.useQuery();
  const saveSettingsMutation = trpc.admin.settings.save.useMutation({
    onSuccess: async () => {
      toast.success("Business settings saved!");
      await utils.catalog.settings.invalidate();
    },
  });

  useEffect(() => {
    const data = settingsQuery.data as Partial<SettingsForm> | undefined;
    if (data) {
      setSettings((current) => ({
        ...current,
        ...data,
        instagramUrl: data.instagramUrl || current.instagramUrl,
        youtubeUrl: data.youtubeUrl || current.youtubeUrl,
      }));
    }
  }, [settingsQuery.data]);

  const liveProducts = normalizeApiProducts(productsQuery.data as Array<Record<string, unknown>> | undefined);
  const catalogProducts = liveProducts.filter((product) => !hiddenIds.includes(product.id));
  const productCategoryNames = categoriesQuery.data
    ? categoriesQuery.data.map((category) => category.name)
    : [...defaultProductCategories];
  const comboKits = normalizeApiComboKits(comboQuery.data as Array<Record<string, unknown>> | undefined);

  const filtered = useMemo(
    () =>
      catalogProducts.filter((product) =>
        `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(search.toLowerCase())
      ),
    [catalogProducts, search]
  );

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      toast.error("Please provide a name and price.");
      return;
    }
    const slug = newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    try {
      setUploadingProductPhotos(true);
      const images = await uploadProductPhotos([], newProduct.photos);
      createMutation.mutate({
        slug,
        name: newProduct.name,
        sku: newProduct.sku || suggestSku(newProduct.category, newProduct.name),
        price: Number(newProduct.price),
        shortDescription: newProduct.shortDescription || "New catalog component.",
        description: newProduct.description || undefined,
        category: newProduct.category,
        tags: "",
        specs: "[]",
        images,
        imageUrl: images[0] ?? null,
        stockStatus: newProduct.stockStatus,
        stock: Number(newProduct.stock),
        lowStockThreshold: Number(newProduct.lowStockThreshold),
        featured: newProduct.featured ? 1 : 0,
        active: newProduct.active ? 1 : 0,
        hidden: newProduct.hidden ? 1 : 0,
      });
    } catch (error) {
      toast.error(`Could not upload product photo: ${error instanceof Error ? error.message : "Unknown upload error"}`);
    } finally {
      setUploadingProductPhotos(false);
    }
  };

  const editProduct = async (draft: ProductDraft) => {
    if (!draft.id) return;
    try {
      setUploadingProductPhotos(true);
      const images = await uploadProductPhotos(draft.images, draft.photos);
      updateMutation.mutate({
        id: draft.id,
        slug: draft.slug,
        name: draft.name,
        sku: draft.sku || undefined,
        price: Number(draft.price),
        shortDescription: draft.shortDescription,
        description: draft.description,
        category: draft.category,
        images,
        imageUrl: images[0] ?? null,
        stockStatus: draft.stockStatus,
        stock: Number(draft.stock),
        lowStockThreshold: Number(draft.lowStockThreshold),
        featured: draft.featured ? 1 : 0,
        active: draft.active ? 1 : 0,
        hidden: draft.hidden ? 1 : 0,
      });
    } catch (error) {
      toast.error(`Could not upload product photo: ${error instanceof Error ? error.message : "Unknown upload error"}`);
    } finally {
      setUploadingProductPhotos(false);
    }
  };

  const uploadProductPhotos = async (
    existing: string[],
    pending: ProductDraft["photos"]
  ) => {
    const urls = [...existing];
    for (const photo of pending) {
      const result = await uploadMutation.mutateAsync({
        ...photo,
      });
      urls.push(result.url);
    }
    return urls;
  };

  const hideProduct = (product: Product) => {
    if (product.dbId) hideMutation.mutate({ id: product.dbId });
    else setHiddenIds((current) => [...current, product.id]);
  };

  const createCombo = () => {
    if (!newCombo.name || !newCombo.price || newCombo.productSlugs.length === 0) {
      toast.error("Please provide combo name, price, and select at least 1 product.");
      return;
    }
    const slug = newCombo.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    createComboMutation.mutate({
      slug,
      name: newCombo.name,
      tagline: newCombo.tagline,
      description: newCombo.description,
      price: Number(newCombo.price),
      featured: 1,
      items: newCombo.productSlugs.map((productSlug) => ({ productSlug, quantity: 1 })),
    });
  };

  const restock = (product: Product) => {
    if (!product.dbId) {
      toast.error("This product must be saved in database first to record restock movements.");
      return;
    }
    const amount = Number(restockDraft[String(product.dbId)] || 0);
    if (amount > 0) restockMutation.mutate({ productId: product.dbId, amount });
  };

  const requestCount = (requestsQuery.data?.projects?.length || 0) + (requestsQuery.data?.products?.length || 0);

  return (
    <div className="min-h-screen bg-[#eef0f0] text-[#141718]">
      <div className="flex min-h-screen">
        {/* Admin Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col bg-[#0b0e0f] px-5 py-6 text-white lg:flex">
          <div className="flex items-center gap-3 border-b border-white/10 pb-6">
            <img src={logoIconImage} alt="HAIDRONICS" className="size-10 rounded-lg object-contain bg-[#111416] p-1" />
            <div>
              <p className="font-display text-base font-bold tracking-[0.16em] text-white">HAIDRONICS</p>
              <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-orange-400 font-semibold">Operations Workspace</p>
            </div>
          </div>

          <nav className="mt-6 grid gap-1">
            {nav.map(([id, label, Icon]) => (
              <button
                type="button"
                key={id}
                onClick={() => setSection(id)}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  section === id ? "bg-orange-500 text-black font-semibold" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {label}
                {id === "requests" && requestCount > 0 && (
                  <span className="ml-auto rounded-full bg-orange-400/20 px-2 py-0.5 font-mono text-[9px] text-orange-300">
                    {requestCount}
                  </span>
                )}
                <ChevronRight size={13} className="ml-auto opacity-40" />
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">HAIDRONICS Cloud V1</p>
            <p className="mt-1 text-[11px] leading-4 text-white/50">Stock, orders & invoicing integration.</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="min-w-0 flex-1">
          <header className="flex h-[74px] items-center justify-between border-b border-black/10 bg-white px-5 md:px-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/40">HAIDRONICS / Workspace</p>
              <h1 className="mt-1 font-display text-xl font-bold">{nav.find(([id]) => id === section)?.[1]}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-right sm:block">
                <span className="block text-xs font-semibold">{user?.name || "Administrator"}</span>
                <span className="block text-[10px] text-black/45">{user?.email}</span>
              </span>
              <Link
                href="/account"
                aria-label="My account"
                className="inline-flex items-center gap-2 rounded-md border border-black/15 bg-black/5 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white transition-colors md:px-3.5"
              >
                <UserRound size={14} /> <span className="hidden md:inline">My Account</span>
              </Link>
              <button
                type="button"
                onClick={async () => { await logout(); navigate("/account"); }}
                className="rounded-md border border-black/15 px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black/60 hover:border-red-300 hover:text-red-600 transition-colors"
              >
                Exit
              </button>
              <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-700 sm:flex border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Admin Role Active
              </span>
              <a
                href="/"
                className="rounded-md border border-black/15 bg-black/5 px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white transition-colors"
              >
                Store
              </a>
            </div>
          </header>

          {/* Mobile Tab Scroll */}
          <div className="border-b border-black/10 bg-white px-4 py-2.5 lg:hidden overflow-x-auto">
            <div className="flex gap-2">
              {nav.map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setSection(id)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
                    section === id ? "bg-orange-500 text-black font-bold" : "bg-black/5 text-black/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <main className="p-5 md:p-8">
            {(productsQuery.error || ((section === "orders" || section === "reports") && ordersQuery.error) || ((section === "categories" || section === "products") && categoriesQuery.error)) && <div role="alert" className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">Some admin data could not be loaded from the database. This usually means the deployed database is missing one or more migrations. Apply the checked-in migrations, then reload this page.</div>}
            {section === "dashboard" && (
              <Dashboard
                setSection={setSection}
                productCount={catalogProducts.length}
                requestCount={requestCount}
                metrics={metricsQuery.data}
                orders={(ordersQuery.data || []) as any[]}
                products={catalogProducts}
                onVerify={(id, reference) => verifyPaymentMutation.mutate({ id, reference })}
                onTransition={(id, status) => transitionOrderMutation.mutate({ id, status })}
                onViewInvoice={(order) => setActiveInvoiceOrder(order)}
                onOpenAddProduct={() => setShowAdd(true)}
                onOpenAddCombo={() => setShowAddCombo(true)}
                onRestock={restock}
                restockDraft={restockDraft}
                setRestockDraft={setRestockDraft}
              />
            )}

            {section === "orders" && (
              <OrdersAdmin
                orders={(ordersQuery.data || []) as any[]}
                onVerify={(id, reference) => verifyPaymentMutation.mutate({ id, reference })}
                onReject={(id) => rejectPaymentMutation.mutate({ id })}
                onTransition={(id, status) => transitionOrderMutation.mutate({ id, status })}
                onOverrideAmount={(id, finalAmount, reason) => overrideAmountMutation.mutate({ id, finalAmount, reason })}
                onGenerateInvoice={(id) => generateInvoiceMutation.mutate({ id })}
                onSendInvoiceEmail={(id) => sendInvoiceEmailMutation.mutate({ id })}
                onViewInvoice={(order) => setActiveInvoiceOrder(order)}
                busy={
                  verifyPaymentMutation.isPending ||
                  rejectPaymentMutation.isPending ||
                  transitionOrderMutation.isPending ||
                  overrideAmountMutation.isPending ||
                  generateInvoiceMutation.isPending ||
                  sendInvoiceEmailMutation.isPending
                }
              />
            )}

            {section === "inventory" && (
              <InventoryAdmin
                products={catalogProducts}
                movements={(inventoryQuery.data || []) as any[]}
                restockDraft={restockDraft}
                inventoryValues={inventoryValues}
                setInventoryValues={setInventoryValues}
                setRestockDraft={setRestockDraft}
                onRestock={restock}
                onSaveInventory={(product, stock, threshold) => saveInventoryMutation.mutate({ id: product.dbId!, stock, lowStockThreshold: threshold, stockStatus: stock <= 0 ? "Out of stock" : "In stock" })}
                busy={restockMutation.isPending || saveInventoryMutation.isPending}
              />
            )}

            {section === "products" && (
              <ProductsAdmin
                products={filtered}
                search={search}
                setSearch={setSearch}
                onAdd={() => setShowAdd(true)}
                onEdit={(product) =>
                  setEditingProduct({
                    id: product.dbId,
                    slug: product.id,
                    name: product.name,
                    sku: product.sku,
                    price: String(product.price),
                    shortDescription: product.shortDescription,
                    description: product.description,
                    category: product.category,
                    images: product.images?.length ? product.images : (product.imageUrl ? [product.imageUrl] : []),
                    photos: [],
                    stock: String(product.stock || 0),
                    lowStockThreshold: String(product.lowStockThreshold ?? 5),
                    stockStatus: (product.stockStatus as ProductDraft["stockStatus"]) || "In stock",
                    featured: Boolean(product.featured),
                    active: product.active !== false,
                    hidden: product.hidden === true,
                  })
                }
                onDelete={hideProduct}
              />
            )}

            {section === "categories" && (
              <CategoriesAdmin
                categories={productCategoryNames.map((name) => ({
                  id: categoriesQuery.data?.find((category) => category.name === name)?.id,
                  name,
                  productCount: categoriesQuery.data?.find((category) => category.name === name)?.productCount ?? 0,
                }))}
                newCategory={categoryName}
                setNewCategory={setCategoryName}
                onAdd={() => {
                  const name = categoryName.trim();
                  if (!name) {
                    toast.error("Enter a category name.");
                    return;
                  }
                  createCategoryMutation.mutate({ name });
                }}
                onDelete={(id) => deleteCategoryMutation.mutate({ id })}
                saving={createCategoryMutation.isPending}
                deleting={deleteCategoryMutation.isPending}
              />
            )}

            {section === "comboKits" && (
              <ComboKitsAdmin
                kits={comboKits}
                products={catalogProducts}
                onAdd={() => setShowAddCombo(true)}
                onDelete={(id) => hideComboMutation.mutate({ id })}
              />
            )}
            {section === "comboRequests" && <ComboRequestsAdmin rows={(comboRequestsQuery.data || []) as any[]} onApprove={(id) => approveComboRequestMutation.mutate({ id })} busy={approveComboRequestMutation.isPending} />}

            {section === "customerStories" && (
              <CustomerStoriesAdmin
                stories={(storiesQuery.data || []) as CustomerStoryAdmin[]}
                onAdd={() => setShowAddCombo(true)}
                onDelete={(id) => hideStoryMutation.mutate({ id })}
              />
            )}

            {section === "updates" && (
              <StoreUpdatesAdmin
                updates={(updatesQuery.data || []) as Array<{
                  id: number;
                  kind: string;
                  title: string;
                  body: string | null;
                  url: string | null;
                  imageUrl: string | null;
                  active: number;
                  createdAt: Date;
                }>}
                draft={newUpdate}
                setDraft={setNewUpdate}
                onAdd={() => {
                  if (!newUpdate.title.trim()) {
                    toast.error("Add a title for this update.");
                    return;
                  }
                  createUpdateMutation.mutate({
                    kind: newUpdate.kind,
                    title: newUpdate.title.trim(),
                    body: newUpdate.body.trim() || undefined,
                    url: newUpdate.url.trim() || undefined,
                    imageUrl: newUpdate.imageUrl.trim() || undefined,
                  });
                }}
                onHide={id => hideUpdateMutation.mutate({ id })}
                onUploadImage={photo => uploadMutation.mutateAsync(photo)}
                saving={createUpdateMutation.isPending || uploadMutation.isPending}
              />
            )}

            {section === "transactions" && (
              <TransactionsAdmin rows={(transactionsQuery.data || []) as any[]} />
            )}

            {section === "reports" && (
              <ReportsAdmin
                metrics={metricsQuery.data}
                products={catalogProducts}
                orders={(ordersQuery.data || []) as any[]}
                inventory={(inventoryQuery.data || []) as any[]}
                transactions={(transactionsQuery.data || []) as any[]}
              />
            )}

            {section === "audit" && <AuditAdmin rows={(auditQuery.data || []) as any[]} />}
            {section === "requests" && <Requests data={requestsQuery.data} />}
            {section === "analytics" && <Analytics data={analyticsQuery.data} />}

            {section === "settings" && (
              <Settings
                settings={settings}
                setSettings={setSettings}
                onSave={() => saveSettingsMutation.mutate(settings)}
                saving={saveSettingsMutation.isPending}
              />
            )}
          </main>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAdd && (
        <AddProductModal
          product={newProduct}
          setProduct={setNewProduct}
          onClose={() => setShowAdd(false)}
          onSave={addProduct}
          saving={createMutation.isPending || uploadMutation.isPending || uploadingProductPhotos}
          categories={productCategoryNames}
          uploadError={uploadMutation.error?.message}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <AddProductModal
          product={editingProduct}
          setProduct={(value) =>
            setEditingProduct(typeof value === "function" ? value(editingProduct) : value)
          }
          onClose={() => setEditingProduct(null)}
          onSave={() => editProduct(editingProduct)}
          saving={updateMutation.isPending || uploadMutation.isPending || uploadingProductPhotos}
          categories={productCategoryNames}
          editing
          uploadError={uploadMutation.error?.message}
        />
      )}

      {/* Add Combo Modal */}
      {showAddCombo && section === "comboKits" && (
        <AddComboModal
          combo={newCombo}
          setCombo={setNewCombo}
          products={catalogProducts}
          onClose={() => setShowAddCombo(false)}
          onSave={createCombo}
          saving={createComboMutation.isPending}
        />
      )}

      {/* Invoice Viewer Modal */}
      {activeInvoiceOrder && (
        <InvoiceModal
          order={activeInvoiceOrder}
          settings={settings}
          onClose={() => setActiveInvoiceOrder(null)}
        />
      )}
    </div>
  );
}

function AdminLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#0b0e0f] text-white">
      <Loader2 className="animate-spin text-orange-400 size-8" />
    </div>
  );
}

function AdminGate() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#0b0e0f] p-5 text-white">
      <div className="w-full max-w-md border border-orange-400/25 bg-[#111416] p-8 text-center rounded-xl shadow-2xl">
        <img src={logoIconImage} alt="HAIDRONICS" className="mx-auto size-16 rounded-lg object-contain bg-white/5 p-2" />
        <p className="eyebrow mt-6 text-orange-300">Restricted area</p>
        <h1 className="mt-3 font-display text-4xl">Sign in to continue</h1>
        <p className="mt-4 text-sm leading-6 text-white/50">
          Sign in with your pre-authorized Google account. Creating a customer account never grants admin access.
        </p>
        <Link
          href="/account?next=%2Fadmin"
          className="mt-7 inline-flex items-center gap-2 rounded-md bg-[#ff6417] px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-black hover:bg-orange-400"
        >
          <LogIn size={15} /> Continue to sign in
        </Link>
        <a href="/" className="mt-5 block font-mono text-[10px] uppercase tracking-[0.14em] text-white/35 hover:text-white">
          Return to Storefront
        </a>
      </div>
    </div>
  );
}

function AdminDenied() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#0b0e0f] p-5 text-white">
      <div className="w-full max-w-md border border-red-400/25 bg-[#111416] p-8 text-center rounded-xl">
        <p className="eyebrow text-red-300">Access unavailable</p>
        <h1 className="mt-3 font-display text-4xl">This page isn’t available</h1>
        <p className="mt-4 text-sm leading-6 text-white/50">
          Your account does not have permission to view this page.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/account" className="inline-flex rounded-md border border-white/15 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white hover:border-orange-400">Open customer account</Link>
          <Link href="/" className="inline-flex rounded-md border border-white/15 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white hover:border-orange-400">Return to Storefront</Link>
        </div>
      </div>
    </div>
  );
}

function Dashboard({
  setSection,
  productCount,
  requestCount,
  metrics,
  orders = [],
  products = [],
  onVerify,
  onTransition,
  onViewInvoice,
  onOpenAddProduct,
  onOpenAddCombo,
  onRestock,
  restockDraft,
  setRestockDraft,
}: {
  setSection: (section: string) => void;
  productCount: number;
  requestCount: number;
  metrics?: { orders: number; pendingPayments: number; lowStock: number; todaySales: number; revenue: number };
  orders: any[];
  products: Product[];
  onVerify: (id: number, reference?: string) => void;
  onTransition: (id: number, status: any) => void;
  onViewInvoice: (order: any) => void;
  onOpenAddProduct: () => void;
  onOpenAddCombo: () => void;
  onRestock: (product: Product) => void;
  restockDraft: Record<string, string>;
  setRestockDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const lowStockItems = useMemo(
    () => products.filter((p) => (p.stock || 0) <= (p.lowStockThreshold || 5)),
    [products]
  );

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ORDER_REQUESTED: 0,
      PAYMENT_PENDING: 0,
      ORDER_CONFIRMED: 0,
      PACKED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
    };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) counts[o.status]++;
    });
    return counts;
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <div className="space-y-7">
      {/* Top Banner & Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-[#0b0e0f] via-[#111619] to-[#0b0e0f] p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">
                HAIDRONICS OPERATIONS // WORKSPACE STATUS: ONLINE
              </p>
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
              Good to see you. Here’s your store at a glance.
            </h2>
            <p className="mt-1 text-xs text-white/50">
              Review orders, keep inventory current, and follow up with customers from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenAddProduct}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-black shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-400 active:scale-95"
            >
              <CirclePlus size={15} /> New Product
            </button>
            <button
              type="button"
              onClick={onOpenAddCombo}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur transition-all hover:border-orange-400 hover:bg-white/10"
            >
              <Layers3 size={15} className="text-orange-400" /> Combo Kit
            </button>
            <button
              type="button"
              onClick={() => setSection("reports")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur transition-all hover:border-orange-400 hover:bg-white/10"
            >
              <FileBarChart size={15} className="text-orange-400" /> Master CSV
            </button>
          </div>
        </div>
      </div>

      {/* Cyber Metric KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="group relative overflow-hidden rounded-xl border border-black/10 bg-white p-5 shadow-sm transition-all hover:border-orange-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/50 font-bold">Total Sales (Verified)</span>
            <ReceiptText size={18} className="text-emerald-600" />
          </div>
          <p className="mt-3 font-mono text-3xl font-black text-emerald-600">
            {formatINR(metrics?.revenue || metrics?.todaySales || 0)}
          </p>
          <p className="mt-1 font-mono text-[10px] text-black/40">From verified customer payments</p>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-black/10 bg-white p-5 shadow-sm transition-all hover:border-orange-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/50 font-bold">Total Orders</span>
            <ClipboardList size={18} className="text-orange-600" />
          </div>
          <p className="mt-3 font-mono text-3xl font-black text-black">
            {metrics?.orders || orders.length || 0}
          </p>
          <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-black/50">
            <span className="text-amber-600 font-bold">{metrics?.pendingPayments || stageCounts.PAYMENT_PENDING || 0} pending</span>
            <span>·</span>
            <span className="text-emerald-600 font-bold">{stageCounts.ORDER_CONFIRMED || 0} confirmed</span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-black/10 bg-white p-5 shadow-sm transition-all hover:border-orange-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/50 font-bold">Low Stock Radar</span>
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <p className="mt-3 font-mono text-3xl font-black text-red-600">
            {lowStockItems.length} <span className="text-xs font-normal text-black/40">items critical</span>
          </p>
          <p className="mt-1 font-mono text-[10px] text-black/40">Threshold ≤ 5 units in warehouse</p>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-black/10 bg-white p-5 shadow-sm transition-all hover:border-orange-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/50 font-bold">Catalog SKU Count</span>
            <Package size={18} className="text-orange-600" />
          </div>
          <p className="mt-3 font-mono text-3xl font-black text-black">
            {productCount} <span className="text-xs font-normal text-black/40">active SKUs</span>
          </p>
          <p className="mt-1 font-mono text-[10px] text-black/40">{requestCount} persisted customer briefs</p>
        </div>
      </div>

      {/* Interactive Order Pipeline Funnel */}
      <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center border-b border-black/[0.06] pb-4">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-orange-600 font-bold">Real-time Pipeline</span>
            <h3 className="font-display text-xl font-bold">Order Lifecycle Radar</h3>
          </div>
          <button
            type="button"
            onClick={() => setSection("orders")}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black/60 hover:text-orange-600"
          >
            Manage All Orders <ChevronRight size={14} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            { key: "ORDER_REQUESTED", label: "Requested", color: "border-blue-300 bg-blue-50/50 text-blue-800", count: stageCounts.ORDER_REQUESTED },
            { key: "PAYMENT_PENDING", label: "Payment Pending", color: "border-amber-300 bg-amber-50/50 text-amber-800", count: stageCounts.PAYMENT_PENDING },
            { key: "ORDER_CONFIRMED", label: "Confirmed", color: "border-emerald-300 bg-emerald-50/50 text-emerald-800", count: stageCounts.ORDER_CONFIRMED },
            { key: "PACKED", label: "Packed", color: "border-purple-300 bg-purple-50/50 text-purple-800", count: stageCounts.PACKED },
            { key: "SHIPPED", label: "Shipped", color: "border-indigo-300 bg-indigo-50/50 text-indigo-800", count: stageCounts.SHIPPED },
            { key: "DELIVERED", label: "Delivered", color: "border-green-300 bg-green-50/50 text-green-800", count: stageCounts.DELIVERED },
          ].map((stage) => (
            <button
              key={stage.key}
              type="button"
              onClick={() => setSection("orders")}
              className={`flex flex-col items-start rounded-lg border p-3.5 text-left transition-all hover:scale-[1.02] hover:shadow-sm ${stage.color}`}
            >
              <span className="font-mono text-[9px] uppercase tracking-wider font-bold opacity-75">{stage.label}</span>
              <span className="mt-2 font-mono text-2xl font-black">{stage.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Recent Orders & Low Stock Radar */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        {/* Recent Orders Queue */}
        <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-orange-600 font-bold">Fulfillment Queue</span>
                <h3 className="font-display text-xl font-bold">Recent Customer Inquiries</h3>
              </div>
              <button
                type="button"
                onClick={() => setSection("orders")}
                className="font-mono text-[10px] uppercase tracking-wider text-black/50 hover:text-orange-600 font-bold"
              >
                View ({orders.length})
              </button>
            </div>

            <div className="mt-4 divide-y divide-black/[0.06]">
              {recentOrders.length ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-orange-600">
                          {order.orderNumber || `HAI-${order.id}`}
                        </span>
                        <span className="rounded bg-black/5 px-2 py-0.5 font-mono text-[9px] uppercase font-semibold text-black/70">
                          {order.status.replaceAll("_", " ")}
                        </span>
                        {order.amountOverridden === 1 && (
                          <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.2 font-mono text-[8px] font-bold uppercase">
                            Negotiated
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-black">{order.customerName}</p>
                      <p className="text-xs text-black/50 font-mono">
                        📞 {order.phone} · {formatINR(order.finalAmount || order.total)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={whatsappLink(`Hi ${order.customerName}, regarding your HAIDRONICS order ${order.orderNumber}:`, order.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-mono text-[9px] font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                      {order.invoiceId ? (
                        <button
                          type="button"
                          onClick={() => onViewInvoice(order)}
                          className="inline-flex items-center gap-1 rounded border border-black/15 bg-black/5 px-2.5 py-1 font-mono text-[9px] font-bold text-black hover:bg-black hover:text-white"
                        >
                          <FileText size={12} /> Invoice
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-black/40 font-mono">
                  No orders recorded yet. As customers place orders on WhatsApp / checkout, they appear here.
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSection("orders")}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-black/5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white transition-colors"
          >
            Open Complete Order Workspace <ChevronRight size={13} />
          </button>
        </div>

        {/* Low Stock Radar with 1-Click Restock */}
        <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-red-600 font-bold">Inventory Alert</span>
                <h3 className="font-display text-xl font-bold">Low Stock Warning Radar</h3>
              </div>
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase text-red-800">
                {lowStockItems.length} Low
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {lowStockItems.length ? (
                lowStockItems.slice(0, 5).map((product) => (
                  <div key={product.id} className="rounded-lg border border-red-200 bg-red-50/40 p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="truncate pr-2">
                        <p className="text-xs font-bold text-black truncate">{product.name}</p>
                        <p className="font-mono text-[10px] text-black/50">{product.sku} · {formatINR(product.price)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="rounded bg-red-600 px-2 py-0.5 font-mono text-[10px] font-black text-white">
                          {product.stock || 0} LEFT
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-red-200/50 pt-2 font-mono text-[9px]">
                      <span className="text-black/50">Threshold: {product.lowStockThreshold || 5}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (product.dbId) {
                            setRestockDraft((cur) => ({ ...cur, [String(product.dbId)]: "25" }));
                            onRestock(product);
                          } else {
                            toast.error("Save product to DB before restocking.");
                          }
                        }}
                        className="rounded bg-black px-2 py-1 font-bold text-white hover:bg-orange-600 transition-colors"
                      >
                        +25 Restock
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-emerald-700 font-mono">
                  ✓ All warehouse stock levels are healthy!
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSection("inventory")}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-black/5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white transition-colors"
          >
            Open Full Inventory & Movements <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* System Infrastructure Telemetry Strip */}
      <div className="rounded-xl border border-white/10 bg-[#0b0e0f] p-5 text-white shadow-xl">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/20 p-2.5 border border-orange-500/30">
              <Settings2 size={20} className="text-orange-400" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-400 font-bold">Architecture Diagnostics</p>
              <p className="text-sm font-semibold text-white">HAIDRONICS Cloud & Automation Engine</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-[10px]">
            <div className="rounded border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-white/40 block text-[8px] uppercase">WhatsApp Router</span>
              <span className="text-emerald-400 font-bold">● Active (+91 8248453861)</span>
            </div>
            <div className="rounded border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-white/40 block text-[8px] uppercase">H-Invoice Generator</span>
              <span className="text-emerald-400 font-bold">● Ready (INV-YYYY-ID)</span>
            </div>
            <div className="rounded border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-white/40 block text-[8px] uppercase">Price Override</span>
              <span className="text-emerald-400 font-bold">● Server Verified</span>
            </div>
            <div className="rounded border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-white/40 block text-[8px] uppercase">Inventory Sync</span>
              <span className="text-emerald-400 font-bold">● Atomic Locking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsAdmin({
  products,
  search,
  setSearch,
  onAdd,
  onEdit,
  onDelete,
}: {
  products: Product[];
  search: string;
  setSearch: (value: string) => void;
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-600 font-semibold">Catalog / Stock</p>
          <h2 className="mt-1 font-display text-3xl font-bold">
            Products <span className="text-black/30">({products.length})</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 self-start rounded-md bg-orange-500 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black hover:bg-orange-400"
        >
          <CirclePlus size={15} /> Add New Product
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-lg bg-white px-4 border border-black/10">
        <Search size={17} className="text-black/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name, SKU, or category..."
          className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-black/30"
        />
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg bg-white border border-black/10 shadow-sm">
        <table className="w-full min-w-[700px] text-left">
          <thead className="border-b border-black/10 bg-[#fafafa] font-mono text-[9px] uppercase tracking-[0.13em] text-black/40">
            <tr>
              <th className="px-5 py-4">Product Details</th>
              <th className="px-5 py-4">SKU</th>
              <th className="px-5 py-4">Price</th>
              <th className="px-5 py-4">Stock</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-black/[0.06] last:border-0 hover:bg-black/[0.01]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded bg-[#111416] overflow-hidden flex items-center justify-center shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="font-mono text-[9px] text-orange-400 font-bold uppercase">
                          {product.image.slice(0, 4)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black">{product.name}</p>
                      <p className="text-xs text-black/40">{product.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-black/50">{product.sku}</td>
                <td className="px-5 py-4 font-mono text-sm font-semibold">{formatINR(product.price)}</td>
                <td className="px-5 py-4">
                  <span
                    className={`font-mono text-xs font-bold ${
                      (product.stock || 0) <= (product.lowStockThreshold || 5) ? "text-red-600" : "text-emerald-700"
                    }`}
                  >
                    {product.stock || 0} units
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-emerald-800">
                    {product.stockStatus || "Active"}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="inline-flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="font-mono text-[10px] uppercase tracking-[0.12em] font-semibold text-black/60 hover:text-orange-600"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product)}
                      className="text-black/30 hover:text-red-600"
                      title="Hide product"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersAdmin({
  orders,
  onVerify,
  onReject,
  onTransition,
  onOverrideAmount,
  onGenerateInvoice,
  onSendInvoiceEmail,
  onViewInvoice,
  busy,
}: {
  orders: any[];
  onVerify: (id: number, reference?: string) => void;
  onReject: (id: number) => void;
  onTransition: (id: number, status: "PAYMENT_PENDING" | "ORDER_CONFIRMED" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED") => void;
  onOverrideAmount: (id: number, finalAmount: number, reason?: string) => void;
  onGenerateInvoice: (id: number) => void;
  onSendInvoiceEmail: (id: number) => void;
  onViewInvoice: (order: any) => void;
  busy: boolean;
}) {
  const [filter, setFilter] = useState("ALL");

  const filteredOrders = useMemo(() => {
    if (filter === "ALL") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-600 font-semibold">Ledger / State Machine</p>
          <h2 className="mt-1 font-display text-3xl font-bold">
            Customer Orders <span className="text-black/30">({orders.length})</span>
          </h2>
        </div>
        <p className="max-w-xs text-right text-xs leading-5 text-black/50">
          Enquiries made on WhatsApp are logged here. Admin manages payment verification, stock deduction, and invoice generation.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {["ALL", "ORDER_REQUESTED", "PAYMENT_PENDING", "ORDER_CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"].map(
          (st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                filter === st ? "bg-black text-white font-bold" : "bg-white text-black/60 border border-black/10 hover:bg-black/5"
              }`}
            >
              {st.replaceAll("_", " ")}
            </button>
          )
        )}
      </div>

      <div className="mt-6 grid gap-4">
        {filteredOrders.length ? (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onVerify={onVerify}
              onReject={onReject}
              onTransition={onTransition}
              onOverrideAmount={onOverrideAmount}
              onGenerateInvoice={onGenerateInvoice}
              onSendInvoiceEmail={onSendInvoiceEmail}
              onViewInvoice={onViewInvoice}
              busy={busy}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-black/15 bg-white p-10 text-center text-sm text-black/50">
            No orders found under <strong>{filter}</strong>.
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onVerify,
  onReject,
  onTransition,
  onOverrideAmount,
  onGenerateInvoice,
  onSendInvoiceEmail,
  onViewInvoice,
  busy,
}: {
  order: any;
  onVerify: (id: number, reference?: string) => void;
  onReject: (id: number) => void;
  onTransition: (id: number, status: any) => void;
  onOverrideAmount: (id: number, finalAmount: number, reason?: string) => void;
  onGenerateInvoice: (id: number) => void;
  onSendInvoiceEmail: (id: number) => void;
  onViewInvoice: (order: any) => void;
  busy: boolean;
}) {
  const [reference, setReference] = useState("");
  const [editingPrice, setEditingPrice] = useState(false);
  const [overridePrice, setOverridePrice] = useState(String(order.finalAmount || order.total));
  const [overrideReason, setOverrideReason] = useState("");

  const handleSavePrice = () => {
    const val = Number(overridePrice);
    if (!val || val <= 0) return;
    onOverrideAmount(order.id, val, overrideReason);
    setEditingPrice(false);
  };

  const statusColors: Record<string, string> = {
    ORDER_REQUESTED: "bg-blue-100 text-blue-800",
    PAYMENT_PENDING: "bg-amber-100 text-amber-800",
    ORDER_CONFIRMED: "bg-emerald-100 text-emerald-800",
    PACKED: "bg-purple-100 text-purple-800",
    SHIPPED: "bg-indigo-100 text-indigo-800",
    DELIVERED: "bg-green-100 text-green-800",
    PAYMENT_REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-700",
  };

  return (
    <article className="rounded-lg border border-black/10 bg-white p-5 md:p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start border-b border-black/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-orange-600">
              {order.orderNumber || `HAI-ORDER-${order.id}`}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                statusColors[order.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {order.status.replaceAll("_", " ")}
            </span>
            {order.amountOverridden === 1 && (
              <span className="rounded bg-amber-500/10 text-amber-700 px-2 py-0.5 font-mono text-[9px] font-bold uppercase">
                Price Negotiated
              </span>
            )}
          </div>
          <h3 className="mt-2 font-display text-xl font-bold text-black">{order.customerName}</h3>
          <p className="mt-1 text-xs text-black/60 font-mono">
            📞 {order.phone} · 📍 {order.address}
          </p>
          {order.invoiceId && (
            <p className={`mt-1 text-[10px] font-mono ${order.invoiceEmailStatus === "SENT" ? "text-emerald-700" : order.invoiceEmailStatus === "FAILED" ? "text-red-700" : "text-black/45"}`}>
              Invoice email: {order.invoiceEmailStatus || "NOT_SENT"}
              {order.invoiceEmailSentAt ? ` · ${new Date(order.invoiceEmailSentAt).toLocaleString()}` : ""}
              {order.invoiceEmailError ? ` · ${order.invoiceEmailError}` : ""}
            </p>
          )}
        </div>

        <div className="text-left md:text-right">
          <p className="font-mono text-2xl font-bold text-orange-600">
            {formatINR(order.finalAmount || order.total)}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase text-black/40">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Items Breakdown */}
      <div className="mt-4 grid gap-2 py-2">
        {(order.items || []).map((item: any) => (
          <div key={item.id} className="flex justify-between text-sm py-1 border-b border-black/[0.03]">
            <span>
              {item.productName} <span className="text-black/40 font-mono">({item.sku})</span> × {item.quantity}
            </span>
            <span className="font-mono font-medium">{formatINR(item.lineTotal)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between font-mono text-xs text-black/60 pt-2 border-t border-black/10">
          <span>Subtotal + Shipping ({formatINR(order.shipping || 50)})</span>
          <span>
            {formatINR(order.subtotal || order.total - 50)} + {formatINR(order.shipping || 50)} ={" "}
            <strong>{formatINR(order.calculatedAmount || order.total)}</strong>
          </span>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4">
        {/* Left: WhatsApp chat link & Invoice button */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={whatsappLink(`Hi ${order.customerName}, regarding your HAIDRONICS order ${order.orderNumber}:`, order.phone)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 font-mono text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
          >
            <MessageCircle size={14} /> WhatsApp Customer
          </a>

          {order.invoiceId ? (
            <button
              type="button"
              onClick={() => onViewInvoice(order)}
              className="inline-flex items-center gap-1.5 rounded-md border border-black/15 bg-black/5 px-3 py-1.5 font-mono text-[10px] font-bold text-black hover:bg-black hover:text-white"
            >
              <FileText size={14} /> View Invoice ({order.invoiceId})
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || order.paymentStatus !== "VERIFIED"}
              title={order.paymentStatus !== "VERIFIED" ? "Verify payment before generating an invoice." : undefined}
              onClick={() => onGenerateInvoice(order.id)}
              className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-1.5 font-mono text-[10px] font-bold text-black hover:bg-orange-500 hover:border-orange-500 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:border-black/15"
            >
              <FileText size={14} /> {order.paymentStatus === "VERIFIED" ? "Generate Invoice" : "Invoice after payment"}
            </button>
          )}
          {order.paymentStatus === "VERIFIED" && order.invoiceId && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onSendInvoiceEmail(order.id)}
              title={order.invoiceEmailError || undefined}
              className="inline-flex items-center gap-1.5 rounded-md border border-orange-300 bg-orange-50 px-3 py-1.5 font-mono text-[10px] font-bold text-orange-800 hover:bg-orange-100 disabled:opacity-50"
            >
              <RefreshCw size={13} /> {order.invoiceEmailStatus === "SENT" ? "Resend invoice email" : "Send invoice email"}
            </button>
          )}

          {/* Negotiate price toggle */}
          {!editingPrice ? (
            <button
              type="button"
              onClick={() => setEditingPrice(true)}
              className="inline-flex items-center gap-1 font-mono text-[10px] text-black/50 hover:text-orange-600 underline"
            >
              <Edit2 size={12} /> Override Amount
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-[#f7f8f8] p-2 rounded border border-black/10">
              <input
                type="number"
                min="0"
                step="0.01"
                value={overridePrice}
                onChange={(e) => setOverridePrice(e.target.value)}
                className="h-8 w-24 rounded border border-black/20 bg-white px-2 text-xs font-mono"
              />
              <input
                placeholder="Reason (optional)"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="h-8 w-32 rounded border border-black/20 bg-white px-2 text-xs"
              />
              <button
                type="button"
                onClick={handleSavePrice}
                className="rounded bg-black px-2.5 py-1.5 font-mono text-[9px] text-white font-bold"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingPrice(false)}
                className="font-mono text-[9px] text-black/40"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Right: State Machine Transitions */}
        <div className="flex flex-wrap items-center gap-2">
          {order.status === "ORDER_REQUESTED" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onTransition(order.id, "PAYMENT_PENDING")}
              className="rounded-md bg-black px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-orange-600"
            >
              Mark Payment Pending
            </button>
          )}

          {order.status === "PAYMENT_PENDING" && (
            <div className="flex items-center gap-2">
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="UPI Ref (optional)"
                className="h-9 w-36 rounded border border-black/15 bg-[#f7f8f8] px-2.5 text-xs outline-none focus:border-orange-500"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => onVerify(order.id, reference || undefined)}
                className="rounded-md bg-emerald-600 px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-emerald-500"
              >
                Verify Payment & Deduct Stock
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onReject(order.id)}
                className="rounded-md border border-red-200 px-3 py-2 font-mono text-[10px] uppercase text-red-600 hover:bg-red-50"
              >
                Reject
              </button>
            </div>
          )}

          {order.status === "ORDER_CONFIRMED" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onTransition(order.id, "PACKED")}
              className="rounded-md bg-purple-600 px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-purple-500"
            >
              Mark as Packed
            </button>
          )}

          {order.status === "PACKED" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onTransition(order.id, "SHIPPED")}
              className="rounded-md bg-indigo-600 px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-indigo-500"
            >
              Mark as Shipped
            </button>
          )}

          {order.status === "SHIPPED" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onTransition(order.id, "DELIVERED")}
              className="rounded-md bg-green-700 px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-green-600"
            >
              Mark as Delivered
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function InventoryAdmin({
  products,
  movements,
  restockDraft,
  inventoryValues,
  setInventoryValues,
  setRestockDraft,
  onRestock,
  onSaveInventory,
  busy,
}: {
  products: Product[];
  movements: any[];
  restockDraft: Record<string, string>;
  inventoryValues: Record<string, { stock: string; threshold: string }>;
  setInventoryValues: React.Dispatch<React.SetStateAction<Record<string, { stock: string; threshold: string }>>>;
  setRestockDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onRestock: (product: Product) => void;
  onSaveInventory: (product: Product, stock: number, threshold: number) => void;
  busy: boolean;
}) {
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-600 font-semibold">Stock Control / Ledger</p>
          <h2 className="mt-1 font-display text-3xl font-bold">Inventory & Movement Trail</h2>
        </div>
        <p className="max-w-xs text-right text-xs leading-5 text-black/50">
          Payment confirmation automatically deducts units and prevents overselling. Restocks are logged with audit reasons.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg bg-white border border-black/10 shadow-sm">
        <table className="w-full min-w-[700px] text-left">
          <thead className="border-b border-black/10 bg-[#fafafa] font-mono text-[9px] uppercase tracking-[0.13em] text-black/40">
            <tr>
              <th className="px-5 py-4">Component</th>
              <th className="px-5 py-4">SKU</th>
              <th className="px-5 py-4">Current Stock</th>
              <th className="px-5 py-4">Threshold</th>
              <th className="px-5 py-4">Quick Restock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-black/[0.06] last:border-0 hover:bg-black/[0.01]">
                <td className="px-5 py-4 font-medium">{product.name}</td>
                <td className="px-5 py-4 font-mono text-xs text-black/50">{product.sku}</td>
                <td className="px-5 py-4">
                  <input type="number" min="0" value={inventoryValues[String(product.dbId)]?.stock ?? String(product.stock ?? 0)} onChange={(e) => setInventoryValues(cur => ({ ...cur, [String(product.dbId)]: { stock: e.target.value, threshold: cur[String(product.dbId)]?.threshold ?? String(product.lowStockThreshold ?? 5) } }))} className="h-9 w-20 rounded border border-black/15 bg-[#f7f8f8] px-2 text-xs font-mono" aria-label={`${product.name} stock`} />
                </td>
                <td className="px-5 py-4"><input type="number" min="0" value={inventoryValues[String(product.dbId)]?.threshold ?? String(product.lowStockThreshold ?? 5)} onChange={(e) => setInventoryValues(cur => ({ ...cur, [String(product.dbId)]: { stock: cur[String(product.dbId)]?.stock ?? String(product.stock ?? 0), threshold: e.target.value } }))} className="h-9 w-20 rounded border border-black/15 bg-[#f7f8f8] px-2 text-xs font-mono" aria-label={`${product.name} low stock threshold`} /></td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={restockDraft[String(product.dbId)] || ""}
                      onChange={(e) =>
                        setRestockDraft((cur) => ({ ...cur, [String(product.dbId)]: e.target.value }))
                      }
                      className="h-9 w-20 rounded border border-black/15 bg-[#f7f8f8] px-2 text-xs font-mono"
                    />
                    <button
                      type="button"
                      disabled={busy || !product.dbId}
                      onClick={() => onRestock(product)}
                      className="rounded-md bg-orange-500 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-black hover:bg-orange-400 disabled:opacity-50"
                    >
                      + Restock
                    </button>
                    <button type="button" disabled={busy || !product.dbId} onClick={() => { const value = inventoryValues[String(product.dbId)] || { stock: String(product.stock ?? 0), threshold: String(product.lowStockThreshold ?? 5) }; onSaveInventory(product, Number(value.stock), Number(value.threshold)); }} className="rounded-md border border-black/20 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-wider disabled:opacity-50">Save</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-600 font-semibold">
          Movement History (Last 300 Events)
        </p>
        <div className="mt-3 grid gap-2">
          {movements.slice(0, 15).map((row: any) => (
            <div
              key={row.movement.id}
              className="flex flex-wrap justify-between items-center gap-3 rounded-md bg-white border border-black/[0.06] px-4 py-3 text-sm"
            >
              <div>
                <span className="font-medium">{row.productName || "Product"}</span> ·{" "}
                <span className="font-mono text-xs text-black/50 uppercase">{row.movement.reason}</span>
                {row.movement.note && <span className="text-xs text-black/40 ml-2">({row.movement.note})</span>}
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`font-mono text-sm font-bold ${
                    row.movement.change > 0 ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {row.movement.change > 0 ? `+${row.movement.change}` : row.movement.change}
                </span>
                <span className="font-mono text-[10px] text-black/35">
                  {new Date(row.movement.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportsAdmin({
  metrics,
  products,
  orders,
  inventory,
  transactions,
}: {
  metrics?: { orders: number; pendingPayments: number; lowStock: number; todaySales: number; revenue: number };
  products: Product[];
  orders: any[];
  inventory: any[];
  transactions: any[];
}) {
  const exportOrdersCSV = () => {
    const headers = "OrderNumber,CustomerName,Phone,Address,Status,PaymentStatus,CalculatedAmount,FinalAmount,Date\n";
    const rows = orders
      .map((o) => [o.orderNumber, o.customerName, o.phone, o.address, o.status, o.paymentStatus, o.calculatedAmount, o.finalAmount, new Date(o.createdAt).toISOString()].map(csvCell).join(","))
      .join("\n");
    downloadFile(headers + rows, `haidronics_orders_${Date.now()}.csv`);
  };

  const exportInventoryCSV = () => {
    const headers = "ProductName,SKU,Category,CurrentStock,LowStockThreshold,Price\n";
    const rows = products
      .map((p) => [p.name, p.sku, p.category, p.stock ?? 0, p.lowStockThreshold ?? 5, p.price].map(csvCell).join(","))
      .join("\n");
    downloadFile(headers + rows, `haidronics_inventory_${Date.now()}.csv`);
  };

  const exportTransactionsCSV = () => {
    const headers = "TransactionID,OrderNumber,Amount,Type,Status,Date\n";
    const rows = transactions
      .map((t) => [t.transaction.id, t.orderNumber, t.transaction.amount, t.transaction.type, t.transaction.paymentStatus, new Date(t.transaction.createdAt).toISOString()].map(csvCell).join(","))
      .join("\n");
    downloadFile(headers + rows, `haidronics_transactions_${Date.now()}.csv`);
  };

  const csvCell = (value: unknown) => {
    const text = String(value ?? "");
    const safeText = typeof value !== "number" && /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    toast.success(`Downloaded ${filename}`);
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-600 font-semibold">Analytics & Exports</p>
          <h2 className="mt-1 font-display text-3xl font-bold">Business Reports & Downloads</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Total Orders" value={String(metrics?.orders || 0)} />
        <MetricCard label="Pending Payments" value={String(metrics?.pendingPayments || 0)} accent="amber" />
        <MetricCard label="Low Stock Items" value={String(metrics?.lowStock || 0)} accent="red" />
        <MetricCard label="Sales Today" value={formatINR(metrics?.todaySales || 0)} accent="green" />
        <MetricCard label="Verified Revenue" value={formatINR(metrics?.revenue || 0)} accent="green" />
      </div>

      {/* Export Buttons */}
      <div className="mt-8 rounded-lg bg-white p-6 border border-black/10 shadow-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-600 font-bold">
          One-Click Data Export
        </p>
        <p className="mt-1 text-sm text-black/60">
          Download CSV and Excel compatible spreadsheets for billing, accounting, and inventory audits.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={exportOrdersCSV}
            className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white hover:bg-orange-600 transition-colors"
          >
            <Download size={15} /> Export Orders CSV
          </button>
          <button
            type="button"
            onClick={exportInventoryCSV}
            className="inline-flex items-center gap-2 rounded-md border border-black/20 bg-white px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white transition-colors"
          >
            <Download size={15} /> Export Inventory CSV
          </button>
          <button
            type="button"
            onClick={exportTransactionsCSV}
            className="inline-flex items-center gap-2 rounded-md border border-black/20 bg-white px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white transition-colors"
          >
            <Download size={15} /> Export Transactions CSV
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoriesAdmin({
  categories,
  newCategory,
  setNewCategory,
  onAdd,
  onDelete,
  saving,
  deleting,
}: {
  categories: Array<{ id?: number; name: string; productCount: number }>;
  newCategory: string;
  setNewCategory: (value: string) => void;
  onAdd: () => void;
  onDelete: (id: number) => void;
  saving: boolean;
  deleting: boolean;
}) {
  return (
    <section>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-600 font-semibold">Catalog organization</p>
        <h2 className="mt-1 font-display text-3xl font-bold">Product Categories</h2>
        <p className="mt-2 max-w-2xl text-sm text-black/55">Add categories for your catalog. A category can only be deleted after its products have been moved or removed.</p>
      </div>

      <form
        className="mt-6 flex max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onAdd();
        }}
      >
        <input
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
          maxLength={80}
          placeholder="e.g. Wires & Cables"
          aria-label="New category name"
          className="h-11 min-w-0 flex-1 rounded-md border border-black/15 bg-white px-3 text-sm outline-none focus:border-orange-500"
        />
        <button type="submit" disabled={saving || !newCategory.trim()} className="inline-flex h-11 items-center gap-2 rounded-md bg-orange-500 px-4 font-mono text-[10px] font-bold uppercase tracking-wide text-black hover:bg-orange-400 disabled:opacity-50">
          <CirclePlus size={15} /> Add
        </button>
      </form>

      <div className="mt-6 max-w-3xl overflow-hidden rounded-lg border border-black/10 bg-white">
        {categories.map((category) => (
          <div key={category.id ?? category.name} className="flex items-center justify-between gap-4 border-b border-black/5 px-4 py-3 last:border-b-0">
            <div>
              <p className="text-sm font-semibold">{category.name}</p>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wide text-black/40">
                {category.productCount} product{category.productCount === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              disabled={!category.id || category.productCount > 0 || deleting}
              onClick={() => category.id && onDelete(category.id)}
              title={category.productCount > 0 ? "Move products out of this category before deleting it." : "Delete category"}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 font-mono text-[9px] uppercase tracking-wide text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-black/25"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        ))}
        {!categories.length && <p className="p-5 text-sm text-black/50">No categories yet. Add one above to organize products.</p>}
      </div>
    </section>
  );
}

function ComboKitsAdmin({
  kits,
  products,
  onAdd,
  onDelete,
}: {
  kits: ComboKit[];
  products: Product[];
  onAdd: () => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-600 font-semibold">Curated Bundles</p>
          <h2 className="mt-1 font-display text-3xl font-bold">
            Combo Kits <span className="text-black/30">({kits.length})</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 self-start rounded-md bg-orange-500 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black hover:bg-orange-400"
        >
          <Layers3 size={15} /> Create Combo Kit
        </button>
      </div>
      <p className="mt-3 text-sm text-black/60">
        Created kits automatically display on storefront and matching product pages under "Start with the kit".
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {kits.length ? (
          kits.map((kit) => (
            <div key={kit.id} className="relative rounded-lg border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded bg-orange-100 text-orange-800 px-2 py-0.5 font-mono text-[9px] font-bold uppercase">
                    Featured Bundle
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-bold">{kit.name}</h3>
                  <p className="mt-1 text-sm text-black/50">{kit.tagline}</p>
                </div>
                <p className="font-mono text-xl font-bold text-orange-600">{formatINR(kit.price)}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {kit.items.map((item) => (
                  <span key={item.productSlug} className="rounded-full bg-black/5 px-2.5 py-1 font-mono text-[9px] text-black/70">
                    {item.quantity}× {products.find((p) => p.id === item.productSlug)?.name || item.productSlug}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4">
                <span className="font-mono text-xs text-black/40">{kit.items.length} items bundled</span>
                <button
                  type="button"
                  onClick={() => onDelete(kit.id)}
                  className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-black/40 hover:text-red-600"
                >
                  <Trash2 size={13} /> Remove Kit
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-black/15 bg-white p-8 text-center text-sm text-black/50">
            No combo kits published yet.
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionsAdmin({ rows }: { rows: any[] }) {
  return (
    <SimpleLedger
      title="Verified Transactions"
      eyebrow="Finance & Payments"
      rows={rows.map((row) => ({
        id: row.transaction.id,
        primary: row.orderNumber || `Order #${row.transaction.orderId}`,
        secondary: `${row.transaction.type} · ${row.transaction.paymentStatus}`,
        amount: formatINR(row.transaction.amount),
        date: row.transaction.createdAt,
      }))}
      empty="Verified transactions will appear here once orders are confirmed."
    />
  );
}

function AuditAdmin({ rows }: { rows: any[] }) {
  return (
    <SimpleLedger
      title="Audit Trail"
      eyebrow="Security & Governance"
      rows={rows.map((row) => ({
        id: row.log.id,
        primary: row.log.action,
        secondary: `${row.adminName || "Admin"} · ${row.log.entityType || "System"} #${row.log.entityId || "—"} (${
          row.log.details || ""
        })`,
        amount: "",
        date: row.log.createdAt,
      }))}
      empty="Sensitive actions (price changes, payment confirmations, restocks) will log here."
    />
  );
}

function SimpleLedger({
  title,
  eyebrow,
  rows,
  empty,
}: {
  title: string;
  eyebrow: string;
  rows: Array<{ id: number; primary: string; secondary: string; amount: string; date: Date | string }>;
  empty: string;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-600 font-semibold">{eyebrow}</p>
      <h2 className="mt-1 font-display text-3xl font-bold">
        {title} <span className="text-black/30">({rows.length})</span>
      </h2>
      <div className="mt-6 grid gap-2.5">
        {rows.length ? (
          rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col justify-between gap-3 rounded-lg bg-white p-4 border border-black/[0.06] md:flex-row md:items-center shadow-sm"
            >
              <div>
                <p className="font-display text-base font-bold text-black">{row.primary}</p>
                <p className="mt-0.5 text-xs text-black/50">{row.secondary}</p>
              </div>
              <div className="text-left md:text-right">
                {row.amount && <p className="font-mono text-base font-bold text-orange-600">{row.amount}</p>}
                <p className="font-mono text-[10px] uppercase text-black/35">{new Date(row.date).toLocaleString()}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-black/15 bg-white p-8 text-center text-sm text-black/50">
            {empty}
          </div>
        )}
      </div>
    </div>
  );
}

function ComboRequestsAdmin({ rows, onApprove, busy }: { rows: Array<{ request: any; kit: string | null; kitSlug: string | null }>; onApprove: (id: number) => void; busy: boolean }) {
  return <section><p className="font-mono text-[10px] uppercase tracking-[.15em] text-orange-600 font-semibold">Combo kits / availability queue</p><h2 className="mt-1 font-display text-3xl font-bold">Customer kit requests</h2><p className="mt-2 text-sm text-black/55">Approve a request to create a standard order. Then use Orders to mark it payment pending and continue through payment verification, stock deduction, and invoice processing.</p><div className="mt-6 grid gap-3">{rows.length ? rows.map(({ request, kit }) => <article key={request.id} className="rounded-lg border border-black/10 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-wider text-orange-600">Request #{request.id} / {request.status}</p><h3 className="mt-1 font-display text-xl font-bold">{kit || "Combo kit"}</h3><p className="mt-2 text-sm">{request.customerName} · {request.phone}</p><p className="mt-1 max-w-xl text-xs leading-5 text-black/55">{request.address}</p>{request.approvedOrderId && <p className="mt-2 font-mono text-xs text-emerald-700">Order ID: {request.approvedOrderId}</p>}</div>{request.status === "REQUESTED" && <button type="button" disabled={busy} onClick={() => onApprove(request.id)} className="rounded-md bg-orange-500 px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-black disabled:opacity-50">Approve & create order</button>}</div></article>) : <p className="rounded-lg border border-dashed border-black/20 p-8 text-center text-sm text-black/45">No combo kit requests yet.</p>}</div></section>;
}

function Requests({
  data,
}: {
  data?: {
    projects: Array<{ id: number; name: string; projectName: string | null; budget: string | null; createdAt: Date }>;
    products: Array<{ id: number; component: string; quantity: number; createdAt: Date }>;
  };
}) {
  const items = [
    ...(data?.projects || []).map((item) => ({
      type: "PROJECT SUPPORT",
      title: item.projectName || "Project Brief",
      meta: `${item.name} · ${item.budget || "Budget not specified"}`,
      date: item.createdAt,
    })),
    ...(data?.products || []).map((item) => ({
      type: "PRODUCT REQUEST",
      title: item.component,
      meta: `Quantity · ${item.quantity}`,
      date: item.createdAt,
    })),
  ];

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-600 font-semibold">Inbox / Forms</p>
      <h2 className="mt-1 font-display text-3xl font-bold">Customer Requests ({items.length})</h2>
      <div className="mt-6 grid gap-3">
        {items.length ? (
          items.map((item, index) => (
            <div key={index} className="flex flex-col justify-between gap-4 rounded-lg bg-white p-5 border border-black/[0.06] sm:flex-row sm:items-center shadow-sm">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-orange-600">{item.type}</span>
                <p className="mt-1 font-display text-lg font-bold">{item.title}</p>
                <p className="text-xs text-black/50">{item.meta}</p>
              </div>
              <span className="font-mono text-[10px] text-black/35">{new Date(item.date).toLocaleString()}</span>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-black/15 bg-white p-8 text-center text-sm text-black/50">
            No customer requests submitted yet.
          </div>
        )}
      </div>
    </div>
  );
}

type StoreUpdateAdminRow = {
  id: number;
  kind: string;
  title: string;
  body: string | null;
  url: string | null;
  imageUrl: string | null;
  active: number;
  createdAt: Date;
};

function StoreUpdatesAdmin({
  updates,
  draft,
  setDraft,
  onAdd,
  onHide,
  onUploadImage,
  saving,
}: {
  updates: StoreUpdateAdminRow[];
  draft: {
    kind: "instagram" | "youtube" | "announcement";
    title: string;
    body: string;
    url: string;
    imageUrl: string;
  };
  setDraft: React.Dispatch<React.SetStateAction<typeof draft>>;
  onAdd: () => void;
  onHide: (id: number) => void;
  onUploadImage: (photo: { filename: string; contentType: ProductPhotoContentType; base64: string }) => Promise<{ url: string }>;
  saving: boolean;
}) {
  const [uploadingImage, setUploadingImage] = useState(false);

  const uploadPostImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!isProductPhotoContentType(file.type)) {
      toast.error("Choose a JPG, PNG, or WebP post image.");
      return;
    }
    if (file.size > 5_000_000) {
      toast.error("Post images must be smaller than 5 MB.");
      return;
    }
    const contentType = file.type;
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setUploadingImage(false);
      toast.error("Could not read the selected post image.");
    };
    reader.onload = async () => {
      if (typeof reader.result !== "string") {
        setUploadingImage(false);
        toast.error("Could not read the selected post image.");
        return;
      }
      try {
        const result = await onUploadImage({
          filename: file.name,
          contentType,
          base64: reader.result,
        });
        setDraft(current => ({ ...current, imageUrl: result.url }));
        toast.success("Post artwork uploaded.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not upload post artwork.");
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-orange-600">Storefront / live highlights</p>
      <h2 className="mt-1 font-display text-3xl font-bold">Hero Banners & Social Updates</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
        Every published update becomes a slide in the large revolving homepage banner. Add one slide at a time; the 24 most recent published slides rotate automatically.
      </p>

      <div className="mt-5 grid gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-xs leading-5 text-orange-950 sm:grid-cols-3">
        <p><b>1. Create a slide</b><br />Choose an announcement for a custom homepage banner, or Instagram / YouTube for a social post.</p>
        <p><b>2. Add banner copy</b><br />Enter the title and short text customers will see over the image.</p>
        <p><b>3. Add your image</b><br />Upload a wide JPG, PNG, or WebP banner. Aim for about 1920 × 900 and keep it compressed for fast mobile loading.</p>
      </div>
      <p className="mt-2 text-xs leading-5 text-black/45">
        Upload one image per slide, then publish more slides to build the carousel. The homepage pauses while a visitor hovers or focuses the controls. Social posts still link to the original post; they are not imported automatically.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm md:p-6">
          <h3 className="font-display text-xl font-bold">Create a banner slide</h3>
          <div className="mt-5 grid gap-4">
            <label>
              <span className="mb-1.5 block font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-black/50">Update type</span>
              <select value={draft.kind} onChange={event => setDraft(current => ({ ...current, kind: event.target.value as typeof current.kind }))} className="h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm">
                <option value="announcement">HAIDRONICS announcement</option>
                <option value="instagram">Instagram post</option>
                <option value="youtube">YouTube post / video</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-black/50">Title</span>
              <input maxLength={160} value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} placeholder="New ESP32 stock has arrived" className="h-11 w-full rounded-md border border-black/15 px-3 text-sm" />
            </label>
            <label>
              <span className="mb-1.5 block font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-black/50">{draft.kind === "announcement" ? "Update details" : "Post caption / contents"}</span>
              <textarea maxLength={1000} rows={4} value={draft.body} onChange={event => setDraft(current => ({ ...current, body: event.target.value }))} placeholder={draft.kind === "announcement" ? "Tell customers what is new..." : "Paste the caption or summarize what this post shows..."} className="w-full rounded-md border border-black/15 p-3 text-sm" />
              <span className="mt-1 block text-right font-mono text-[9px] text-black/35">{draft.body.length}/1000</span>
            </label>
            {draft.kind !== "announcement" && (
              <label>
                  <span className="mb-1.5 block font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-black/50">Post URL</span>
                  <input type="url" value={draft.url} onChange={event => setDraft(current => ({ ...current, url: event.target.value }))} placeholder={draft.kind === "instagram" ? "https://www.instagram.com/p/..." : "https://www.youtube.com/watch?v=..."} className="h-11 w-full rounded-md border border-black/15 px-3 text-sm" />
              </label>
            )}
            <label>
              <span className="mb-1.5 block font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-black/50">Banner image URL (optional if you upload below)</span>
              <input type="url" value={draft.imageUrl} onChange={event => setDraft(current => ({ ...current, imageUrl: event.target.value }))} placeholder="https://..." className="h-11 w-full rounded-md border border-black/15 px-3 text-sm" />
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-black/20 bg-black/[0.02] px-4 py-3 text-center font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-black/65 transition-colors hover:border-orange-500/50 hover:bg-orange-50">
              {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} className="text-orange-600" />}
              {uploadingImage ? "Uploading artwork…" : "Upload banner image (JPG / PNG / WebP, max 5 MB)"}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPostImage} disabled={uploadingImage} className="sr-only" />
            </label>
            {draft.imageUrl && (
              <div className="overflow-hidden rounded-lg border border-black/10 bg-[#111619]">
                <img src={draft.imageUrl} alt="Banner preview" className="aspect-[16/9] max-h-56 w-full object-cover" />
                <p className="px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-white/55">Homepage banner preview</p>
              </div>
            )}
          </div>
          <button type="button" disabled={saving || !draft.title.trim()} onClick={onAdd} className="mt-5 inline-flex items-center gap-2 rounded-md bg-orange-500 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black hover:bg-orange-400 disabled:opacity-50">
            {saving && <Loader2 size={13} className="animate-spin" />} Publish banner slide
          </button>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm md:p-6">
          <h3 className="font-display text-xl font-bold">Published & hidden updates ({updates.length})</h3>
          <div className="mt-4 grid gap-3">
            {updates.length ? updates.map(update => (
              <article key={update.id} className="flex items-start gap-3 rounded-lg border border-black/10 p-4">
                {update.imageUrl ? <img src={update.imageUrl} alt="" className="size-14 shrink-0 rounded object-cover" /> : <span className="grid size-14 shrink-0 place-items-center rounded bg-orange-50 text-orange-600"><Megaphone size={20} /></span>}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold">{update.title}</h4>
                    <span className={`rounded px-2 py-0.5 font-mono text-[8px] uppercase ${update.active ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/45"}`}>{update.active ? "Published" : "Hidden"}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-black/50">{update.body || update.url || update.kind}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-black/35">{update.kind}</p>
                </div>
                {update.active === 1 && <button type="button" onClick={() => onHide(update.id)} aria-label={`Hide ${update.title}`} className="rounded p-2 text-black/40 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>}
              </article>
            )) : <p className="rounded-lg border border-dashed border-black/15 p-6 text-center text-sm text-black/45">No updates yet. Publish a post or announcement to start.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Analytics({ data }: { data?: Array<{ event: string; createdAt: Date }> }) {
  const counts = (data || []).reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.event]: (acc[item.event] || 0) + 1 }), {});
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-600 font-semibold">Telemetry / Storefront</p>
      <h2 className="mt-1 font-display text-3xl font-bold">Customer Activity</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Total Tracked Events" value={String(data?.length || 0)} />
        <MetricCard label="WhatsApp Conversions" value={String(counts.whatsapp_click || 0)} accent="green" />
        <MetricCard label="Product Views" value={String(counts.product_view || 0)} accent="amber" />
      </div>
    </div>
  );
}

function Settings({
  settings,
  setSettings,
  onSave,
  saving,
}: {
  settings: SettingsForm;
  setSettings: React.Dispatch<React.SetStateAction<SettingsForm>>;
  onSave: () => void;
  saving: boolean;
}) {
  const fields: Array<[keyof SettingsForm, string]> = [
    ["businessName", "Business Name"],
    ["whatsappNumber", "Business WhatsApp Number (e.g. 918248453861)"],
    ["phone", "Direct Phone"],
    ["email", "Official Email"],
    ["instagramUrl", "Instagram Profile URL"],
    ["youtubeUrl", "YouTube Channel URL"],
    ["address", "Store / Dispatch Address"],
    ["businessHours", "Working Hours"],
    ["mapsUrl", "Google Maps Location URL"],
    ["shippingFee", "Standard Shipping Fee (INR)"],
  ];

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-600 font-semibold">System Configuration</p>
      <h2 className="mt-1 font-display text-3xl font-bold">Business Settings</h2>
      <div className="mt-6 max-w-2xl rounded-xl bg-white p-6 md:p-8 border border-black/10 shadow-sm">
        <div className="grid gap-4">
          {fields.map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">{label}</span>
              <input
                type={key === "email" ? "email" : key === "shippingFee" ? "number" : key.endsWith("Url") ? "url" : "text"}
                {...(key === "shippingFee" ? { min: 0, step: "0.01" } : {})}
                value={settings[key]}
                onChange={(e) => setSettings((cur) => ({ ...cur, [key]: key === "shippingFee" ? Number(e.target.value) : e.target.value }))}
                className="h-11 w-full rounded-md border border-black/15 bg-[#f7f8f8] px-3.5 text-sm text-black outline-none focus:border-orange-500 focus:bg-white"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-black px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {saving && <Loader2 size={13} className="animate-spin" />} Save Business Settings
        </button>
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent = "orange" }: { label: string; value: string; accent?: string }) {
  const color =
    accent === "red"
      ? "text-red-600"
      : accent === "green"
      ? "text-emerald-700"
      : accent === "amber"
      ? "text-amber-700"
      : "text-orange-600";
  return (
    <div className="rounded-lg border border-black/[0.08] bg-white p-5 shadow-sm">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/40 font-semibold">{label}</p>
      <p className={`mt-2 font-display text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function AddProductModal({
  product,
  categories,
  setProduct,
  onClose,
  onSave,
  saving,
  editing = false,
  uploadError,
}: {
  product: ProductDraft;
  categories: string[];
  setProduct: (value: React.SetStateAction<ProductDraft>) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  editing?: boolean;
  uploadError?: string;
}) {
  const update = (patch: Partial<ProductDraft>) =>
    setProduct((cur) => {
      const next = { ...(cur || product), ...patch } as ProductDraft;
      if (!editing && (patch.name !== undefined || patch.category !== undefined)) next.sku = suggestSku(next.category, next.name);
      return next;
    });

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selectedFiles.length) return;
    const remaining = 4 - product.images.length - product.photos.length;
    if (selectedFiles.length > remaining) {
      toast.error(`You can add ${remaining} more photo${remaining === 1 ? "" : "s"} (4 maximum).`);
    }
    const accepted = selectedFiles.slice(0, Math.max(0, remaining));
    const validFiles = accepted.filter((file) => {
      if (!isProductPhotoContentType(file.type)) {
        toast.error(`${file.name}: use a JPG, PNG, or WebP image.`);
        return false;
      }
      if (file.size > 5_000_000) {
        toast.error(`${file.name}: photos must be smaller than 5 MB.`);
        return false;
      }
      return true;
    });
    Promise.all(validFiles.map((file) => new Promise<ProductDraft["photos"][number]>((resolve, reject) => {
      if (!isProductPhotoContentType(file.type)) {
        reject(new Error(`${file.name}: use a JPG, PNG, or WebP image.`));
        return;
      }
      const contentType = file.type;
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string"
        ? resolve({ filename: file.name, contentType, base64: reader.result })
        : reject(new Error(`Could not read ${file.name}.`));
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    }))).then((photos) => update({ photos: [...product.photos, ...photos] })).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Could not read selected photos.");
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between border-b border-black/10 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-600 font-bold">Catalog Management</p>
            <h2 className="mt-1 font-display text-2xl font-bold">{editing ? "Edit Product" : "Add New Product"}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-black/40 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">Product Name *</span>
            <input
              value={product.name}
              onChange={(e) => update({ name: e.target.value })}
              className="h-11 w-full rounded-md border border-black/15 px-3 text-sm outline-none focus:border-orange-500"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">{editing ? "SKU" : "Auto-generated SKU"}</span>
              <input
                value={product.sku}
                readOnly={!editing}
                onChange={(e) => update({ sku: e.target.value })}
                className="h-11 w-full rounded-md border border-black/15 px-3 text-sm font-mono outline-none focus:border-orange-500"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">Price (INR) *</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={product.price}
                onChange={(e) => update({ price: e.target.value })}
                className="h-11 w-full rounded-md border border-black/15 px-3 text-sm font-mono outline-none focus:border-orange-500"
              />
            </label>
          </div>

          <div className="grid gap-3 rounded-md border border-black/10 bg-black/[.02] p-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={product.active} onChange={e => update({ active: e.target.checked })} className="accent-orange-500" /> Published and available in storefront</label>
            {editing && <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={!product.hidden} onChange={e => update({ hidden: !e.target.checked })} className="accent-orange-500" /> Visible in catalog</label>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">Category</span>
              <select
                value={product.category}
                onChange={(e) => update({ category: e.target.value })}
                className="h-11 w-full rounded-md border border-black/15 px-3 text-sm outline-none focus:border-orange-500 bg-white"
              >
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">Stock Status</span>
              <select
                value={product.stockStatus}
                onChange={(e) => update({ stockStatus: e.target.value as any })}
                className="h-11 w-full rounded-md border border-black/15 px-3 text-sm outline-none focus:border-orange-500 bg-white"
              >
                <option>In stock</option>
                <option>Limited</option>
                <option>Out of stock</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">Current Stock Count</span>
              <input
                type="number"
                value={product.stock}
                onChange={(e) => update({ stock: e.target.value })}
                className="h-11 w-full rounded-md border border-black/15 px-3 text-sm font-mono outline-none focus:border-orange-500"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">Low Stock Threshold</span>
              <input
                type="number"
                value={product.lowStockThreshold}
                onChange={(e) => update({ lowStockThreshold: e.target.value })}
                className="h-11 w-full rounded-md border border-black/15 px-3 text-sm font-mono outline-none focus:border-orange-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">Short Description</span>
            <input
              value={product.shortDescription}
              onChange={(e) => update({ shortDescription: e.target.value })}
              className="h-11 w-full rounded-md border border-black/15 px-3 text-sm outline-none focus:border-orange-500"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">Full Description</span>
            <textarea
              rows={3}
              value={product.description}
              onChange={(e) => update({ description: e.target.value })}
              className="w-full rounded-md border border-black/15 p-3 text-sm outline-none focus:border-orange-500"
            />
          </label>

          {/* Product photo gallery */}
          <div className="rounded-lg border border-dashed border-black/20 bg-[#f7f8f8] p-4">
            <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/60 font-bold">
              Product Photos · {product.images.length + product.photos.length}/4
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFiles}
              disabled={product.images.length + product.photos.length >= 4}
              className="block w-full text-xs text-black/60 file:mr-3 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:font-bold file:text-white hover:file:bg-orange-600"
            />
            <p className="mt-2 font-mono text-[9px] text-black/45">Add up to four JPG, PNG, or WebP images (5 MB each). The first photo is the catalog cover.</p>
            {(product.images.length > 0 || product.photos.length > 0) && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {product.images.map((url, index) => (
                  <div key={`saved-${url}-${index}`} className="relative aspect-square overflow-hidden rounded-md border border-black/15">
                    <img src={url} alt={`Product photo ${index + 1}`} className="size-full object-cover" />
                    <button type="button" onClick={() => update({ images: product.images.filter((_, i) => i !== index) })} aria-label={`Remove photo ${index + 1}`} className="absolute right-1 top-1 rounded-full bg-black/75 p-1 text-white"><X size={12} /></button>
                    {index === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/70 py-1 text-center font-mono text-[8px] uppercase text-white">Cover</span>}
                  </div>
                ))}
                {product.photos.map((photo, index) => (
                  <div key={`new-${photo.filename}-${index}`} className="relative aspect-square overflow-hidden rounded-md border border-orange-500/40">
                    <img src={photo.base64} alt={`New product photo ${product.images.length + index + 1}`} className="size-full object-cover" />
                    <button type="button" onClick={() => update({ photos: product.photos.filter((_, i) => i !== index) })} aria-label={`Remove new photo ${index + 1}`} className="absolute right-1 top-1 rounded-full bg-black/75 p-1 text-white"><X size={12} /></button>
                    {product.images.length + index === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/70 py-1 text-center font-mono text-[8px] uppercase text-white">Cover</span>}
                  </div>
                ))}
              </div>
            )}
            {uploadError && <p role="alert" className="mt-2 text-xs text-red-700">{uploadError}</p>}
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-black/10 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2.5 font-mono text-[10px] uppercase text-black/60">
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !product.name || !product.price}
            className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-6 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black hover:bg-orange-400 disabled:opacity-50"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {editing ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddComboModal({
  combo,
  setCombo,
  products,
  onClose,
  onSave,
  saving,
}: {
  combo: { name: string; tagline: string; description: string; price: string; productSlugs: string[] };
  setCombo: React.Dispatch<React.SetStateAction<{ name: string; tagline: string; description: string; price: string; productSlugs: string[] }>>;
  products: Product[];
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const toggle = (slug: string) => {
    setCombo((cur) => ({
      ...cur,
      productSlugs: cur.productSlugs.includes(slug)
        ? cur.productSlugs.filter((s) => s !== slug)
        : [...cur.productSlugs, slug],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between border-b border-black/10 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-600 font-bold">Bundle Builder</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Create Combo Kit</h2>
          </div>
          <button type="button" onClick={onClose} className="text-black/40 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">Kit Name *</span>
            <input
              value={combo.name}
              onChange={(e) => setCombo({ ...combo, name: e.target.value })}
              placeholder="e.g. IoT Starter Pack"
              className="h-11 w-full rounded-md border border-black/15 px-3 text-sm outline-none focus:border-orange-500"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">Bundle Price (INR) *</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={combo.price}
                onChange={(e) => setCombo({ ...combo, price: e.target.value })}
                className="h-11 w-full rounded-md border border-black/15 px-3 text-sm font-mono outline-none focus:border-orange-500"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">Tagline</span>
              <input
                value={combo.tagline}
                onChange={(e) => setCombo({ ...combo, tagline: e.target.value })}
                placeholder="e.g. ESP32 + OLED + Relay"
                className="h-11 w-full rounded-md border border-black/15 px-3 text-sm outline-none focus:border-orange-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">Description</span>
            <textarea
              rows={2}
              value={combo.description}
              onChange={(e) => setCombo({ ...combo, description: e.target.value })}
              className="w-full rounded-md border border-black/15 p-3 text-sm outline-none focus:border-orange-500"
            />
          </label>

          <div>
            <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.13em] text-black/50 font-semibold">
              Select Included Components ({combo.productSlugs.length} selected)
            </span>
            <div className="grid max-h-48 gap-1.5 overflow-y-auto rounded-md border border-black/10 bg-[#f7f8f8] p-2">
              {products.map((p) => (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center gap-3 rounded p-2 text-xs transition-colors ${
                    combo.productSlugs.includes(p.id) ? "bg-orange-100 font-semibold" : "hover:bg-black/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={combo.productSlugs.includes(p.id)}
                    onChange={() => toggle(p.id)}
                    className="size-4 accent-orange-500"
                  />
                  <span>{p.name}</span>
                  <span className="ml-auto font-mono text-black/40">{formatINR(p.price)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-black/10 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2.5 font-mono text-[10px] uppercase text-black/60">
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !combo.name || !combo.price || combo.productSlugs.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-6 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black hover:bg-orange-400 disabled:opacity-50"
          >
            {saving && <Loader2 size={13} className="animate-spin" />} Publish Combo Kit
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerStoriesAdmin({
  stories,
  onAdd,
  onDelete,
}: {
  stories: CustomerStoryAdmin[];
  onAdd: () => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-600 font-semibold">Storefront Proof</p>
          <h2 className="mt-1 font-display text-3xl font-bold">Builds in the Wild ({stories.length})</h2>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => (
          <div key={story.id} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="font-display text-lg font-bold">{story.title}</h3>
            <p className="mt-1 text-xs text-black/50">{story.customerName}</p>
            <p className="mt-2 text-sm text-black/70">{story.caption}</p>
            <button
              type="button"
              onClick={() => onDelete(story.id)}
              className="mt-4 font-mono text-[9px] uppercase tracking-wider text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoiceModal({
  order,
  settings,
  onClose,
}: {
  order: any;
  settings: SettingsForm;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl text-black my-8 border border-black/10">
        {/* Printable Invoice Header */}
        <div className="flex items-start justify-between border-b border-black/15 pb-6">
          <div className="flex items-center gap-3">
            <img src={logoIconImage} alt="HAIDRONICS" className="size-12 rounded-lg object-contain bg-[#111416] p-1.5" />
            <div>
              <h1 className="font-display text-2xl font-bold tracking-wider">HAIDRONICS</h1>
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-orange-600 font-bold">Where Engineering Starts</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-bold text-orange-700">{order.invoiceId || `INV-${order.id}`}</p>
            <p className="font-mono text-[10px] text-black/50">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            <span className="mt-1 inline-block rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 font-mono text-[9px] font-bold uppercase">
              Paid / Verified
            </span>
          </div>
        </div>

        {/* Billed To / From */}
        <div className="mt-6 grid grid-cols-2 gap-6 text-xs">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-wider text-black/40 font-bold">Billed To:</p>
            <p className="mt-1 font-bold text-sm text-black">{order.customerName}</p>
            <p className="mt-0.5 text-black/70">Phone: {order.phone}</p>
            <p className="mt-0.5 text-black/70 leading-relaxed">{order.address}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-wider text-black/40 font-bold">Issued By:</p>
            <p className="mt-1 font-bold text-sm text-black">HAIDRONICS</p>
            <p className="mt-0.5 text-black/70">WhatsApp: +91 8248453861</p>
            <p className="mt-0.5 text-black/70">contact@haidronics.com</p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-y border-black/15 bg-[#fafafa] font-mono text-[9px] uppercase tracking-wider text-black/50">
              <tr>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06]">
              {(order.items || []).map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 font-medium">{item.productName}</td>
                  <td className="py-2.5 px-3 font-mono text-black/50">{item.sku}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatINR(item.unitPrice)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold">{formatINR(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Calculation */}
        <div className="mt-6 flex justify-end border-t border-black/15 pt-4">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-black/60">
              <span>Items Subtotal:</span>
              <span className="font-mono">{formatINR(order.subtotal || order.total - 50)}</span>
            </div>
            <div className="flex justify-between text-black/60">
              <span>Shipping & Handling:</span>
              <span className="font-mono">{formatINR(order.shipping || 50)}</span>
            </div>
            <div className="flex justify-between border-t border-black/15 pt-2 text-base font-bold text-black font-mono">
              <span>Total Amount:</span>
              <span className="text-orange-700">{formatINR(order.finalAmount || order.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-4 print:hidden">
          <span className="text-xs text-black/40 font-mono">H-Invoice System Output</span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-md bg-black px-4 py-2 font-mono text-[10px] font-bold uppercase text-white hover:bg-orange-600"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-black/20 px-4 py-2 font-mono text-[10px] uppercase text-black/60 hover:bg-black/5"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
