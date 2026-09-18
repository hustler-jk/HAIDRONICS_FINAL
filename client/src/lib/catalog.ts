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

export const heroImage = "/manus-storage/haidronics-circuit-hero_4fdc732d.jpg";
export const logoImage = "/manus-storage/haidronics-logo_51ad85ad.png";
export const logoIconImage = "/manus-storage/haidronics-icon_0c53ca1d.png";

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

export function whatsappLink(message: string) {
  const number = whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function productEnquiry(product: Product) {
  return `Order Enquiry – HAIDRONICS\n\nI am interested in:\n${product.name}\nSKU: ${product.sku}\n\nPlease confirm availability, final price, shipping charges, payment details, and delivery information.`;
}

export function cartMessage(items: CartItem[], customer?: { name: string; phone: string; address: string }) {
  const lines = items.map((item, index) => `${index + 1}. ${item.name} (${item.sku}) × ${item.quantity} — ${formatINR(item.price * item.quantity)}`);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const customerBlock = customer ? `Customer name: ${customer.name}\nPhone / WhatsApp: ${customer.phone}\nDelivery address: ${customer.address}\n\n` : "";
  return `Order Enquiry – HAIDRONICS\n\n${customerBlock}Components requested:\n${lines.join("\n")}\n\nEstimated Total: ${formatINR(total)}\n\nPlease confirm availability, final price, shipping charges, payment details, and delivery information.`;
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
  return source
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => ({ candidate, score: (candidate.category === product.category ? 3 : 0) + candidate.tags.filter((tag) => product.tags.includes(tag)).length }))
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
