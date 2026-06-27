/**
 * Seed the database with realistic gadget-retail demo data:
 * an admin user, products, customers, segments, and campaigns (some already
 * "sent" with a generated delivery log + metrics).
 *
 * Run with:  npm run seed
 *
 * Imports use relative paths (not the "@/" alias) so the script runs standalone
 * under tsx without needing Next.js path resolution.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/User";
import { Customer } from "../src/models/Customer";
import { Product } from "../src/models/Product";
import { Segment } from "../src/models/Segment";
import { Campaign } from "../src/models/Campaign";
import { Message } from "../src/models/Message";
import { simulateStatus, type MessageStatus } from "../src/lib/simulate";
import type { CampaignChannel } from "../src/lib/constants";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("✗ MONGODB_URI is not set. Check your .env.local file.");
  process.exit(1);
}

const ADMIN = {
  name: "Gift Benson",
  email: "gift@giftgadget.com",
  password: "password123",
};

const PRODUCTS = [
  { name: "iPhone 15 Pro", category: "Smartphones", brand: "Apple", price: 1450000, stock: 12, description: "A17 Pro chip, titanium design, 256GB." },
  { name: "Samsung Galaxy S24 Ultra", category: "Smartphones", brand: "Samsung", price: 1350000, stock: 9, description: "Galaxy AI, 200MP camera, S Pen." },
  { name: "Tecno Camon 30", category: "Smartphones", brand: "Tecno", price: 320000, stock: 25, description: "Budget flagship with great battery life." },
  { name: "MacBook Air M3", category: "Laptops", brand: "Apple", price: 1700000, stock: 7, description: "13-inch, M3 chip, 16GB RAM." },
  { name: "Dell XPS 13", category: "Laptops", brand: "Dell", price: 1250000, stock: 6, description: "Ultraportable, Intel Core Ultra 7." },
  { name: "iPad Air 11\"", category: "Tablets", brand: "Apple", price: 980000, stock: 10, description: "M2 chip, Liquid Retina display." },
  { name: "Apple Watch Series 9", category: "Smartwatches", brand: "Apple", price: 560000, stock: 14, description: "Double tap, brighter display." },
  { name: "Sony WH-1000XM5", category: "Headphones & Audio", brand: "Sony", price: 480000, stock: 18, description: "Industry-leading noise cancellation." },
  { name: "AirPods Pro 2", category: "Headphones & Audio", brand: "Apple", price: 350000, stock: 30, description: "Adaptive audio, USB-C." },
  { name: "PlayStation 5 Slim", category: "Gaming", brand: "Sony", price: 850000, stock: 5, description: "Disc edition, 1TB." },
  { name: "Canon EOS R50", category: "Cameras", brand: "Canon", price: 920000, stock: 4, description: "24.2MP mirrorless, 4K video." },
  { name: "Anker 65W GaN Charger", category: "Accessories", brand: "Anker", price: 45000, stock: 50, description: "Compact fast charger." },
];

const LOCATIONS = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano"];
const SOURCES = ["Walk-in", "Website", "Instagram", "WhatsApp", "Referral", "Facebook"];
const CATS = ["Smartphones", "Laptops", "Tablets", "Smartwatches", "Headphones & Audio", "Gaming", "Cameras", "Accessories"];

const FIRST = ["Chidi", "Amara", "Tunde", "Ngozi", "Emeka", "Fatima", "Bola", "Ifeoma", "Musa", "Zainab", "Yusuf", "Chioma", "David", "Grace", "Samuel", "Blessing", "Ahmed", "Funke", "Peter", "Aisha"];
const LAST = ["Okafor", "Bello", "Adeyemi", "Eze", "Ibrahim", "Nwosu", "Lawal", "Okoro", "Abubakar", "Olawale", "Mohammed", "Uche", "Johnson", "Adebayo", "Obi", "Yakubu", "Williams", "Chukwu", "Sani", "Balogun"];

/** Deterministic pick so reseeding produces the same dataset. */
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

