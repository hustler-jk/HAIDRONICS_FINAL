export type Product = {
  id: string;
  dbId?: number;
  name: string;
  sku: string;
  price: number;
  shortDescription: string;
  description: string;
  category: string;
  tags: string[];
  accent: string;
  image: string;
  imageUrl?: string;
  stockStatus?: string;
  stock?: number;
  lowStockThreshold?: number;
  specs: { label: string; value: string }[];
  featured?: boolean;
};

export type CartItem = Product & { quantity: number };

export type ComboKit = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  featured: boolean;
  items: { productSlug: string; quantity: number }[];
};

export const heroImage = "/haidronics-logo.png";
export const logoImage = "/haidronics-logo.png";
export const logoIconImage = "/haidronics-icon.png";

export const products: Product[] = [
  {
    id: "esp32-devkit",
    name: "ESP32 DevKit V1",
    sku: "HD-ESP32-001",
    price: 399,
    shortDescription: "Wi-Fi + Bluetooth development board for connected builds.",
    description: "A capable, compact development board for IoT prototypes, automation builds, sensor networks, and connected experiments.",
    category: "Development boards",
    tags: ["esp32", "wifi", "bluetooth", "iot", "microcontroller"],
    accent: "#ff6b1a",
    image: "board",
    featured: true,
    specs: [
      { label: "Microcontroller", value: "ESP32-WROOM-32" },
      { label: "Connectivity", value: "Wi-Fi + Bluetooth" },
      { label: "USB", value: "Micro USB" },
      { label: "Logic", value: "3.3V" },
    ],
  },
  {
    id: "oled-096",
    name: "0.96 inch OLED Display",
    sku: "HD-OLED-096",
    price: 129,
    shortDescription: "Crisp I2C display for compact dashboards and prototypes.",
    description: "A bright monochrome OLED module that makes quick sensor readouts and portable interfaces easy to build.",
    category: "Displays",
    tags: ["oled", "display", "i2c", "ssd1306"],
    accent: "#35c6b3",
    image: "oled",
    featured: true,
    specs: [
      { label: "Resolution", value: "128 × 64" },
      { label: "Interface", value: "I2C" },
      { label: "Driver", value: "SSD1306" },
      { label: "Voltage", value: "3.3V – 5V" },
    ],
  },
  {
    id: "dht11",
    name: "DHT11 Temperature Sensor",
    sku: "HD-DHT11-011",
    price: 79,
    shortDescription: "A beginner-friendly temperature and humidity sensor module.",
    description: "A simple digital sensor for learning environments, climate monitors, plant projects, and first IoT builds.",
    category: "Sensors",
    tags: ["temperature", "humidity", "sensor", "dht11"],
    accent: "#efb02d",
    image: "sensor",
    featured: true,
    specs: [
      { label: "Temperature", value: "0°C – 50°C" },
      { label: "Humidity", value: "20% – 90% RH" },
      { label: "Interface", value: "Single-wire digital" },
      { label: "Use case", value: "Learning + prototypes" },
    ],
  },
  {
    id: "arduino-uno",
    name: "Arduino UNO R3",
    sku: "HD-UNO-R3",
    price: 499,
    shortDescription: "The familiar starting point for classroom and prototype work.",
    description: "A dependable microcontroller board for learning embedded systems, controlling modules, and getting ideas moving.",
    category: "Development boards",
    tags: ["arduino", "uno", "atmega328p", "microcontroller"],
    accent: "#ec5a42",
    image: "uno",
    featured: true,
    specs: [
      { label: "Microcontroller", value: "ATmega328P" },
      { label: "Digital I/O", value: "14 pins" },
      { label: "Analog inputs", value: "6 pins" },
      { label: "USB", value: "Type-B" },
    ],
  },
  {
    id: "ultrasonic",
    name: "HC-SR04 Ultrasonic Sensor",
    sku: "HD-HCSR04-004",
    price: 99,
    shortDescription: "Non-contact distance sensing for robotics and automation.",
    description: "A classic ultrasonic module for obstacle detection, tank levels, robotics experiments, and interactive builds.",
    category: "Sensors",
    tags: ["ultrasonic", "distance", "robotics", "hcsr04"],
    accent: "#8c7cff",
    image: "ultrasonic",
    specs: [
      { label: "Range", value: "2cm – 400cm" },
      { label: "Frequency", value: "40kHz" },
      { label: "Interface", value: "Trigger / Echo" },
      { label: "Voltage", value: "5V" },
    ],
  },
  {
    id: "relay-2ch",
    name: "2-Channel Relay Module",
    sku: "HD-RELAY-002",
    price: 149,
    shortDescription: "Switch lights, motors, and appliances from your controller.",
    description: "A practical two-channel relay board for automation prototypes and controller-to-load switching experiments.",
    category: "Modules",
    tags: ["relay", "automation", "switch", "module"],
    accent: "#ff873b",
    image: "relay",
    specs: [
      { label: "Channels", value: "2" },
      { label: "Coil voltage", value: "5V" },
      { label: "Contact rating", value: "10A" },
      { label: "Trigger", value: "Logic input" },
    ],
  },
];

export const formatINR = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export const whatsappNumber = "918248453861";

