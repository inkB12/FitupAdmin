export type SidebarItem = {
  label: string;
  href: string;
  key:
    | "dashboard"
    | "users"
    | "trainers"
    | "packages"
    | "transactions"
    | "payment-history"
    | "bookings"
    | "conversion-rates";
};

export type KpiItem = {
  title: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: "users" | "calendar" | "wallet" | "activity";
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  plan: string;
  joinedAt: string;
  status: "active" | "paused";
};

export type TrainerRow = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  sessions: number;
  status: "available" | "busy";
};

export type TransactionRow = {
  id: string;
  customer: string;
  packageName: string;
  amount: string;
  paidAt: string;
  status: "paid" | "refunded";
};

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", key: "dashboard" },
  { label: "Users", href: "/users", key: "users" },
  { label: "Trainers", href: "/trainers", key: "trainers" },
  { label: "Premium Management", href: "/packages", key: "packages" },
  { label: "Service Payment", href: "/transactions", key: "transactions" },
  { label: "Payment History", href: "/payment-history", key: "payment-history" },
  { label: "Bookings", href: "/bookings", key: "bookings" },
  { label: "Conversion Rates", href: "/conversion-rates", key: "conversion-rates" },
];

export const DASHBOARD_KPIS: KpiItem[] = [
  {
    title: "Total Users",
    value: "124,592",
    delta: "+8.3% from last month",
    trend: "up",
    icon: "users",
  },
  {
    title: "PT Sessions Today",
    value: "438",
    delta: "+5.1% from yesterday",
    trend: "up",
    icon: "calendar",
  },
  {
    title: "Monthly Revenue",
    value: "$186,420",
    delta: "+11.7% from last month",
    trend: "up",
    icon: "wallet",
  },
  {
    title: "Refund Rate",
    value: "1.9%",
    delta: "-0.4% from last month",
    trend: "down",
    icon: "activity",
  },
];

export const USERS: UserRow[] = [
  {
    id: "U-1001",
    name: "Minh T.",
    email: "minh.t@example.com",
    plan: "Optimize",
    joinedAt: "2026-03-09",
    status: "active",
  },
  {
    id: "U-1002",
    name: "Linh P.",
    email: "linh.p@example.com",
    plan: "Premium",
    joinedAt: "2026-03-08",
    status: "paused",
  },
  {
    id: "U-1003",
    name: "Huy N.",
    email: "huy.n@example.com",
    plan: "Basic",
    joinedAt: "2026-03-07",
    status: "active",
  },
  {
    id: "U-1004",
    name: "Trang V.",
    email: "trang.v@example.com",
    plan: "Optimize",
    joinedAt: "2026-03-06",
    status: "active",
  },
  {
    id: "U-1005",
    name: "Bao K.",
    email: "bao.k@example.com",
    plan: "Premium",
    joinedAt: "2026-03-05",
    status: "paused",
  },
];

export const TRAINERS: TrainerRow[] = [
  {
    id: "T-301",
    name: "Alex Nguyen",
    specialty: "Strength & Conditioning",
    rating: 4.9,
    sessions: 214,
    status: "available",
  },
  {
    id: "T-302",
    name: "Sarah Tran",
    specialty: "Mobility & Yoga",
    rating: 4.8,
    sessions: 179,
    status: "busy",
  },
  {
    id: "T-303",
    name: "Khanh Le",
    specialty: "Fat Loss",
    rating: 4.7,
    sessions: 162,
    status: "available",
  },
];

export const TRANSACTIONS: TransactionRow[] = [
  {
    id: "TX-5501",
    customer: "Minh T.",
    packageName: "Optimize",
    amount: "$39",
    paidAt: "2026-03-12 08:21",
    status: "paid",
  },
  {
    id: "TX-5502",
    customer: "Linh P.",
    packageName: "Premium",
    amount: "$69",
    paidAt: "2026-03-12 09:40",
    status: "paid",
  },
  {
    id: "TX-5503",
    customer: "Bao K.",
    packageName: "Premium",
    amount: "$69",
    paidAt: "2026-03-12 10:04",
    status: "refunded",
  },
  {
    id: "TX-5504",
    customer: "Trang V.",
    packageName: "Optimize",
    amount: "$39",
    paidAt: "2026-03-12 10:15",
    status: "paid",
  },
];
