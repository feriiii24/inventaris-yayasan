import { useEffect, useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import {
    Area,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    Archive,
    ArrowUpRight,
    BadgeCheck,
    Boxes,
    FileText,
    MapPin,
    RotateCcw,
    SlidersHorizontal,
    TriangleAlert,
    WalletCards,
    Wrench,
    X,
    XCircle,
} from "lucide-react";
import { getAssetDetailRoute } from "../config/pageRoutes";
import type { Role } from "../types";
import {
    AlertItem,
    ActivityItem,
    ChartCard,
    EmptyState,
    FilterSelect,
    ProgressIndicator,
    SectionHeader,
    StatisticCard,
    StatusBadge,
    dashboardCardClass,
} from "./dashboard/DashboardPrimitives";

interface Props {
    role: Role;
    onNavigate: (page: string) => void;
    stats?: Record<string, any>;
    recentAssets?: Array<Record<string, any>>;
}

const colors = {
    navy: "#0f172a",
    muted: "#64748b",
    line: "#e2e8f0",
    green: "#16a34a",
    amber: "#d97706",
    red: "#dc2626",
    blue: "#2563eb",
    indigo: "#4f46e5",
};

function formatNumber(value: number) {
    return Number(value || 0).toLocaleString("id-ID");
}

function formatMoney(value: number) {
    if (value >= 1_000_000_000)
        return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)} jt`;
    return `Rp ${formatNumber(value)}`;
}

function normalizeRole(value: unknown): Role {
    const raw = String(value ?? "")
        .toLowerCase()
        .replace(/[^a-z_]/g, "_")
        .replace(/_+/g, "_");
    if (raw.includes("admin_unit")) return "admin_unit";
    if (raw.includes("admin_pusat")) return "admin_pusat";
    return "super_admin";
}

function ChartTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const visiblePayload = payload.filter((item: any) => item.type !== "area");
    return (
        <div className="min-w-[150px] rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.14)] backdrop-blur">
            {label && (
                <div className="mb-2 border-b border-slate-100 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                </div>
            )}
            <div className="space-y-1.5">
                {visiblePayload.map((item: any) => (
                    <div
                        key={item.dataKey ?? item.name}
                        className="flex items-center justify-between gap-4 text-xs text-slate-500"
                    >
                        <span className="flex items-center gap-1.5">
                            <i
                                className="h-2 w-2 rounded-full"
                                style={{
                                    background: item.color ?? colors.indigo,
                                }}
                            />
                            {item.name ?? item.dataKey}
                        </span>
                        <b className="font-semibold text-slate-900">
                            {formatNumber(item.value)}
                        </b>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TrendTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const value = Number(
        payload.find((item: any) => item.dataKey === "total")?.value ?? 0,
    );
    return (
        <div className="min-w-[165px] rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.14)] backdrop-blur">
            <div className="mb-2 border-b border-slate-100 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </div>
            <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                    <i
                        className="h-2 w-2 rounded-full"
                        style={{ background: colors.indigo }}
                    />
                    Nilai inventaris
                </span>
                <b className="font-semibold text-slate-900">
                    Rp {value.toFixed(2)} M
                </b>
            </div>
        </div>
    );
}

function ConditionLegend() {
    return (
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-500">
            {[
                ["Baik", colors.green],
                ["Rusak Ringan", colors.amber],
                ["Rusak Berat", colors.red],
                ["Perbaikan", colors.blue],
            ].map(([label, color]) => (
                <span key={label} className="flex items-center gap-1.5">
                    <i
                        className="h-2 w-2 rounded-full"
                        style={{ background: color }}
                    />
                    {label}
                </span>
            ))}
        </div>
    );
}

function DonutLegend({
    items,
    total,
}: {
    items: Array<{ name: string; value: number; color: string }>;
    total: number;
}) {
    return (
        <div className="space-y-2.5">
            {items.map((item) => (
                <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 text-xs"
                >
                    <span className="flex min-w-0 items-center gap-2 text-slate-600">
                        <i
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: item.color }}
                        />
                        <span className="truncate">{item.name}</span>
                    </span>
                    <span className="shrink-0 text-right">
                        <b className="font-semibold text-slate-900">
                            {formatNumber(item.value)}
                        </b>
                        <small className="ml-1.5 text-[10px] text-slate-400">
                            {total
                                ? `${Math.round((item.value / total) * 100)}%`
                                : "0%"}
                        </small>
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function DashboardPage({
    role,
    onNavigate,
    stats = {},
    recentAssets = [],
}: Props) {
    const { props } = usePage() as any;
    const [period, setPeriod] = useState("6 Bulan");
    const [query, setQuery] = useState("");
    const [periodFilter, setPeriodFilter] = useState("Semua Periode");
    const [categoryFilter, setCategoryFilter] = useState("Semua Sumber");
    const [locationFilter, setLocationFilter] = useState("Semua Lokasi");
    const [conditionFilter, setConditionFilter] = useState("Semua Kondisi");
    const [statusFilter, setStatusFilter] = useState("Semua Status");
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [tablePage, setTablePage] = useState(1);
    const [showCustomize, setShowCustomize] = useState(false);
    const [activeConditionSlice, setActiveConditionSlice] = useState<
        number | undefined
    >();
    const [activeCompositionSlice, setActiveCompositionSlice] = useState<
        number | undefined
    >();
    const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(() => {
        try {
            return JSON.parse(
                localStorage.getItem("dashboard-hidden-widgets") ?? "[]",
            );
        } catch {
            return [];
        }
    });
    const authRole = props?.auth?.user?.role ?? props?.user?.role ?? role;
    const currentRole = normalizeRole(authRole);
    const condition = stats.condition_summary ?? {};
    const sourceData = (props.source_data ?? []).map((item: any) => ({
        name: item.name ?? "Umum",
        total: Number(item.total ?? 0),
        baik: Number(item.baik ?? 0),
        rusak_ringan: Number(item.rusak_ringan ?? 0),
        rusak_berat: Number(item.rusak_berat ?? 0),
        perbaikan: Number(item.perbaikan ?? 0),
    }));
    const locationData = (props.location_data ?? []).map((item: any) => ({
        name: item.name ?? "Belum ditentukan",
        total: Number(item.total ?? 0),
    }));
    const valueTrend = (props.value_trend ?? []).map((item: any) => ({
        name: item.tahun,
        total: Number(item.nilai ?? 0) / 1_000_000_000,
    }));
    const assetComposition = (props.asset_composition ?? []).map(
        (item: any) => ({ name: item.name, total: Number(item.total ?? 0) }),
    );
    const unitData = (props.unit_data ?? []).map((item: any) => ({
        name: item.name,
        total: Number(item.total ?? 0),
    }));
    const conditionByUnit = (props.condition_by_unit ?? []).map(
        (item: any) => ({
            name: item.name,
            baik: Number(item.baik ?? 0),
            rusak_ringan: Number(item.rusak_ringan ?? 0),
            rusak_berat: Number(item.rusak_berat ?? 0),
            perbaikan: Number(item.perbaikan ?? 0),
        }),
    );
    const borrowingStatus = (props.borrowing_status ?? []).map((item: any) => ({
        name: item.name,
        total: Number(item.total ?? 0),
    }));
    const mutationStatus = (props.mutation_status ?? []).map((item: any) => ({
        name: item.name,
        total: Number(item.total ?? 0),
    }));
    const conditionData = [
        {
            name: "Baik",
            value: Number(condition.baik ?? 0),
            color: colors.green,
        },
        {
            name: "Rusak Ringan",
            value: Number(condition.rusak_ringan ?? 0),
            color: colors.amber,
        },
        {
            name: "Rusak Berat",
            value: Number(condition.rusak_berat ?? 0),
            color: colors.red,
        },
        {
            name: "Perbaikan",
            value: Number(condition.dalam_perbaikan ?? 0),
            color: colors.blue,
        },
    ];
    const totalInventory = Number(stats.total_assets ?? 0);
    const goodPercent = totalInventory
        ? Math.round((Number(condition.baik ?? 0) / totalInventory) * 100)
        : 0;
    const rows = recentAssets.map((asset: any) => ({
        ...asset,
        quantity: Number(asset.quantity ?? asset.jumlah ?? 1),
        updated_at: asset.updated_at ?? "-",
        condition: asset.condition ?? asset.kondisi ?? "Baik",
        status: asset.status ?? "Aktif",
    }));
    const sources = [
        "Semua Sumber",
        ...Array.from(
            new Set(rows.map((asset: any) => asset.source).filter(Boolean)),
        ),
    ];
    const locations = [
        "Semua Lokasi",
        ...locationData.map((item: any) => item.name),
    ];
    const filteredRows = useMemo(
        () =>
            rows.filter((asset: any) => {
                const textMatch =
                    `${asset.name} ${asset.code} ${asset.source} ${asset.unit}`
                        .toLowerCase()
                        .includes(query.toLowerCase());
                return (
                    textMatch &&
                    (categoryFilter === "Semua Sumber" ||
                        asset.source === categoryFilter) &&
                    (locationFilter === "Semua Lokasi" ||
                        asset.unit === locationFilter) &&
                    (conditionFilter === "Semua Kondisi" ||
                        asset.condition === conditionFilter) &&
                    (statusFilter === "Semua Status" ||
                        asset.status === statusFilter)
                );
            }),
        [
            rows,
            query,
            categoryFilter,
            locationFilter,
            conditionFilter,
            statusFilter,
        ],
    );
    const pageSize = 8;
    const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const visibleRows = filteredRows.slice(
        (tablePage - 1) * pageSize,
        tablePage * pageSize,
    );
    useEffect(() => {
        setTablePage(1);
    }, [query, categoryFilter, locationFilter, conditionFilter, statusFilter]);
    const topSource = sourceData[0]?.name ?? "Belum tersedia";
    const topSourceTotal = sourceData[0]?.total ?? 0;
    const sourceTotal = sourceData.reduce(
        (sum: number, item: any) => sum + item.total,
        0,
    );
    const sourceDonutData = sourceData.map((item: any, index: number) => ({
        ...item,
        value: item.total,
        color: [
            colors.indigo,
            colors.blue,
            colors.green,
            colors.amber,
            colors.red,
        ][index % 5],
    }));
    const locationTotal = locationData.reduce(
        (sum: number, item: any) => sum + item.total,
        0,
    );
    const topLocation = locationData[0]?.name ?? "Belum tersedia";
    const topLocationTotal = locationData[0]?.total ?? 0;
    const locationDonutData = locationData.map((item: any, index: number) => ({
        ...item,
        value: item.total,
        color: [
            colors.blue,
            colors.indigo,
            colors.green,
            colors.amber,
            colors.red,
        ][index % 5],
    }));
    const topLocations = locationDonutData.slice(0, 5);
    const compositionTotal = assetComposition.reduce(
        (sum: number, item: any) => sum + item.total,
        0,
    );
    const topComposition = assetComposition[0];
    const topUnit = unitData[0];
    const unitTotal = unitData.reduce(
        (sum: number, item: any) => sum + item.total,
        0,
    );
    const unitDonutData = unitData.map((item: any, index: number) => ({
        ...item,
        value: item.total,
        color: [
            colors.blue,
            colors.indigo,
            colors.green,
            colors.amber,
            colors.red,
        ][index % 5],
    }));
    const borrowingTotal = borrowingStatus.reduce(
        (sum: number, item: any) => sum + item.total,
        0,
    );
    const activeBorrowing = borrowingStatus.find((item: any) =>
        ["Dipinjam", "Aktif", "Disetujui"].includes(String(item.name)),
    );
    const borrowingDonutData = borrowingStatus.map((item: any) => {
        const status = String(item.name).toLowerCase();
        const color = status.includes("tolak")
            ? colors.red
            : status.includes("kembali")
              ? colors.green
              : status.includes("pending")
                ? colors.amber
                : colors.blue;
        return { ...item, value: item.total, color };
    });
    const mutationTotal = mutationStatus.reduce(
        (sum: number, item: any) => sum + item.total,
        0,
    );
    const mutationDonutData = mutationStatus.map((item: any) => {
        const status = String(item.name).toLowerCase();
        const color =
            status.includes("gagal") || status.includes("tolak")
                ? colors.red
                : status.includes("proses") || status.includes("pending")
                  ? colors.amber
                  : status.includes("sukses") || status.includes("selesai")
                    ? colors.green
                    : colors.indigo;
        return { ...item, value: item.total, color };
    });
    const primaryMutation =
        mutationDonutData.find((item: any) =>
            /proses|pending|sukses|selesai/i.test(item.name),
        ) ?? mutationDonutData[0];
    const conditionUnitTotal = conditionByUnit.reduce(
        (sum: number, item: any) =>
            sum +
            item.baik +
            item.rusak_ringan +
            item.rusak_berat +
            item.perbaikan,
        0,
    );
    const healthiestUnit = [...conditionByUnit].sort(
        (a: any, b: any) =>
            b.baik /
                Math.max(
                    b.baik + b.rusak_ringan + b.rusak_berat + b.perbaikan,
                    1,
                ) -
            a.baik /
                Math.max(
                    a.baik + a.rusak_ringan + a.rusak_berat + a.perbaikan,
                    1,
                ),
    )[0];
    const conditionUnitDonutData = [
        {
            name: "Baik",
            value: conditionByUnit.reduce(
                (sum: number, item: any) => sum + item.baik,
                0,
            ),
            color: colors.green,
        },
        {
            name: "Rusak Ringan",
            value: conditionByUnit.reduce(
                (sum: number, item: any) => sum + item.rusak_ringan,
                0,
            ),
            color: colors.amber,
        },
        {
            name: "Rusak Berat",
            value: conditionByUnit.reduce(
                (sum: number, item: any) => sum + item.rusak_berat,
                0,
            ),
            color: colors.red,
        },
        {
            name: "Perbaikan",
            value: conditionByUnit.reduce(
                (sum: number, item: any) => sum + item.perbaikan,
                0,
            ),
            color: colors.blue,
        },
    ];
    const damagedSource =
        [...sourceData].sort(
            (a: any, b: any) =>
                b.rusak_ringan +
                b.rusak_berat -
                (a.rusak_ringan + a.rusak_berat),
        )[0]?.name ?? "Belum tersedia";
    const cards = [
        {
            label: "Total Inventaris",
            value: totalInventory,
            detail: "Unit terdaftar",
            color: colors.indigo,
            icon: <Boxes size={17} strokeWidth={2} aria-hidden="true" />,
        },
        {
            label: "Kondisi Baik",
            value: Number(condition.baik ?? 0),
            detail: `${goodPercent}% dari total`,
            color: colors.green,
            icon: <BadgeCheck size={17} strokeWidth={2} aria-hidden="true" />,
        },
        {
            label: "Rusak Ringan",
            value: Number(condition.rusak_ringan ?? 0),
            detail: "Perlu monitoring",
            color: colors.amber,
            icon: (
                <TriangleAlert size={17} strokeWidth={2} aria-hidden="true" />
            ),
        },
        {
            label: "Rusak Berat",
            value: Number(condition.rusak_berat ?? 0),
            detail: "Perlu tindakan",
            color: colors.red,
            icon: <XCircle size={17} strokeWidth={2} aria-hidden="true" />,
        },
        {
            label: "Sedang Diperbaiki",
            value: Number(condition.dalam_perbaikan ?? 0),
            detail: "Dalam penanganan",
            color: colors.blue,
            icon: <Wrench size={17} strokeWidth={2} aria-hidden="true" />,
        },
        {
            label: "Total Nilai",
            value: Number(stats.total_value ?? 0),
            detail: "Estimasi perolehan",
            color: colors.navy,
            icon: <WalletCards size={17} strokeWidth={2} aria-hidden="true" />,
            money: true,
        },
    ];
    const activities = (props.activities ?? []).slice(0, 5);
    const totalDamaged =
        Number(condition.rusak_ringan ?? 0) +
        Number(condition.rusak_berat ?? 0);
    const quality = props.stats?.data_quality ?? stats.data_quality ?? {};
    const completenessItems = [
        ["Tanpa foto", quality.no_photo],
        ["Tanpa lokasi", quality.no_location],
        ["Tanpa dokumen", quality.no_document],
    ].map(([name, total]) => ({
        name: String(name),
        total: Number(total ?? 0),
    }));
    const trendPeriod =
        periodFilter === "Semua Periode" ? period : periodFilter;
    const trendIsAnnual =
        valueTrend.length > 0 &&
        valueTrend.every((item: any) => /^\d{4}$/.test(String(item.name)));
    const filteredValueTrend = useMemo(() => {
        const limits: Record<string, number> = {
            "7 Hari": 1,
            "30 Hari": 2,
            "3 Bulan": 3,
            "6 Bulan": 6,
            "1 Tahun": 12,
        };
        const limit = limits[trendPeriod];
        return trendIsAnnual || !limit ? valueTrend : valueTrend.slice(-limit);
    }, [trendIsAnnual, trendPeriod, valueTrend]);
    const healthScore =
        totalInventory > 0
            ? Math.round(
                  goodPercent * 0.6 +
                      Number(quality.complete_percent ?? 0) * 0.25 +
                      Number(quality.verified_percent ?? 0) * 0.15,
              )
            : 0;
    const bestSource = [...sourceData].sort(
        (a: any, b: any) =>
            (b.total ? b.baik / b.total : 0) - (a.total ? a.baik / a.total : 0),
    )[0];
    const lowSource = [...sourceData].sort(
        (a: any, b: any) =>
            b.rusak_ringan + b.rusak_berat - (a.rusak_ringan + a.rusak_berat),
    )[0];
    const setWidgetVisibility = (key: string) => {
        const next = hiddenWidgets.includes(key)
            ? hiddenWidgets.filter((item) => item !== key)
            : [...hiddenWidgets, key];
        setHiddenWidgets(next);
        localStorage.setItem("dashboard-hidden-widgets", JSON.stringify(next));
    };
    const isVisible = (key: string) => !hiddenWidgets.includes(key);
    const activeFilterCount = [
        periodFilter,
        categoryFilter,
        locationFilter,
        conditionFilter,
        statusFilter,
    ].filter((value) => !value.startsWith("Semua ")).length;
    const resetFilters = () => {
        setPeriodFilter("Semua Periode");
        setCategoryFilter("Semua Sumber");
        setLocationFilter("Semua Lokasi");
        setConditionFilter("Semua Kondisi");
        setStatusFilter("Semua Status");
        setQuery("");
    };
    const activeFilters = [
        ["Periode", periodFilter, "Semua Periode", setPeriodFilter],
        ["Sumber", categoryFilter, "Semua Sumber", setCategoryFilter],
        ["Lokasi", locationFilter, "Semua Lokasi", setLocationFilter],
        ["Kondisi", conditionFilter, "Semua Kondisi", setConditionFilter],
        ["Status", statusFilter, "Semua Status", setStatusFilter],
    ].filter(([, value, defaultValue]) => value !== defaultValue) as Array<
        [string, string, string, (value: string) => void]
    >;

    return (
        <div className="mx-auto max-w-[1600px] space-y-7 pb-10">
            <header className="relative overflow-hidden rounded-2xl border border-emerald-900/70 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 px-5 py-5 shadow-[0_8px_24px_rgba(6,78,59,0.18)]">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                        Pusat kendali inventaris
                    </p>
                    <h1 className="mt-1 text-[28px] font-bold tracking-[-0.03em] text-white">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-emerald-100/80">
                        Ringkasan kondisi dan aktivitas inventaris
                    </p>
                </div>
            </header>

            {showCustomize && (
                <div className={`${dashboardCardClass} p-5`}>
                    <SectionHeader
                        eyebrow="Personalisasi"
                        title="Sesuaikan dashboard"
                        description="Pilih kelompok widget yang ingin ditampilkan. Preferensi disimpan di browser ini."
                    />
                    <div className="flex flex-wrap gap-2">
                        {[
                            ["executive", "Ringkasan eksekutif"],
                            ["health", "Skor kesehatan"],
                            ["performance", "Performa sumber"],
                            ["location", "Analitik lokasi"],
                            ["analytics", "Analitik lanjutan"],
                            ["quality", "Kualitas data"],
                            ["maintenance", "Perawatan"],
                            ["activity", "Aktivitas"],
                            ["attention", "Perlu perhatian"],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setWidgetVisibility(key)}
                                className={`rounded-xl border px-3 py-2 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-300 ${isVisible(key) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <section>
                <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Ringkasan portofolio
                        </p>
                        <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-900">
                            Statistik utama
                        </h2>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                        Data terkini
                    </span>
                </div>
                <div className="flex snap-x gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-3 2xl:grid-cols-6">
                    {cards.map((card) => (
                        <div
                            key={card.label}
                            className="min-w-[248px] snap-start sm:min-w-0"
                        >
                            <StatisticCard
                                {...card}
                                formatMoney={formatMoney}
                                formatNumber={formatNumber}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {isVisible("executive") && (
                <section className={`${dashboardCardClass} overflow-hidden`}>
                    <div className="border-b border-emerald-900/70 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 px-5 py-5 text-white sm:px-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                                    Ringkasan eksekutif
                                </p>
                                <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em]">
                                    Ringkasan kondisi inventaris
                                </h2>
                                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">
                                    Ringkasan otomatis untuk membantu menentukan
                                    prioritas pengelolaan aset.
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-right backdrop-blur">
                                <p className="text-[10px] uppercase tracking-wider text-slate-300">
                                    Skor kesehatan
                                </p>
                                <p className="mt-0.5 text-xl font-bold text-white">
                                    {healthScore}
                                    <span className="ml-1 text-xs font-medium text-slate-400">
                                        /100
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="mt-5 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-3">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                    Total inventaris
                                </p>
                                <p className="mt-1 text-2xl font-bold tracking-tight">
                                    {formatNumber(totalInventory)}{" "}
                                    <span className="text-sm font-medium text-slate-400">
                                        unit
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                    Kondisi baik
                                </p>
                                <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-300">
                                    {goodPercent}
                                    <span className="text-lg">%</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                    Perlu perhatian
                                </p>
                                <p className="mt-1 text-2xl font-bold tracking-tight text-amber-300">
                                    {formatNumber(
                                        totalDamaged +
                                            Number(
                                                condition.dalam_perbaikan ?? 0,
                                            ),
                                    )}{" "}
                                    <span className="text-sm font-medium text-slate-400">
                                        unit
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-3 bg-white p-5 sm:grid-cols-2 xl:grid-cols-5 sm:p-6">
                        {[
                            [
                                "Kondisi baik",
                                `${goodPercent}%`,
                                "Aset dalam kondisi optimal",
                                "text-emerald-700",
                                "bg-emerald-50",
                            ],
                            [
                                "Total kerusakan",
                                formatNumber(totalDamaged),
                                "Perlu monitoring dan tindakan",
                                "text-red-700",
                                "bg-red-50",
                            ],
                            [
                                "Total perbaikan",
                                formatNumber(condition.dalam_perbaikan ?? 0),
                                "Sedang dalam penanganan",
                                "text-blue-700",
                                "bg-blue-50",
                            ],
                            [
                                "Nilai aset",
                                formatMoney(Number(stats.total_value ?? 0)),
                                "Estimasi nilai perolehan",
                                "text-indigo-700",
                                "bg-indigo-50",
                            ],
                            [
                                "Perubahan periode",
                                "Belum tersedia",
                                "Belum ada histori periode",
                                "text-slate-600",
                                "bg-slate-50",
                            ],
                        ].map(([label, value, detail, color, background]) => (
                            <div
                                key={label}
                                className={`rounded-xl border border-slate-100 ${background} p-3.5`}
                            >
                                <p className="text-[11px] font-medium text-slate-500">
                                    {label}
                                </p>
                                <p
                                    className={`mt-2 text-lg font-bold tracking-tight ${color}`}
                                >
                                    {value}
                                </p>
                                <p className="mt-1 text-[10px] leading-4 text-slate-400">
                                    {detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                {isVisible("health") && (
                    <div className={`${dashboardCardClass} p-5`}>
                        <SectionHeader
                            eyebrow="Kesehatan portofolio"
                            title="Skor kesehatan inventaris"
                            description="Skor gabungan kondisi, kualitas data, dan verifikasi"
                        />
                        <div className="flex flex-col items-center gap-6 sm:flex-row">
                            <div
                                className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
                                style={{
                                    background: `conic-gradient(${colors.green} ${healthScore * 3.6}deg, #e2e8f0 0deg)`,
                                }}
                            >
                                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                                    <b className="text-2xl text-slate-900">
                                        {healthScore}
                                    </b>
                                    <span className="text-[10px] text-slate-400">
                                        / 100
                                    </span>
                                </div>
                            </div>
                            <div className="min-w-0 flex-1 space-y-3 w-full">
                                {[
                                    [
                                        "Kondisi barang",
                                        goodPercent,
                                        colors.green,
                                    ],
                                    [
                                        "Kelengkapan data",
                                        Number(quality.complete_percent ?? 0),
                                        colors.indigo,
                                    ],
                                    [
                                        "Verifikasi",
                                        Number(quality.verified_percent ?? 0),
                                        colors.blue,
                                    ],
                                ].map(([label, value, color]) => (
                                    <div key={label}>
                                        <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                                            <span>{label}</span>
                                            <span>{value}%</span>
                                        </div>
                                        <ProgressIndicator
                                            value={Number(value)}
                                            color={String(color)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {isVisible("performance") && (
                    <div className={`${dashboardCardClass} p-5`}>
                        <SectionHeader
                            eyebrow="Performa sumber"
                            title="Performa sumber barang"
                            description="Perbandingan kondisi berdasarkan asal barang"
                        />
                        <div className="space-y-4">
                            {[
                                [bestSource, "Sumber terbaik", colors.green],
                                [
                                    lowSource,
                                    "Sumber perlu perhatian",
                                    colors.red,
                                ],
                            ].map(([item, label, color]) => {
                                const source = item as any;
                                const percent = source?.total
                                    ? Math.round(
                                          (source.baik / source.total) * 100,
                                      )
                                    : 0;
                                const damaged = source
                                    ? source.rusak_ringan + source.rusak_berat
                                    : 0;
                                return (
                                    <div
                                        key={label}
                                        className="rounded-lg border border-slate-200 p-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-700">
                                                {label}
                                            </span>
                                            <span
                                                className="text-xs font-semibold"
                                                style={{ color: String(color) }}
                                            >
                                                {source?.name ??
                                                    "Belum tersedia"}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                                            <span>
                                                {source
                                                    ? formatNumber(source.total)
                                                    : "0"}{" "}
                                                unit
                                            </span>
                                            <span>
                                                {percent}% baik ·{" "}
                                                {formatNumber(damaged)} rusak
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <ProgressIndicator
                                                value={percent}
                                                color={String(color)}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>

            <section className={`${dashboardCardClass} p-4`}>
                <SectionHeader
                    eyebrow="Ruang kerja"
                    title="Aksi cepat"
                    description="Akses cepat untuk pekerjaan yang paling sering dilakukan"
                />
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        ["Tambah inventaris", "add-asset", Archive],
                        ["Lihat semua inventaris", "asset-inventaris", Boxes],
                        [
                            "Periksa barang rusak",
                            "laporan-kondisi",
                            TriangleAlert,
                        ],
                        ["Lihat laporan", "laporan-aset", FileText],
                    ].map(([label, page, Icon], index) => (
                        <button
                            key={String(label)}
                            type="button"
                            onClick={() => onNavigate(String(page))}
                            className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-300 ${index === 0 ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-700" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"}`}
                        >
                            <span className="flex items-center gap-2">
                                <Icon
                                    size={15}
                                    className={
                                        index === 0
                                            ? "text-white"
                                            : "text-slate-500"
                                    }
                                    aria-hidden="true"
                                />
                                {label}
                            </span>
                            <ArrowUpRight
                                size={14}
                                className={
                                    index === 0
                                        ? "text-slate-300"
                                        : "text-slate-400"
                                }
                                aria-hidden="true"
                            />
                        </button>
                    ))}
                </div>
            </section>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3 md:hidden">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Filter dashboard
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                            {activeFilterCount
                                ? `${activeFilterCount} filter aktif`
                                : "Semua data"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowMobileFilters((value) => !value)}
                        aria-expanded={showMobileFilters}
                        aria-controls="mobile-dashboard-filters"
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                        <SlidersHorizontal size={14} aria-hidden="true" />
                        {showMobileFilters ? "Tutup" : "Atur filter"}
                        {activeFilterCount > 0 && (
                            <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] text-white">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>
                <div
                    id="mobile-dashboard-filters"
                    className={`${showMobileFilters ? "mt-3 grid" : "hidden"} gap-3 md:mt-0 md:flex md:flex-wrap md:items-end`}
                >
                    <FilterSelect
                        label="Periode"
                        value={periodFilter}
                        options={[
                            "Semua Periode",
                            "7 Hari",
                            "30 Hari",
                            "6 Bulan",
                            "1 Tahun",
                        ]}
                        onChange={setPeriodFilter}
                    />
                    <FilterSelect
                        label="Sumber"
                        value={categoryFilter}
                        options={sources}
                        onChange={setCategoryFilter}
                    />
                    <FilterSelect
                        label="Lokasi"
                        value={locationFilter}
                        options={locations}
                        onChange={setLocationFilter}
                    />
                    <FilterSelect
                        label="Kondisi"
                        value={conditionFilter}
                        options={[
                            "Semua Kondisi",
                            "Baik",
                            "Rusak Ringan",
                            "Rusak Berat",
                            "Dalam Perbaikan",
                        ]}
                        onChange={setConditionFilter}
                    />
                    <FilterSelect
                        label="Status"
                        value={statusFilter}
                        options={["Semua Status", "Aktif", "Dipinjam"]}
                        onChange={setStatusFilter}
                    />
                    <button
                        type="button"
                        onClick={resetFilters}
                        disabled={!activeFilterCount && !query}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                        <RotateCcw size={14} aria-hidden="true" />
                        Reset filter
                    </button>
                </div>
            </div>
            {(activeFilters.length > 0 || query) && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium">Filter aktif:</span>
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            Pencarian: {query}
                            <X size={12} aria-hidden="true" />
                        </button>
                    )}
                    {activeFilters.map(
                        ([label, value, defaultValue, setter]) => (
                            <button
                                type="button"
                                key={label}
                                onClick={() => setter(defaultValue)}
                                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            >
                                {label}: {value}
                                <X size={12} aria-hidden="true" />
                            </button>
                        ),
                    )}
                </div>
            )}

            <section>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">
                            Analitik utama
                        </p>
                        <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-900">
                            Komposisi & kesehatan aset
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Pantau kondisi dan sumber inventaris dalam satu
                            tampilan.
                        </p>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700        ">
                        Ringkasan langsung
                    </span>
                </div>
                <div className="grid gap-4 xl:grid-cols-[1.05fr_1.45fr]">
                    <ChartCard
                        eyebrow="Kesehatan aset"
                        title="Distribusi kondisi inventaris"
                        description="Komposisi kondisi seluruh aset saat ini"
                        action={
                            <StatusBadge
                                label={
                                    goodPercent >= 70
                                        ? "Baik"
                                        : "Perlu perhatian"
                                }
                            />
                        }
                    >
                        <div className="grid items-center gap-6 sm:grid-cols-[220px_1fr]">
                            <div className="relative h-64">
                                {totalInventory > 0 ? (
                                    <>
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={conditionData}
                                                    dataKey="value"
                                                    innerRadius={68}
                                                    outerRadius={98}
                                                    paddingAngle={3}
                                                    stroke="#fff"
                                                    strokeWidth={3}
                                                    activeIndex={
                                                        activeConditionSlice
                                                    }
                                                    onMouseEnter={(_, index) =>
                                                        setActiveConditionSlice(
                                                            index,
                                                        )
                                                    }
                                                    onMouseLeave={() =>
                                                        setActiveConditionSlice(
                                                            undefined,
                                                        )
                                                    }
                                                >
                                                    {conditionData.map(
                                                        (entry) => (
                                                            <Cell
                                                                key={entry.name}
                                                                fill={
                                                                    entry.color
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                                <Tooltip
                                                    content={<ChartTip />}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-bold tracking-tight text-slate-950">
                                                {formatNumber(totalInventory)}
                                            </span>
                                            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                                Total unit
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <EmptyState
                                        onAdd={() => onNavigate("add-asset")}
                                    />
                                )}
                            </div>
                            <DonutLegend
                                items={conditionData}
                                total={totalInventory}
                            />
                        </div>
                    </ChartCard>
                    <ChartCard
                        eyebrow="Analitik sumber"
                        title="Inventaris berdasarkan sumber"
                        description="Distribusi unit berdasarkan asal barang"
                        action={
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                                {sourceData.length || 0} sumber teratas
                            </span>
                        }
                    >
                        <div className="mb-4 grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Total unit
                                </p>
                                <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                    {formatNumber(sourceTotal)}
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-400">
                                    Dari seluruh sumber
                                </p>
                            </div>
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                                    Sumber terbesar
                                </p>
                                <p className="mt-1 truncate text-sm font-bold text-emerald-800">
                                    {topSource}
                                </p>
                                <p className="mt-0.5 text-[10px] text-emerald-600">
                                    {formatNumber(topSourceTotal)} unit
                                </p>
                            </div>
                        </div>
                        <div className="grid items-center gap-5 sm:grid-cols-[220px_1fr]">
                            <div className="relative h-64">
                                {sourceData.length ? (
                                    <>
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={sourceDonutData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={68}
                                                    outerRadius={98}
                                                    paddingAngle={3}
                                                    stroke="#fff"
                                                    strokeWidth={3}
                                                    activeIndex={
                                                        activeCompositionSlice
                                                    }
                                                    onMouseEnter={(_, index) =>
                                                        setActiveCompositionSlice(
                                                            index,
                                                        )
                                                    }
                                                    onMouseLeave={() =>
                                                        setActiveCompositionSlice(
                                                            undefined,
                                                        )
                                                    }
                                                >
                                                    {sourceDonutData.map(
                                                        (item: any) => (
                                                            <Cell
                                                                key={item.name}
                                                                fill={
                                                                    item.color
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                                <Tooltip
                                                    content={<ChartTip />}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-bold tracking-tight text-slate-950">
                                                {formatNumber(sourceTotal)}
                                            </span>
                                            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                                Total unit
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <EmptyState
                                        onAdd={() => onNavigate("add-asset")}
                                    />
                                )}
                            </div>
                            <DonutLegend
                                items={sourceDonutData}
                                total={sourceTotal}
                            />
                        </div>
                    </ChartCard>
                </div>
            </section>

            <section>
                <div className="mb-4 mt-2 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                            Analitik lanjutan
                        </p>
                        <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-900">
                            Tren & distribusi operasional
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Gunakan pola historis dan kondisi sumber untuk
                            menentukan prioritas.
                        </p>
                    </div>
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700        ">
                        Pendukung keputusan
                    </span>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                    <ChartCard
                        eyebrow="Analisis tren"
                        title="Perkembangan inventaris"
                        description="Perubahan nilai inventaris dari waktu ke waktu"
                    >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700">
                                    Nilai aset
                                </span>
                                <span>
                                    {trendIsAnnual
                                        ? "Data tersedia tahunan"
                                        : "Perubahan berdasarkan periode"}
                                </span>
                            </div>
                            <div
                                className="flex max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-0.5"
                                aria-label="Periode grafik"
                            >
                                {[
                                    "7 Hari",
                                    "30 Hari",
                                    "3 Bulan",
                                    "6 Bulan",
                                    "1 Tahun",
                                ].map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setPeriod(item)}
                                        aria-pressed={period === item}
                                        className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-300 ${period === item ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-800"}`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-72">
                            {filteredValueTrend.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={filteredValueTrend}
                                        margin={{
                                            top: 12,
                                            right: 12,
                                            left: 2,
                                            bottom: 4,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="valueTrendFill"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor={colors.indigo}
                                                    stopOpacity={0.2}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor={colors.indigo}
                                                    stopOpacity={0.02}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            stroke="#e2e8f0"
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="name"
                                            interval="preserveStartEnd"
                                            tick={{
                                                fontSize: 10,
                                                fill: colors.muted,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{
                                                fontSize: 10,
                                                fill: colors.muted,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(value) =>
                                                `${value}M`
                                            }
                                            width={42}
                                        />
                                        <Tooltip
                                            content={<TrendTip />}
                                            cursor={{
                                                stroke: colors.indigo,
                                                strokeDasharray: "4 4",
                                                strokeOpacity: 0.45,
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            name="Nilai inventaris"
                                            stroke="none"
                                            fill="url(#valueTrendFill)"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            name="Nilai inventaris"
                                            stroke={colors.indigo}
                                            strokeWidth={2.5}
                                            dot={{
                                                r: 3.5,
                                                fill: "#fff",
                                                stroke: colors.indigo,
                                                strokeWidth: 2,
                                            }}
                                            activeDot={{
                                                r: 6,
                                                fill: colors.indigo,
                                                stroke: "#fff",
                                                strokeWidth: 2,
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState
                                    onAdd={() => onNavigate("add-asset")}
                                />
                            )}
                        </div>
                    </ChartCard>
                    <ChartCard
                        eyebrow="Analisis kondisi"
                        title="Kondisi per sumber"
                        description="Kondisi inventaris berdasarkan asal barang"
                        action={
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                {formatNumber(sourceTotal)} unit
                            </span>
                        }
                    >
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Ringkasan kondisi
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                    Sumber terbesar:{" "}
                                    <span className="text-indigo-700">
                                        {topSource}
                                    </span>
                                </p>
                            </div>
                            <ConditionLegend />
                        </div>
                        <div className="h-64 sm:h-72">
                            {sourceData.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={sourceData}
                                        barCategoryGap="22%"
                                        margin={{
                                            top: 4,
                                            left: 0,
                                            right: 8,
                                            bottom: 12,
                                        }}
                                    >
                                        <CartesianGrid
                                            stroke="#e2e8f0"
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="name"
                                            interval={0}
                                            tick={{
                                                fontSize: 10,
                                                fill: colors.muted,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(value) =>
                                                String(value).length > 14
                                                    ? `${String(value).slice(0, 14)}…`
                                                    : value
                                            }
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{
                                                fontSize: 10,
                                                fill: colors.muted,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={32}
                                        />
                                        <Tooltip
                                            content={<ChartTip />}
                                            cursor={{ fill: "#f8fafc" }}
                                        />
                                        <Bar
                                            dataKey="baik"
                                            name="Baik"
                                            stackId="condition"
                                            fill={colors.green}
                                            radius={[0, 0, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="rusak_ringan"
                                            name="Rusak Ringan"
                                            stackId="condition"
                                            fill={colors.amber}
                                        />
                                        <Bar
                                            dataKey="rusak_berat"
                                            name="Rusak Berat"
                                            stackId="condition"
                                            fill={colors.red}
                                        />
                                        <Bar
                                            dataKey="perbaikan"
                                            name="Perbaikan"
                                            stackId="condition"
                                            fill={colors.blue}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState
                                    onAdd={() => onNavigate("add-asset")}
                                />
                            )}
                        </div>
                    </ChartCard>
                </div>
            </section>

            {isVisible("location") && (
                <ChartCard
                    eyebrow="Analitik lokasi"
                    title="Inventaris berdasarkan lokasi"
                    description="Distribusi unit berdasarkan lokasi penyimpanan"
                    action={
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                            {locationData.length} lokasi
                        </span>
                    }
                >
                    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Total unit
                                    </p>
                                    <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                                        {formatNumber(locationTotal)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Tersebar di {locationData.length} lokasi
                                    </p>
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                    <MapPin size={17} aria-hidden="true" />
                                </div>
                            </div>
                            <div className="relative mt-3 h-72">
                                {locationData.length ? (
                                    <>
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={locationDonutData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={82}
                                                    outerRadius={112}
                                                    paddingAngle={2}
                                                    stroke="#fff"
                                                    strokeWidth={3}
                                                    activeIndex={
                                                        activeCompositionSlice
                                                    }
                                                    onMouseEnter={(_, index) =>
                                                        setActiveCompositionSlice(
                                                            index,
                                                        )
                                                    }
                                                    onMouseLeave={() =>
                                                        setActiveCompositionSlice(
                                                            undefined,
                                                        )
                                                    }
                                                >
                                                    {locationDonutData.map(
                                                        (item: any) => (
                                                            <Cell
                                                                key={item.name}
                                                                fill={
                                                                    item.color
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                                <Tooltip
                                                    content={<ChartTip />}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold tracking-tight text-slate-950">
                                                {formatNumber(locationTotal)}
                                            </span>
                                            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Total unit
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <EmptyState
                                        onAdd={() => onNavigate("add-asset")}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="space-y-5">
                            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">
                                    Lokasi terbesar
                                </p>
                                <div className="mt-3 flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                                        <MapPin size={18} aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-blue-950">
                                            {topLocation}
                                        </p>
                                        <p className="mt-0.5 text-xs text-blue-700">
                                            {formatNumber(topLocationTotal)}{" "}
                                            unit ·{" "}
                                            {locationTotal
                                                ? Math.round(
                                                      (topLocationTotal /
                                                          locationTotal) *
                                                          100,
                                                  )
                                                : 0}
                                            % dari total
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Distribusi lokasi
                                        </p>
                                        <h3 className="mt-1 text-sm font-semibold text-slate-900">
                                            {topLocations.length} lokasi teratas
                                        </h3>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                        Berdasarkan unit
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {topLocations.map(
                                        (item: any, index: number) => (
                                            <div key={item.name}>
                                                <div className="mb-1.5 flex items-center gap-2">
                                                    <span className="w-5 text-[10px] font-bold tabular-nums text-slate-400">
                                                        {String(
                                                            index + 1,
                                                        ).padStart(2, "0")}
                                                    </span>
                                                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-slate-900">
                                                        {formatNumber(
                                                            item.total,
                                                        )}{" "}
                                                        <small className="font-normal text-slate-400">
                                                            {locationTotal
                                                                ? `${Math.round((item.total / locationTotal) * 100)}%`
                                                                : "0%"}
                                                        </small>
                                                    </span>
                                                </div>
                                                <div className="ml-7">
                                                    <ProgressIndicator
                                                        value={
                                                            locationTotal
                                                                ? (item.total /
                                                                      locationTotal) *
                                                                  100
                                                                : 0
                                                        }
                                                        color={item.color}
                                                    />
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                            {topLocations.length > 0 && (
                                <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-500">
                                    <span className="font-semibold text-slate-700">
                                        Insight:
                                    </span>{" "}
                                    {topLocation} menyimpan jumlah inventaris
                                    terbesar dengan{" "}
                                    {formatNumber(topLocationTotal)} unit.
                                </p>
                            )}
                        </div>
                    </div>
                </ChartCard>
            )}

            {isVisible("analytics") && (
                <section className="space-y-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Analitik lanjutan
                        </p>
                        <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-900">
                            Distribusi, transaksi, dan kualitas aset
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Kelompok grafik operasional agar dashboard tetap
                            rapi dan mudah dipindai.
                        </p>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-2">
                        <ChartCard
                            eyebrow="Komposisi aset"
                            title="Komposisi jenis aset"
                            description="Proporsi inventaris berdasarkan kelompok pengelolaan"
                            action={
                                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
                                    {formatNumber(compositionTotal)} aset
                                </span>
                            }
                        >
                            <div className="grid items-center gap-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-[240px_1fr] sm:p-5">
                                {assetComposition.some(
                                    (item: any) => item.total > 0,
                                ) ? (
                                    <>
                                        <div className="relative h-64">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <PieChart>
                                                    <Pie
                                                        data={assetComposition}
                                                        dataKey="total"
                                                        nameKey="name"
                                                        innerRadius={74}
                                                        outerRadius={108}
                                                        paddingAngle={2}
                                                        activeIndex={
                                                            activeCompositionSlice
                                                        }
                                                        onMouseEnter={(
                                                            _,
                                                            index,
                                                        ) =>
                                                            setActiveCompositionSlice(
                                                                index,
                                                            )
                                                        }
                                                        onMouseLeave={() =>
                                                            setActiveCompositionSlice(
                                                                undefined,
                                                            )
                                                        }
                                                    >
                                                        {assetComposition.map(
                                                            (
                                                                item: any,
                                                                index: number,
                                                            ) => (
                                                                <Cell
                                                                    key={
                                                                        item.name
                                                                    }
                                                                    fill={
                                                                        [
                                                                            colors.indigo,
                                                                            colors.blue,
                                                                            colors.green,
                                                                            colors.amber,
                                                                        ][
                                                                            index %
                                                                                4
                                                                        ]
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </Pie>
                                                    <Tooltip
                                                        content={<ChartTip />}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl font-bold tracking-tight text-slate-950">
                                                    {formatNumber(
                                                        compositionTotal,
                                                    )}
                                                </span>
                                                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Total aset
                                                </span>
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="mb-4 rounded-xl border border-indigo-100 bg-white px-3.5 py-3">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-600">
                                                    Komposisi terbesar
                                                </p>
                                                <div className="mt-1 flex items-end justify-between gap-3">
                                                    <p className="truncate text-sm font-bold text-slate-900">
                                                        {topComposition?.name ??
                                                            "Belum tersedia"}
                                                    </p>
                                                    <b className="shrink-0 text-lg text-indigo-700">
                                                        {compositionTotal &&
                                                        topComposition
                                                            ? `${Math.round((topComposition.total / compositionTotal) * 100)}%`
                                                            : "0%"}
                                                    </b>
                                                </div>
                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    {topComposition
                                                        ? `${formatNumber(topComposition.total)} aset terdaftar`
                                                        : "Belum ada data"}
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                {assetComposition.map(
                                                    (
                                                        item: any,
                                                        index: number,
                                                    ) => (
                                                        <div
                                                            key={item.name}
                                                            className="flex items-center gap-2.5 text-xs"
                                                        >
                                                            <span className="w-5 text-[10px] font-bold tabular-nums text-slate-400">
                                                                {String(
                                                                    index + 1,
                                                                ).padStart(
                                                                    2,
                                                                    "0",
                                                                )}
                                                            </span>
                                                            <i
                                                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                                style={{
                                                                    background:
                                                                        [
                                                                            colors.indigo,
                                                                            colors.blue,
                                                                            colors.green,
                                                                            colors.amber,
                                                                        ][
                                                                            index %
                                                                                4
                                                                        ],
                                                                }}
                                                            />
                                                            <span className="min-w-0 flex-1 truncate font-medium text-slate-600">
                                                                {item.name}
                                                            </span>
                                                            <b className="text-slate-900">
                                                                {formatNumber(
                                                                    item.total,
                                                                )}
                                                            </b>
                                                            <small className="w-9 text-right font-medium text-slate-400">
                                                                {compositionTotal
                                                                    ? `${Math.round((item.total / compositionTotal) * 100)}%`
                                                                    : "0%"}
                                                            </small>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <EmptyState
                                        onAdd={() => onNavigate("add-asset")}
                                    />
                                )}
                            </div>
                        </ChartCard>
                        <ChartCard
                            eyebrow="Distribusi unit"
                            title="Aset per unit"
                            description="Distribusi aset yang dikelola oleh setiap unit"
                            action={
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                                    {formatNumber(unitTotal)} aset
                                </span>
                            }
                        >
                            {unitData.length ? (
                                <div className="grid items-center gap-5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-[230px_1fr] sm:p-5">
                                    <div className="relative h-64">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={unitDonutData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={72}
                                                    outerRadius={106}
                                                    paddingAngle={2}
                                                    activeIndex={
                                                        activeCompositionSlice
                                                    }
                                                    onMouseEnter={(_, index) =>
                                                        setActiveCompositionSlice(
                                                            index,
                                                        )
                                                    }
                                                    onMouseLeave={() =>
                                                        setActiveCompositionSlice(
                                                            undefined,
                                                        )
                                                    }
                                                >
                                                    {unitDonutData.map(
                                                        (item: any) => (
                                                            <Cell
                                                                key={item.name}
                                                                fill={
                                                                    item.color
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                                <Tooltip
                                                    content={<ChartTip />}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold tracking-tight text-slate-950">
                                                {formatNumber(unitTotal)}
                                            </span>
                                            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Total aset
                                            </span>
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="mb-4 rounded-xl border border-blue-100 bg-white px-3.5 py-3">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">
                                                Unit terbesar
                                            </p>
                                            <div className="mt-1 flex items-end justify-between gap-3">
                                                <p className="truncate text-sm font-bold text-slate-900">
                                                    {topUnit?.name ??
                                                        "Belum tersedia"}
                                                </p>
                                                <b className="shrink-0 text-lg text-blue-700">
                                                    {unitTotal && topUnit
                                                        ? `${Math.round((topUnit.total / unitTotal) * 100)}%`
                                                        : "0%"}
                                                </b>
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-slate-500">
                                                {formatNumber(
                                                    topUnit?.total ?? 0,
                                                )}{" "}
                                                aset terdaftar
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            {unitDonutData
                                                .slice(0, 6)
                                                .map(
                                                    (
                                                        item: any,
                                                        index: number,
                                                    ) => (
                                                        <div
                                                            key={item.name}
                                                            className="flex items-center gap-2.5 text-xs"
                                                        >
                                                            <span className="w-5 text-[10px] font-bold tabular-nums text-slate-400">
                                                                {String(
                                                                    index + 1,
                                                                ).padStart(
                                                                    2,
                                                                    "0",
                                                                )}
                                                            </span>
                                                            <i
                                                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                                style={{
                                                                    background:
                                                                        item.color,
                                                                }}
                                                            />
                                                            <span className="min-w-0 flex-1 truncate font-medium text-slate-600">
                                                                {item.name}
                                                            </span>
                                                            <b className="text-slate-900">
                                                                {formatNumber(
                                                                    item.total,
                                                                )}
                                                            </b>
                                                            <small className="w-9 text-right font-medium text-slate-400">
                                                                {unitTotal
                                                                    ? `${Math.round((item.total / unitTotal) * 100)}%`
                                                                    : "0%"}
                                                            </small>
                                                        </div>
                                                    ),
                                                )}
                                        </div>
                                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                                            <span>
                                                {unitData.length} unit terdata
                                            </span>
                                            <span>
                                                Rata-rata{" "}
                                                {formatNumber(
                                                    Math.round(
                                                        unitTotal /
                                                            unitData.length,
                                                    ),
                                                )}{" "}
                                                aset
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    onAdd={() => onNavigate("asset-inventaris")}
                                />
                            )}
                        </ChartCard>
                        <ChartCard
                            eyebrow="Status peminjaman"
                            title="Status peminjaman"
                            description="Distribusi transaksi peminjaman aset"
                            action={
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                                    {formatNumber(borrowingTotal)} transaksi
                                </span>
                            }
                        >
                            {borrowingStatus.length ? (
                                <div className="grid items-center gap-5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-[220px_1fr] sm:p-5">
                                    <div className="relative h-60">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={borrowingDonutData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={66}
                                                    outerRadius={100}
                                                    paddingAngle={2}
                                                    activeIndex={
                                                        activeCompositionSlice
                                                    }
                                                    onMouseEnter={(_, index) =>
                                                        setActiveCompositionSlice(
                                                            index,
                                                        )
                                                    }
                                                    onMouseLeave={() =>
                                                        setActiveCompositionSlice(
                                                            undefined,
                                                        )
                                                    }
                                                >
                                                    {borrowingDonutData.map(
                                                        (item: any) => (
                                                            <Cell
                                                                key={item.name}
                                                                fill={
                                                                    item.color
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                                <Tooltip
                                                    content={<ChartTip />}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-bold tracking-tight text-slate-950">
                                                {formatNumber(borrowingTotal)}
                                            </span>
                                            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Transaksi
                                            </span>
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="mb-4 rounded-xl border border-amber-100 bg-white px-3.5 py-3">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                                                Status aktif
                                            </p>
                                            <div className="mt-1 flex items-end justify-between gap-3">
                                                <p className="truncate text-sm font-bold text-slate-900">
                                                    {activeBorrowing?.name ??
                                                        "Belum tersedia"}
                                                </p>
                                                <b className="shrink-0 text-lg text-amber-700">
                                                    {borrowingTotal &&
                                                    activeBorrowing
                                                        ? `${Math.round((activeBorrowing.total / borrowingTotal) * 100)}%`
                                                        : "0%"}
                                                </b>
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-slate-500">
                                                {formatNumber(
                                                    activeBorrowing?.total ?? 0,
                                                )}{" "}
                                                transaksi
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            {borrowingDonutData.map(
                                                (item: any, index: number) => (
                                                    <div
                                                        key={item.name}
                                                        className="flex items-center gap-2.5 text-xs"
                                                    >
                                                        <span className="w-5 text-[10px] font-bold tabular-nums text-slate-400">
                                                            {String(
                                                                index + 1,
                                                            ).padStart(2, "0")}
                                                        </span>
                                                        <i
                                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                            style={{
                                                                background:
                                                                    item.color,
                                                            }}
                                                        />
                                                        <span className="min-w-0 flex-1 truncate font-medium text-slate-600">
                                                            {item.name}
                                                        </span>
                                                        <b className="text-slate-900">
                                                            {formatNumber(
                                                                item.total,
                                                            )}
                                                        </b>
                                                        <small className="w-9 text-right font-medium text-slate-400">
                                                            {borrowingTotal
                                                                ? `${Math.round((item.total / borrowingTotal) * 100)}%`
                                                                : "0%"}
                                                        </small>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                                            {borrowingStatus.length} status
                                            tercatat
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    onAdd={() => onNavigate("asset-inventaris")}
                                />
                            )}
                        </ChartCard>
                        <ChartCard
                            eyebrow="Status mutasi"
                            title="Status mutasi aset"
                            description="Distribusi proses perpindahan aset antar unit"
                            action={
                                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
                                    {formatNumber(mutationTotal)} mutasi
                                </span>
                            }
                        >
                            {mutationStatus.length ? (
                                <div className="grid items-center gap-5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-[220px_1fr] sm:p-5">
                                    <div className="relative h-60">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={mutationDonutData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={66}
                                                    outerRadius={100}
                                                    paddingAngle={2}
                                                    activeIndex={
                                                        activeCompositionSlice
                                                    }
                                                    onMouseEnter={(_, index) =>
                                                        setActiveCompositionSlice(
                                                            index,
                                                        )
                                                    }
                                                    onMouseLeave={() =>
                                                        setActiveCompositionSlice(
                                                            undefined,
                                                        )
                                                    }
                                                >
                                                    {mutationDonutData.map(
                                                        (item: any) => (
                                                            <Cell
                                                                key={item.name}
                                                                fill={
                                                                    item.color
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                                <Tooltip
                                                    content={<ChartTip />}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-bold tracking-tight text-slate-950">
                                                {formatNumber(mutationTotal)}
                                            </span>
                                            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Mutasi
                                            </span>
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="mb-4 rounded-xl border border-indigo-100 bg-white px-3.5 py-3">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-600">
                                                Status utama
                                            </p>
                                            <div className="mt-1 flex items-end justify-between gap-3">
                                                <p className="truncate text-sm font-bold text-slate-900">
                                                    {primaryMutation?.name ??
                                                        "Belum tersedia"}
                                                </p>
                                                <b className="shrink-0 text-lg text-indigo-700">
                                                    {mutationTotal &&
                                                    primaryMutation
                                                        ? `${Math.round((primaryMutation.total / mutationTotal) * 100)}%`
                                                        : "0%"}
                                                </b>
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-slate-500">
                                                {formatNumber(
                                                    primaryMutation?.total ?? 0,
                                                )}{" "}
                                                mutasi tercatat
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            {mutationDonutData.map(
                                                (item: any, index: number) => (
                                                    <div
                                                        key={item.name}
                                                        className="flex items-center gap-2.5 text-xs"
                                                    >
                                                        <span className="w-5 text-[10px] font-bold tabular-nums text-slate-400">
                                                            {String(
                                                                index + 1,
                                                            ).padStart(2, "0")}
                                                        </span>
                                                        <i
                                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                            style={{
                                                                background:
                                                                    item.color,
                                                            }}
                                                        />
                                                        <span className="min-w-0 flex-1 truncate font-medium text-slate-600">
                                                            {item.name}
                                                        </span>
                                                        <b className="text-slate-900">
                                                            {formatNumber(
                                                                item.total,
                                                            )}
                                                        </b>
                                                        <small className="w-9 text-right font-medium text-slate-400">
                                                            {mutationTotal
                                                                ? `${Math.round((item.total / mutationTotal) * 100)}%`
                                                                : "0%"}
                                                        </small>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                                            {mutationStatus.length} status
                                            tercatat
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    onAdd={() => onNavigate("asset-inventaris")}
                                />
                            )}
                        </ChartCard>
                        <ChartCard
                            eyebrow="Kondisi per unit"
                            title="Kondisi aset per unit"
                            description="Perbandingan kondisi aset pada setiap unit"
                        >
                            <div className="mb-4 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                        Unit paling sehat
                                    </p>
                                    <p className="mt-1 truncate text-sm font-bold text-emerald-950">
                                        {healthiestUnit?.name ??
                                            "Belum tersedia"}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-emerald-700">
                                        {healthiestUnit
                                            ? `${Math.round((healthiestUnit.baik / Math.max(healthiestUnit.baik + healthiestUnit.rusak_ringan + healthiestUnit.rusak_berat + healthiestUnit.perbaikan, 1)) * 100)}% kondisi baik`
                                            : "Belum ada data"}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Total aset terukur
                                    </p>
                                    <p className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                                        {formatNumber(conditionUnitTotal)}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                        {conditionByUnit.length} unit dianalisis
                                    </p>
                                </div>
                            </div>
                            <div className="grid items-center gap-5 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 sm:grid-cols-[220px_1fr] sm:p-4">
                                {conditionByUnit.length ? (
                                    <>
                                        <div className="relative h-60">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <PieChart>
                                                    <Pie
                                                        data={
                                                            conditionUnitDonutData
                                                        }
                                                        dataKey="value"
                                                        nameKey="name"
                                                        innerRadius={66}
                                                        outerRadius={100}
                                                        paddingAngle={2}
                                                        activeIndex={
                                                            activeConditionSlice
                                                        }
                                                        onMouseEnter={(
                                                            _,
                                                            index,
                                                        ) =>
                                                            setActiveConditionSlice(
                                                                index,
                                                            )
                                                        }
                                                        onMouseLeave={() =>
                                                            setActiveConditionSlice(
                                                                undefined,
                                                            )
                                                        }
                                                    >
                                                        {conditionUnitDonutData.map(
                                                            (item: any) => (
                                                                <Cell
                                                                    key={
                                                                        item.name
                                                                    }
                                                                    fill={
                                                                        item.color
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </Pie>
                                                    <Tooltip
                                                        content={<ChartTip />}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-2xl font-bold tracking-tight text-slate-950">
                                                    {formatNumber(
                                                        conditionUnitTotal,
                                                    )}
                                                </span>
                                                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Total aset
                                                </span>
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <ConditionLegend />
                                            <div className="mt-4 space-y-3">
                                                {conditionUnitDonutData.map(
                                                    (item: any) => (
                                                        <div
                                                            key={item.name}
                                                            className="flex items-center gap-2 text-xs"
                                                        >
                                                            <i
                                                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                                style={{
                                                                    background:
                                                                        item.color,
                                                                }}
                                                            />
                                                            <span className="min-w-0 flex-1 text-slate-600">
                                                                {item.name}
                                                            </span>
                                                            <b className="text-slate-900">
                                                                {formatNumber(
                                                                    item.value,
                                                                )}
                                                            </b>
                                                            <small className="w-9 text-right text-slate-400">
                                                                {conditionUnitTotal
                                                                    ? `${Math.round((item.value / conditionUnitTotal) * 100)}%`
                                                                    : "0%"}
                                                            </small>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                            <div className="mt-4 border-t border-slate-100 pt-3">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Unit paling sehat
                                                </p>
                                                <p className="mt-1 truncate text-sm font-bold text-emerald-700">
                                                    {healthiestUnit?.name ??
                                                        "Belum tersedia"}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    {healthiestUnit
                                                        ? `${formatNumber(healthiestUnit.baik)} aset dalam kondisi baik`
                                                        : "Belum ada data unit"}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <EmptyState
                                        onAdd={() => onNavigate("add-asset")}
                                    />
                                )}
                            </div>
                        </ChartCard>
                        <ChartCard
                            eyebrow="Kelengkapan data"
                            title="Ringkasan kelengkapan aset"
                            description="Aset yang masih membutuhkan pelengkapan informasi"
                        >
                            <div className="space-y-5 py-2">
                                <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                            Skor kelengkapan data
                                        </p>
                                        <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-950">
                                            {Number(
                                                quality.complete_percent ?? 0,
                                            )}
                                            <span className="ml-0.5 text-lg">
                                                %
                                            </span>
                                        </p>
                                        <p className="mt-1 text-[11px] text-emerald-700">
                                            Kelengkapan informasi utama
                                            inventaris
                                        </p>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-emerald-200 bg-white text-sm font-bold text-emerald-700">
                                        {Number(quality.complete_percent ?? 0)}%
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-2 flex items-center justify-between text-[11px]">
                                        <span className="font-medium text-slate-600">
                                            Kelengkapan database
                                        </span>
                                        <b className="text-slate-900">
                                            {Number(
                                                quality.complete_percent ?? 0,
                                            )}
                                            %
                                        </b>
                                    </div>
                                    <ProgressIndicator
                                        value={Number(
                                            quality.complete_percent ?? 0,
                                        )}
                                        color={colors.green}
                                    />
                                </div>
                                <div className="grid gap-2 sm:grid-cols-3">
                                    {completenessItems.map((item: any) => (
                                        <div
                                            key={item.name}
                                            className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span
                                                    className="h-2 w-2 rounded-full"
                                                    style={{
                                                        background:
                                                            item.total > 0
                                                                ? colors.amber
                                                                : colors.green,
                                                    }}
                                                />
                                                <b
                                                    className={
                                                        item.total > 0
                                                            ? "text-amber-700"
                                                            : "text-emerald-700"
                                                    }
                                                >
                                                    {formatNumber(item.total)}
                                                </b>
                                            </div>
                                            <p className="mt-2 text-[11px] font-medium leading-4 text-slate-600">
                                                {item.name}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                                unit perlu dilengkapi
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[11px] leading-5 text-slate-400">
                                    Prioritaskan atribut dengan jumlah data
                                    kosong tertinggi untuk meningkatkan kualitas
                                    laporan.
                                </p>
                            </div>
                        </ChartCard>
                    </div>
                </section>
            )}

            <section className="grid gap-4 xl:grid-cols-2">
                <ChartCard
                    eyebrow="Matriks sumber"
                    title="Matriks kondisi per sumber"
                    description="Ringkasan kondisi aset berdasarkan asal barang"
                    action={
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                            {formatNumber(sourceTotal)} aset
                        </span>
                    }
                >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Matriks kondisi
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                {sourceData.length} sumber dianalisis
                            </p>
                        </div>
                        <ConditionLegend />
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[650px] text-left text-xs">
                                <caption className="sr-only">
                                    Matriks kondisi aset berdasarkan sumber
                                </caption>
                                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                                    <tr>
                                        {[
                                            "Sumber",
                                            "Total",
                                            "Baik",
                                            "Rusak ringan",
                                            "Rusak berat",
                                            "Perbaikan",
                                        ].map((head) => (
                                            <th
                                                key={head}
                                                className="px-3 py-3 font-semibold"
                                            >
                                                {head}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sourceData.length ? (
                                        sourceData.map((item: any) => (
                                            <tr
                                                key={item.name}
                                                className="border-t border-slate-100 transition hover:bg-slate-50/80"
                                            >
                                                <td className="px-3 py-3 font-semibold text-slate-800">
                                                    {item.name}
                                                </td>
                                                <td className="px-3 py-3 font-bold text-slate-950">
                                                    {formatNumber(item.total)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="inline-flex min-w-12 justify-center rounded-lg bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                                                        {formatNumber(
                                                            item.baik,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="inline-flex min-w-12 justify-center rounded-lg bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                                                        {formatNumber(
                                                            item.rusak_ringan,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="inline-flex min-w-12 justify-center rounded-lg bg-red-50 px-2 py-1 font-semibold text-red-700">
                                                        {formatNumber(
                                                            item.rusak_berat,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="inline-flex min-w-12 justify-center rounded-lg bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                                                        {formatNumber(
                                                            item.perbaikan,
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="p-6 text-center text-slate-500"
                                            >
                                                Belum ada data inventaris
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </ChartCard>
                {isVisible("quality") && (
                    <ChartCard
                        eyebrow="Kualitas data"
                        title="Kualitas data inventaris"
                        description="Indikator kelengkapan dan verifikasi database"
                        action={
                            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
                                Skor kualitas
                            </span>
                        }
                    >
                        <div className="space-y-5">
                            <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-700">
                                        Kualitas data keseluruhan
                                    </p>
                                    <p className="mt-1 text-3xl font-bold tracking-tight text-indigo-950">
                                        {Math.round(
                                            (Number(
                                                quality.complete_percent ?? 0,
                                            ) +
                                                Number(
                                                    quality.verified_percent ??
                                                        0,
                                                )) /
                                                2,
                                        )}
                                        <span className="ml-1 text-lg">%</span>
                                    </p>
                                    <p className="mt-1 text-[11px] text-indigo-700">
                                        Gabungan kelengkapan dan verifikasi
                                    </p>
                                </div>
                                <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-indigo-200 bg-white text-sm font-bold text-indigo-700">
                                    {Math.round(
                                        (Number(quality.complete_percent ?? 0) +
                                            Number(
                                                quality.verified_percent ?? 0,
                                            )) /
                                            2,
                                    )}
                                    %
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[
                                    [
                                        "Data lengkap",
                                        Number(quality.complete_percent ?? 0),
                                        colors.green,
                                        "Informasi utama tersedia",
                                    ],
                                    [
                                        "Data belum lengkap",
                                        Number(quality.incomplete_percent ?? 0),
                                        colors.amber,
                                        "Masih membutuhkan pelengkapan",
                                    ],
                                    [
                                        "Data terverifikasi",
                                        Number(quality.verified_percent ?? 0),
                                        colors.blue,
                                        "Telah melewati verifikasi",
                                    ],
                                ].map(([label, value, color, detail]) => (
                                    <div key={label}>
                                        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                                            <span className="font-medium text-slate-600">
                                                {label}
                                                <small className="ml-2 text-[10px] text-slate-400">
                                                    {detail}
                                                </small>
                                            </span>
                                            <b className="text-slate-900">
                                                {value}%
                                            </b>
                                        </div>
                                        <ProgressIndicator
                                            value={Number(value)}
                                            color={String(color)}
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-400">
                                Duplikasi dan histori verifikasi belum tersedia
                                pada sumber data saat ini.
                            </p>
                        </div>
                    </ChartCard>
                )}
            </section>

            {isVisible("maintenance") && (
                <section className={`${dashboardCardClass} overflow-hidden`}>
                    <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-5">
                        <SectionHeader
                            eyebrow="Ringkasan perawatan"
                            title="Ringkasan perawatan"
                            description="Prioritas penanganan berdasarkan kondisi inventaris saat ini"
                            action={
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                                    Tampilan operasional
                                </span>
                            }
                        />
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-blue-100 bg-white p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">
                                    Backlog perbaikan
                                </p>
                                <p className="mt-1 text-2xl font-bold tracking-tight text-blue-950">
                                    {formatNumber(
                                        Number(condition.dalam_perbaikan ?? 0),
                                    )}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Unit sedang ditangani
                                </p>
                            </div>
                            <div className="rounded-2xl border border-red-100 bg-white p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600">
                                    Risiko tinggi
                                </p>
                                <p className="mt-1 text-2xl font-bold tracking-tight text-red-950">
                                    {formatNumber(
                                        Number(condition.rusak_berat ?? 0),
                                    )}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Unit rusak berat
                                </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Porsi perlu tindakan
                                </p>
                                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                                    {totalInventory
                                        ? Math.round(
                                              ((Number(
                                                  condition.dalam_perbaikan ??
                                                      0,
                                              ) +
                                                  Number(
                                                      condition.rusak_berat ??
                                                          0,
                                                  )) /
                                                  totalInventory) *
                                                  100,
                                          )
                                        : 0}
                                    %
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Dari total inventaris
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            [
                                "Sedang diperbaiki",
                                Number(condition.dalam_perbaikan ?? 0),
                                colors.blue,
                                "Perlu ditindaklanjuti",
                            ],
                            [
                                "Rusak berat",
                                Number(condition.rusak_berat ?? 0),
                                colors.red,
                                "Prioritas pemeriksaan",
                            ],
                            [
                                "Selesai diperbaiki",
                                null,
                                colors.green,
                                "Belum ada sumber data",
                            ],
                            [
                                "Biaya perbaikan",
                                null,
                                colors.navy,
                                "Belum ada sumber data",
                            ],
                        ].map(([label, value, color, detail]) => (
                            <div
                                key={label}
                                className="rounded-2xl border border-slate-200 bg-white p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-700">
                                        {label}
                                    </span>
                                    <i
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ background: color }}
                                    />
                                </div>
                                <p className="mt-3 text-xl font-bold tracking-tight text-slate-950">
                                    {value === null
                                        ? "Belum tersedia"
                                        : formatNumber(Number(value))}
                                </p>
                                <span className="mt-1 block text-[11px] text-slate-400">
                                    {value === null ? detail : "Unit"}
                                </span>
                                <div className="mt-3">
                                    <ProgressIndicator
                                        value={
                                            value === null
                                                ? 0
                                                : Math.min(
                                                      (Number(value) /
                                                          Math.max(
                                                              totalInventory,
                                                              1,
                                                          )) *
                                                          100,
                                                      100,
                                                  )
                                        }
                                        color={String(color)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {isVisible("executive") && (
                <section className={`${dashboardCardClass} overflow-hidden`}>
                    <div className="border-b border-emerald-800 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 px-5 py-5">
                        <SectionHeader
                            tone="dark"
                            eyebrow="Insight cerdas"
                            title="Insight & rekomendasi"
                            description="Sinyal operasional yang dapat ditindaklanjuti dari data inventaris"
                            action={
                                <span className="rounded-full border border-emerald-200/20 bg-emerald-100/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-100">
                                    Tampilan eksekutif
                                </span>
                            }
                        />
                    </div>
                    <div className="grid gap-4 bg-emerald-50/30 p-5 md:grid-cols-2">
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                        Insight utama
                                    </p>
                                    <h3 className="mt-1 text-base font-bold text-emerald-950">
                                        Area perlu perhatian
                                    </h3>
                                </div>
                                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-emerald-700">
                                    Prioritas
                                </span>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-slate-700">
                                {lowSource
                                    ? `Sumber ${lowSource.name} memiliki jumlah kerusakan tertinggi berdasarkan data saat ini.`
                                    : "Belum cukup data untuk membuat insight."}
                            </p>
                            <div className="mt-4 border-t border-emerald-200/70 pt-3 text-[11px] text-emerald-800">
                                Gunakan insight ini untuk menentukan urutan
                                pemeriksaan aset.
                            </div>
                        </div>
                        <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                                        Rekomendasi tindakan
                                    </p>
                                    <h3 className="mt-1 text-base font-bold text-teal-950">
                                        Langkah berikutnya
                                    </h3>
                                </div>
                                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-teal-700">
                                    Tindakan
                                </span>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-slate-700">
                                {Number(condition.rusak_berat ?? 0) > 0
                                    ? "Prioritaskan pemeriksaan aset dengan kondisi rusak berat."
                                    : "Belum ada rekomendasi tindakan dari data yang tersedia."}
                            </p>
                            <div className="mt-4 border-t border-teal-200/70 pt-3 text-[11px] text-teal-800">
                                Prioritas disusun berdasarkan kondisi inventaris
                                yang tersedia.
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Analitik
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-slate-900">
                        Insight inventaris
                    </h2>
                </div>
                <div className="grid divide-y divide-slate-200 sm:grid-cols-2 xl:grid-cols-3 xl:divide-x xl:divide-y-0">
                    {[
                        [
                            "Sumber terbanyak",
                            topSource,
                            "Berdasarkan jumlah unit",
                            colors.indigo,
                        ],
                        [
                            "Kerusakan tertinggi",
                            damagedSource,
                            "Perlu prioritas monitoring",
                            colors.red,
                        ],
                        [
                            "Perlu diperbaiki",
                            formatNumber(
                                Number(condition.dalam_perbaikan ?? 0),
                            ),
                            "Unit dalam penanganan",
                            colors.blue,
                        ],
                        [
                            "Kondisi baik",
                            `${goodPercent}%`,
                            "Dari total inventaris",
                            colors.green,
                        ],
                        [
                            "Perubahan bulan ini",
                            `${formatNumber(Number(stats.mutations ?? 0))} aktivitas`,
                            "Mutasi tercatat",
                            colors.amber,
                        ],
                        [
                            "Estimasi nilai aset",
                            formatMoney(Number(stats.total_value ?? 0)),
                            "Nilai perolehan",
                            colors.navy,
                        ],
                    ].map(([label, value, detail, color]) => (
                        <div key={label} className="p-4">
                            <div
                                className="mb-3 h-1 w-8 rounded-full"
                                style={{ background: color }}
                            />
                            <p className="text-xs text-slate-500">{label}</p>
                            <p className="mt-1 truncate text-lg font-bold text-slate-900">
                                {value}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                                {detail}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {isVisible("attention") && (
                <section>
                    <SectionHeader
                        eyebrow="Perlu perhatian"
                        title="Perlu perhatian"
                        description="Data yang memerlukan tindak lanjut"
                    />
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            [
                                "Rusak berat",
                                Number(condition.rusak_berat ?? 0),
                                "Laporan kondisi",
                                colors.red,
                                "laporan-kondisi",
                            ],
                            [
                                "Sedang diperbaiki",
                                Number(condition.dalam_perbaikan ?? 0),
                                "Tindak lanjut perbaikan",
                                colors.blue,
                                "laporan-kondisi",
                            ],
                            [
                                "Data tanpa foto",
                                Number(stats.no_photo ?? 0),
                                "Lengkapi dokumentasi",
                                colors.amber,
                                "asset-inventaris",
                            ],
                            [
                                "Data tanpa lokasi",
                                Number(stats.no_location ?? 0),
                                "Lengkapi lokasi aset",
                                colors.indigo,
                                "asset-inventaris",
                            ],
                        ].map(([label, value, detail, color, page]) => (
                            <AlertItem
                                key={label}
                                label={label}
                                value={value}
                                detail={detail}
                                color={color}
                                onClick={() => onNavigate(page)}
                            />
                        ))}
                    </div>
                </section>
            )}

            <section className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
                <div className={`${dashboardCardClass} overflow-hidden`}>
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Inventory register
                            </p>
                            <div className="mt-1 flex flex-wrap items-baseline gap-2">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Inventaris terbaru
                                </h2>
                                <span className="text-xs text-slate-400">
                                    {formatNumber(filteredRows.length)} hasil
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onNavigate("asset-inventaris")}
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                            Lihat semua <span aria-hidden="true">→</span>
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        {filteredRows.length ? (
                            <table className="w-full min-w-[760px] text-left">
                                <caption className="sr-only">
                                    Daftar inventaris terbaru,{" "}
                                    {filteredRows.length} hasil
                                </caption>
                                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                                    <tr>
                                        {[
                                            "Kode Barang",
                                            "Nama Barang",
                                            "Sumber",
                                            "Lokasi",
                                            "Kondisi",
                                            "Jumlah",
                                            "Tanggal Update",
                                            "Status",
                                        ].map((head) => (
                                            <th
                                                key={head}
                                                scope="col"
                                                className="px-4 py-3 font-semibold"
                                            >
                                                {head}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleRows.map((asset: any) => (
                                        <tr
                                            key={asset.id}
                                            tabIndex={0}
                                            role="link"
                                            onClick={() =>
                                                onNavigate(
                                                    getAssetDetailRoute(
                                                        asset.id,
                                                    ),
                                                )
                                            }
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === "Enter" ||
                                                    event.key === " "
                                                ) {
                                                    event.preventDefault();
                                                    onNavigate(
                                                        getAssetDetailRoute(
                                                            asset.id,
                                                        ),
                                                    );
                                                }
                                            }}
                                            className="cursor-pointer border-t border-slate-100 text-xs outline-none transition hover:bg-slate-50 focus:bg-slate-50 focus:ring-2 focus:ring-inset focus:ring-slate-300"
                                        >
                                            <td className="px-4 py-3 font-medium text-slate-500">
                                                {asset.code ?? "-"}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-900">
                                                {asset.name ?? "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {asset.source ?? "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {asset.unit ?? "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge
                                                    label={asset.condition}
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-700">
                                                {formatNumber(asset.quantity)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-400">
                                                {asset.updated_at}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge
                                                    label={asset.status}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <EmptyState
                                onAdd={() => resetFilters()}
                                title="Tidak ada hasil yang cocok"
                                description="Coba ubah kata kunci atau filter untuk melihat inventaris lainnya."
                                actionLabel="Reset pencarian dan filter"
                            />
                        )}
                    </div>
                    {filteredRows.length > pageSize && (
                        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
                            <span className="text-xs text-slate-500">
                                Halaman {tablePage} dari {pageCount}
                            </span>
                            <div className="flex gap-1">
                                {Array.from(
                                    { length: pageCount },
                                    (_, index) => index + 1,
                                ).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setTablePage(page)}
                                        className={`h-7 min-w-7 rounded-md px-2 text-xs ${tablePage === page ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {isVisible("activity") && (
                    <div className={`${dashboardCardClass} overflow-hidden`}>
                        <div className="border-b border-slate-200 px-5 py-4">
                            <SectionHeader
                                eyebrow="Aktivitas terbaru"
                                title="Aktivitas terbaru"
                                description="Perubahan terakhir pada inventaris"
                            />
                        </div>
                        <div className="divide-y divide-slate-100">
                            {activities.length ? (
                                activities.map((activity: any) => (
                                    <ActivityItem
                                        key={activity.id}
                                        user={activity.user ?? "Sistem"}
                                        activity={
                                            activity.activity ??
                                            "memperbarui data"
                                        }
                                        unit={activity.unit ?? "Yayasan"}
                                        time={activity.time ?? "Baru saja"}
                                    />
                                ))
                            ) : (
                                <div className="p-5 text-sm text-slate-500">
                                    Belum ada aktivitas terbaru.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
