import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMediaQuery } from "@uidotdev/usehooks";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Eye,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  useOrdersStatistics,
  useTopSelling,
  useTopViewed,
  useCustomerBehavior,
  type OrderPeriod,
  type StatisticsCpv,
} from "@/lib/queries/statistics";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

// ─── Colour palette ───────────────────────────────────────────────────────────

const COLORS = {
  primary: "#6366f1",
  secondary: "#22d3ee",
  accent: "#f59e0b",
  danger: "#ef4444",
  success: "#10b981",
  muted: "#94a3b8",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAZN(value: number) {
  return `${value.toLocaleString("az-AZ", { maximumFractionDigits: 2 })} ₼`;
}

function formatDate(date: string, period: OrderPeriod) {
  if (period === "monthly") return date;
  try {
    return new Date(date).toLocaleDateString("az-AZ", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  sub?: string;
}

function StatCard({ title, value, icon, color, loading, sub }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p
            className="text-muted-foreground truncate text-xs sm:text-sm"
            title={title}
          >
            {title}
          </p>
          {loading ? (
            <div className="bg-muted mt-1 h-6 w-24 animate-pulse rounded" />
          ) : (
            <p
              className="truncate text-lg font-bold sm:text-2xl"
              title={String(value)}
            >
              {value}
            </p>
          )}
          {sub && !loading && (
            <p className="text-muted-foreground truncate text-xs">{sub}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Period selector ──────────────────────────────────────────────────────────

const PERIOD_VALUES: OrderPeriod[] = ["daily", "monthly"];

interface PeriodTabsProps {
  value: OrderPeriod;
  onChange: (v: OrderPeriod) => void;
}

function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  const { t } = useTranslation();

  const labels: Record<OrderPeriod, string> = {
    daily: t("daily"),
    monthly: t("monthly"),
  };

  return (
    <div className="bg-muted flex w-full rounded-lg p-1 text-sm sm:w-auto">
      {PERIOD_VALUES.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={
            value === p
              ? "bg-background flex-1 rounded-md px-2 py-1.5 font-medium shadow-sm transition-all sm:flex-none sm:px-3 sm:py-1"
              : "text-muted-foreground flex-1 rounded-md px-2 py-1.5 transition-all hover:text-foreground sm:flex-none sm:px-3 sm:py-1"
          }
        >
          {labels[p]}
        </button>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="bg-muted animate-pulse rounded-lg" style={{ height }} />
  );
}

// ─── Product list row ─────────────────────────────────────────────────────────

interface ProductRowProps {
  cpv: StatisticsCpv | null;
  value: string;
  valueClassName: string;
  sub: string;
  rank?: number;
}

function ProductRow({ cpv, value, valueClassName, sub, rank }: ProductRowProps) {
  return (
    <div className="hover:bg-muted/30 flex items-center gap-2 px-3 py-3 transition-colors sm:gap-3 sm:px-5">
      {rank !== undefined && (
        <span className="text-muted-foreground w-5 shrink-0 text-center text-sm font-semibold">
          {rank}
        </span>
      )}
      {cpv?.main_image ? (
        <img
          src={cpv.main_image}
          alt=""
          className="h-9 w-9 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
          <Package size={16} className="text-muted-foreground" />
        </div>
      )}
      <p className="min-w-0 flex-1 truncate text-sm font-medium">
        {cpv?.title ?? "—"}
      </p>
      <div className="shrink-0 text-right text-xs">
        <p className={`font-semibold ${valueClassName}`}>{value}</p>
        <p className="text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

// ─── Conversion rate bar ──────────────────────────────────────────────────────

interface RateBarProps {
  label: string;
  rate: number;
  color: string;
}

function RateBar({ label, rate, color }: RateBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{rate.toFixed(1)}%</span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

function DashboardPage() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(width<48rem)");

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo, setDateTo] = useState(today);
  const [period, setPeriod] = useState<OrderPeriod>("daily");

  const sharedFilters = { date_from: dateFrom, date_to: dateTo };

  const { data: ordersData, isLoading: ordersLoading } = useOrdersStatistics({
    ...sharedFilters,
    period,
  });
  const { data: topSelling, isLoading: topSellingLoading } = useTopSelling({
    ...sharedFilters,
    limit: 10,
  });
  const { data: topViewed, isLoading: topViewedLoading } = useTopViewed({
    ...sharedFilters,
    limit: 10,
  });
  const { data: behavior, isLoading: behaviorLoading } = useCustomerBehavior({
    ...sharedFilters,
    abandoned_limit: 10,
  });

  const orderChart = (ordersData?.chart ?? []).map((p) => ({
    ...p,
    date: formatDate(p.date, period),
  }));

  const labelOrderCount = t("order_count");
  const labelRevenue = t("revenue_azn");
  const labelNoData = t("no_data_found");

  const chartHeight = isMobile ? 220 : 280;
  const chartTickSize = isMobile ? 10 : 12;
  const areaChartMargin = isMobile
    ? { top: 4, right: 8, left: -16, bottom: 0 }
    : { top: 4, right: 16, left: 0, bottom: 0 };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{t("dashboard")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("store_general_statistics")}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:w-auto">
            <DatePicker
              value={dateFrom}
              onChange={(v) => v && setDateFrom(v)}
              placeholder={t("date_from")}
              className="w-full sm:w-38"
            />
            <span className="text-muted-foreground shrink-0 select-none">—</span>
            <DatePicker
              value={dateTo}
              onChange={(v) => v && setDateTo(v)}
              placeholder={t("date_to")}
              className="w-full sm:w-38"
            />
          </div>
          <PeriodTabs value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title={t("total_orders")}
          value={ordersData?.summary.total_orders ?? "—"}
          icon={<ShoppingCart size={22} />}
          color={COLORS.primary}
          loading={ordersLoading}
        />
        <StatCard
          title={t("total_revenue")}
          value={
            ordersData ? formatAZN(ordersData.summary.total_revenue) : "—"
          }
          icon={<DollarSign size={22} />}
          color={COLORS.success}
          loading={ordersLoading}
        />
        <StatCard
          title={t("quantity_sold")}
          value={ordersData?.summary.total_quantity ?? "—"}
          icon={<Package size={22} />}
          color={COLORS.accent}
          loading={ordersLoading}
        />
        <StatCard
          title={t("total_views")}
          value={behavior?.overview.total_views.toLocaleString() ?? "—"}
          icon={<Eye size={22} />}
          color={COLORS.secondary}
          loading={behaviorLoading}
        />
        <StatCard
          title={t("basket_adds")}
          value={behavior?.overview.total_basket_adds.toLocaleString() ?? "—"}
          icon={<ShoppingBag size={22} />}
          color={COLORS.primary}
          loading={behaviorLoading}
        />
        <StatCard
          title={t("view_to_order_rate")}
          value={
            behavior ? `${behavior.overview.view_to_order_rate.toFixed(1)}%` : "—"
          }
          icon={<TrendingUp size={22} />}
          color={COLORS.success}
          loading={behaviorLoading}
        />
      </div>

      {/* ── Orders chart ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-500" />
            {t("order_dynamics")}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {ordersLoading ? (
            <ChartSkeleton height={chartHeight} />
          ) : orderChart.length === 0 ? (
            <div className="text-muted-foreground flex h-[220px] items-center justify-center text-sm sm:h-[280px]">
              {labelNoData}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={chartHeight} minWidth={0}>
              <AreaChart
                data={orderChart}
                margin={areaChartMargin}
              >
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS.success}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.success}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS.primary}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.primary}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: chartTickSize }}
                  tickLine={false}
                  interval={isMobile ? "preserveStartEnd" : "preserveEnd"}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: chartTickSize }}
                  tickLine={false}
                  width={isMobile ? 28 : 60}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: chartTickSize }}
                  tickLine={false}
                  width={isMobile ? 36 : 60}
                  tickFormatter={(v) => `${v}₼`}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === labelRevenue)
                      return [formatAZN(Number(value)), name];
                    return [value, name];
                  }}
                />
                {!isMobile && <Legend />}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="order_count"
                  name={labelOrderCount}
                  stroke={COLORS.primary}
                  fill="url(#gradOrders)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name={labelRevenue}
                  stroke={COLORS.success}
                  fill="url(#gradRevenue)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Top selling + Top viewed ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top selling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              {t("top_selling_products")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topSellingLoading ? (
              <div className="p-6">
                <ChartSkeleton height={200} />
              </div>
            ) : (
              <div className="divide-border divide-y">
                {(topSelling ?? []).map((item, i) => (
                  <ProductRow
                    key={item.cpv?.id ?? i}
                    rank={i + 1}
                    cpv={item.cpv}
                    value={formatAZN(item.revenue)}
                    valueClassName="text-emerald-600"
                    sub={`${item.quantity_sold} ${t("pcs")}`}
                  />
                ))}
                {(topSelling ?? []).length === 0 && (
                  <p className="text-muted-foreground p-5 text-center text-sm">
                    {labelNoData}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top viewed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye size={18} className="text-cyan-500" />
              {t("top_viewed_products")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topViewedLoading ? (
              <div className="p-6">
                <ChartSkeleton height={200} />
              </div>
            ) : (
              <div className="divide-border divide-y">
                {(topViewed ?? []).map((item, i) => (
                  <ProductRow
                    key={item.cpv?.id ?? i}
                    rank={i + 1}
                    cpv={item.cpv}
                    value={item.view_count.toLocaleString()}
                    valueClassName="text-indigo-600"
                    sub={t("views")}
                  />
                ))}
                {(topViewed ?? []).length === 0 && (
                  <p className="text-muted-foreground p-5 text-center text-sm">
                    {labelNoData}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Customer behaviour ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Conversion rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown size={18} className="text-violet-500" />
              {t("customer_behavior")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {behaviorLoading ? (
              <ChartSkeleton height={160} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: t("total_views"),
                      value: behavior?.overview.total_views.toLocaleString(),
                      color: COLORS.secondary,
                    },
                    {
                      label: t("basket_adds"),
                      value: behavior?.overview.total_basket_adds.toLocaleString(),
                      color: COLORS.accent,
                    },
                    {
                      label: t("converted_baskets"),
                      value: behavior?.overview.converted_baskets.toLocaleString(),
                      color: COLORS.success,
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="rounded-lg border p-3 text-center sm:p-3"
                    >
                      <p
                        className="text-lg font-bold sm:text-xl"
                        style={{ color }}
                      >
                        {value ?? "—"}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <RateBar
                    label={t("view_to_basket_rate")}
                    rate={behavior?.overview.view_to_basket_rate ?? 0}
                    color={COLORS.secondary}
                  />
                  <RateBar
                    label={t("basket_to_order_rate")}
                    rate={behavior?.overview.basket_to_order_rate ?? 0}
                    color={COLORS.accent}
                  />
                  <RateBar
                    label={t("view_to_order_rate")}
                    rate={behavior?.overview.view_to_order_rate ?? 0}
                    color={COLORS.success}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Abandoned products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              {t("abandoned_products")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {behaviorLoading ? (
              <div className="p-6">
                <ChartSkeleton height={200} />
              </div>
            ) : (behavior?.abandoned_products ?? []).length > 0 ? (
              <>
                <div className="divide-border divide-y">
                  {(behavior?.abandoned_products ?? [])
                    .slice(0, 6)
                    .map((item, i) => (
                      <ProductRow
                        key={item.cpv?.id ?? i}
                        cpv={item.cpv}
                        value={`${item.abandonment_rate.toFixed(0)}%`}
                        valueClassName="text-amber-600"
                        sub={`${item.abandoned_count} / ${item.basket_count} ${t("abandoned")}`}
                      />
                    ))}
                </div>

                {/* Mini bar chart for top 5 abandoned */}
                {(behavior?.abandoned_products ?? []).length > 0 && (
                  <div className="overflow-x-auto p-4">
                    <ResponsiveContainer
                      width="100%"
                      height={isMobile ? 160 : 140}
                      minWidth={0}
                    >
                      <BarChart
                        data={(behavior?.abandoned_products ?? [])
                          .slice(0, 5)
                          .map((item) => {
                            const title = item.cpv?.title ?? "—";

                            return {
                              name:
                                title.length > (isMobile ? 14 : 20)
                                  ? `${title.slice(0, isMobile ? 14 : 20)}…`
                                  : title,
                              rate: Number(item.abandonment_rate.toFixed(1)),
                            };
                          })}
                        layout="vertical"
                        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          stroke="#e2e8f0"
                        />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          tickFormatter={(v) => `${v}%`}
                          domain={[0, 100]}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: isMobile ? 9 : 10 }}
                          tickLine={false}
                          width={isMobile ? 88 : 130}
                        />
                        <Tooltip
                          formatter={(v) => [`${v}%`, t("abandonment_rate")]}
                        />
                        <Bar
                          dataKey="rate"
                          fill={COLORS.accent}
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground p-5 text-center text-sm">
                {labelNoData}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