export function normalizeWhatsappNumber(raw?: string): string {
  if (!raw) return whatsappNumber;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return whatsappNumber;
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

export function whatsappLink(message: string, configuredNumber?: string) {
  const number = normalizeWhatsappNumber(configuredNumber);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function productEnquiry(product: Product) {
  return `⚡ *HAIDRONICS Product Enquiry*\n\n` +
    `*Product:* ${product.name}\n` +
    `*SKU:* ${product.sku}\n` +
    `*Category:* ${product.category}\n` +
    `*Price:* ${formatINR(product.price)}\n\n` +
    `Please confirm availability, shipping details, and how to proceed with payment.`;
}

export function cartMessage(items: CartItem[], customer?: { name: string; phone: string; address: string }, orderNumber?: string) {
  const lines = items.map((item, index) => `${index + 1}. *${item.name}* (${item.sku})\n   Qty: ${item.quantity} × ${formatINR(item.price)} = ${formatINR(item.price * item.quantity)}`);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 50;
  const total = subtotal + shipping;
  const orderHeader = orderNumber ? `*Order Ref:* ${orderNumber}\n` : "";
  const customerBlock = customer
    ? `\n👤 *Customer Details:*\n` +
      `• Name: ${customer.name}\n` +
      `• Phone: ${customer.phone}\n` +
      `• Address: ${customer.address}\n`
    : "";

  return `📦 *HAIDRONICS Order Request*\n${orderHeader}${customerBlock}\n` +
    `🛒 *Items Ordered:*\n${lines.join("\n")}\n\n` +
    `────────────────────────\n` +
    `• Subtotal: ${formatINR(subtotal)}\n` +
    `• Estimated Shipping: ${formatINR(shipping)}\n` +
    `• *Total Payable: ${formatINR(total)}*\n` +
    `────────────────────────\n\n` +
    `Please verify component availability and provide payment details (UPI / Bank Transfer) to confirm this order.`;
}

export function findProduct(id: string) {
  return products.find((product) => product.id === id);
}

export function normalizeApiProducts(rows: Array<Record<string, unknown>> | undefined) {
  if (!rows?.length) return [];
  return rows.map((row, index): Product => {
    const rawSpecs = typeof row.specs === "string" ? row.specs : "[]";
    const rawTags = typeof row.tags === "string" ? row.tags : "";
    let specs: Product["specs"] = [];
    try { specs = JSON.parse(rawSpecs); } catch { specs = []; }
    return {
      id: String(row.slug || row.id || `product-${index}`),
      dbId: typeof row.id === "number" ? row.id : undefined,
      imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : undefined,
      stockStatus: String(row.stockStatus || "In stock"),
      stock: Number(row.stock || 0),
      lowStockThreshold: Number(row.lowStockThreshold || 5),
      name: String(row.name || "Untitled component"),
      sku: String(row.sku || "HD-CATALOG"),
      price: Number(row.price || 0),
      shortDescription: String(row.shortDescription || "Catalog component."),
      description: String(row.description || row.shortDescription || "Catalog component."),
      category: String(row.category || "Components"),
      tags: rawTags.split(",").map((tag) => tag.trim()).filter(Boolean),
      accent: "#ff6417",
      image: String(row.slug || "").includes("oled") ? "oled" : String(row.slug || "").includes("dht") ? "sensor" : String(row.slug || "").includes("arduino") ? "uno" : String(row.slug || "").includes("ultrasonic") ? "ultrasonic" : String(row.slug || "").includes("relay") ? "relay" : "board",
      featured: Number(row.featured || 0) === 1,
      specs,
    };
  });
}

export function normalizeApiComboKits(rows: Array<Record<string, unknown>> | undefined) {
  if (!rows?.length) return [];
  return rows.map((row): ComboKit => ({
    id: Number(row.id || 0),
    slug: String(row.slug || "combo-kit"),
    name: String(row.name || "Combo kit"),
    tagline: String(row.tagline || "A practical starting bundle."),
    description: String(row.description || "A curated set of parts for a focused build."),
    price: Number(row.price || 0),
    featured: Number(row.featured || 0) === 1,
    items: Array.isArray(row.items) ? row.items.map((item) => {
      const value = item as Record<string, unknown>;
      return { productSlug: String(value.productSlug || ""), quantity: Number(value.quantity || 1) };
    }) : [],
  }));
}

export function recommendedProducts(product: Product, source: Product[]) {
  // Complementary category pairings (e.g. dev boards pair with displays, sensors, modules)
  const complementaryCategories: Record<string, string[]> = {
    "Development boards": ["Displays", "Sensors", "Modules"],
    "Sensors": ["Development boards", "Displays", "Modules"],
    "Displays": ["Development boards", "Sensors", "Modules"],
    "Modules": ["Development boards", "Sensors", "Displays"],
  };

  const preferred = complementaryCategories[product.category] || [];

  return source
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => {
      let score = 0;
      if (preferred.includes(candidate.category)) score += 5;
      if (candidate.category === product.category) score += 2;
      score += candidate.tags.filter((tag) => product.tags.includes(tag)).length * 2;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ candidate }) => candidate);
}

export function mergeProductSources(primary: Product[], fallback: Product[]) {
  const merged = new Map<string, Product>();
  primary.forEach((product) => merged.set(product.id, product));
  fallback.forEach((product) => { if (!merged.has(product.id)) merged.set(product.id, product); });
  return Array.from(merged.values());
}

export const categories = ["All", "Development boards", "Sensors", "Displays", "Modules"];