async function main() {
  console.log("→ Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI as string);
  console.log("✓ Connected:", mongoose.connection.name);

  console.log("→ Clearing existing data…");
  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    Product.deleteMany({}),
    Segment.deleteMany({}),
    Campaign.deleteMany({}),
    Message.deleteMany({}),
  ]);

  // Admin user
  const passwordHash = await bcrypt.hash(ADMIN.password, 10);
  const admin = await User.create({
    name: ADMIN.name,
    email: ADMIN.email,
    passwordHash,
    role: "admin",
  });
  console.log("✓ Admin user:", ADMIN.email, "/", ADMIN.password);

  // Products
  const products = await Product.insertMany(PRODUCTS);
  console.log(`✓ ${products.length} products`);

  // Customers — varied interests, locations, spend.
  const customers = [];
  for (let i = 0; i < 24; i++) {
    const name = `${pick(FIRST, i)} ${pick(LAST, i * 3)}`;
    const interests = [pick(CATS, i), pick(CATS, i * 2 + 1)].filter(
      (v, idx, a) => a.indexOf(v) === idx
    );
    customers.push({
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      phone: `080${(30000000 + i * 137911).toString().slice(0, 8)}`,
      location: pick(LOCATIONS, i),
      interests,
      tags: i % 4 === 0 ? ["VIP"] : [],
      totalSpend: (i % 6) * 180000 + (i % 3) * 90000,
      source: pick(SOURCES, i),
      lastPurchaseAt: i % 2 === 0 ? new Date(2026, 4, (i % 27) + 1) : null,
    });
  }
  const createdCustomers = await Customer.insertMany(customers);
  console.log(`✓ ${createdCustomers.length} customers`);

  // Segments
  const segments = await Segment.insertMany([
    {
      name: "Smartphone enthusiasts",
      description: "Customers interested in smartphones.",
      rules: [{ field: "interests", operator: "eq", value: "Smartphones" }],
    },
    {
      name: "Lagos high-value buyers",
      description: "Lagos customers who have spent ₦200k+.",
      rules: [
        { field: "location", operator: "eq", value: "Lagos" },
        { field: "totalSpend", operator: "gte", value: 200000 },
      ],
    },
    {
      name: "Laptop shoppers",
      description: "Customers interested in laptops.",
      rules: [{ field: "interests", operator: "eq", value: "Laptops" }],
    },
    {
      name: "Audio lovers",
      description: "Headphones & audio fans.",
      rules: [
        { field: "interests", operator: "eq", value: "Headphones & Audio" },
      ],
    },
  ]);
  console.log(`✓ ${segments.length} segments`);

  const [smartphoneSeg, lagosSeg, , audioSeg] = segments;

  // Helper: audience for a segment (mirrors lib/segments rule evaluation for the
  // simple rules used above).
  async function audienceFor(seg: (typeof segments)[number]) {
    const and = seg.rules.map(
      (r: { field: string; operator: string; value: unknown }) => {
        if (r.field === "interests") return { interests: r.value };
        if (r.field === "totalSpend")
          return { totalSpend: { [`$${r.operator}`]: Number(r.value) } };
        return { [r.field]: r.value };
      }
    );
    return Customer.find(and.length ? { $and: and } : {}).lean();
  }

  // Campaigns — two sent (with delivery logs), one draft, one scheduled.
  const sentCampaignDefs = [
    {
      name: "iPhone 15 Pro Launch",
      channel: "email" as CampaignChannel,
      segment: smartphoneSeg,
      subject: "🚀 The iPhone 15 Pro has landed at Gift Gadget!",
      body: "Be among the first in Nigeria to own the titanium iPhone 15 Pro. Pre-order today and get a free AirPods case. Limited stock available!",
      products: [products[0]._id, products[1]._id],
    },
    {
      name: "Weekend Audio Sale",
      channel: "sms" as CampaignChannel,
      segment: audioSeg,
      subject: "Weekend Audio Sale — up to 20% off",
      body: "This weekend only: 20% off Sony & Apple headphones at Gift Gadget. Reply STORE for directions.",
      products: [products[7]._id, products[8]._id],
    },
    {
      name: "Lagos VIP Upgrade Offer",
      channel: "email" as CampaignChannel,
      segment: lagosSeg,
      subject: "An exclusive upgrade offer for our Lagos VIPs",
      body: "As a valued customer, enjoy priority access to the latest MacBook Air M3 with free delivery within Lagos.",
      products: [products[3]._id],
    },
  ];

  for (const def of sentCampaignDefs) {
    const audience = await audienceFor(def.segment);
    const campaign = await Campaign.create({
      name: def.name,
      channel: def.channel,
      subject: def.subject,
      body: def.body,
      products: def.products,
      segment: def.segment._id,
      status: "sent",
      sentAt: new Date(2026, 5, 20),
      createdBy: admin._id,
    });

    const counts = { delivered: 0, opened: 0, clicked: 0 };
    const messages = audience.map((c) => {
      const status: MessageStatus = simulateStatus(
        def.channel,
        String(campaign._id),
        String(c._id)
      );
      counts.delivered += 1;
      if (status === "opened" || status === "clicked") counts.opened += 1;
      if (status === "clicked") counts.clicked += 1;
      return {
        campaign: campaign._id,
        customer: c._id,
        channel: def.channel,
        status,
        sentAt: campaign.sentAt,
      };
    });
    if (messages.length) await Message.insertMany(messages);
    campaign.metrics = {
      recipients: audience.length,
      delivered: counts.delivered,
      opened: counts.opened,
      clicked: counts.clicked,
    };
    await campaign.save();
    console.log(
      `  • ${def.name}: sent to ${audience.length} (${counts.opened} opened, ${counts.clicked} clicked)`
    );
  }

  await Campaign.create({
    name: "Festive Season Mega Sale",
    channel: "social",
    subject: "🎉 Festive Season Mega Sale is coming!",
    body: "Get ready for the biggest gadget sale of the year. Follow us for early-bird deals on phones, laptops and more.",
    products: [products[0]._id, products[3]._id, products[9]._id],
    segment: null,
    status: "draft",
    createdBy: admin._id,
  });

  await Campaign.create({
    name: "Laptop Back-to-School Promo",
    channel: "email",
    subject: "Back to school? Upgrade your laptop.",
    body: "Student-friendly prices on the Dell XPS 13 and MacBook Air. Schedule reminder set.",
    products: [products[3]._id, products[4]._id],
    segment: segments[2]._id,
    status: "scheduled",
    scheduledAt: new Date(2026, 7, 1),
    createdBy: admin._id,
  });
  console.log("✓ 5 campaigns (3 sent, 1 draft, 1 scheduled)");

  await mongoose.disconnect();
  console.log("\n✓ Seed complete. Log in with:");
  console.log(`  ${ADMIN.email} / ${ADMIN.password}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
