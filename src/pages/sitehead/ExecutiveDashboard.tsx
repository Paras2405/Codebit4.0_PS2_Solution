import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";

type GovernanceCase = {
  employee_id?: string;
  employee_name?: string;
  ai_analysis?: { risk_level?: string } | null;
  hr_review?: { governance_risk_score?: number; hr_recommendation?: string } | null;
  governance_status?: string;
  employee_data?: { department?: string } | null;
};

type StatsPayload = {
  total_cases?: number;
  pending_cases?: number;
  resolved_cases?: number;
  escalated_cases?: number;
  high_risk_cases?: number;
  avg_governance_score?: number;
};

const PIE_COLORS = ["#16a34a", "#f59e0b", "#dc2626"];

const ExecutiveDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<GovernanceCase[]>([]);
  const [stats, setStats] = useState<StatsPayload | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [casesResponse, statsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/governance/sitehead/cases`),
          fetch(`${API_BASE_URL}/api/governance/sitehead/stats`),
        ]);

        const casesPayload = await casesResponse.json().catch(() => ({}));
        const statsPayload = await statsResponse.json().catch(() => ({}));

        if (!casesResponse.ok) {
          throw new Error(casesPayload?.error || `Unable to load governance cases. Status ${casesResponse.status}`);
        }
        if (!statsResponse.ok) {
          throw new Error(statsPayload?.error || `Unable to load governance stats. Status ${statsResponse.status}`);
        }

        setCases(Array.isArray(casesPayload?.cases) ? casesPayload.cases : []);
        setStats(statsPayload || null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load site head dashboard");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const recommendationChart = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of cases) {
      const key = String(item?.hr_review?.hr_recommendation || "UNSET").toUpperCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [cases]);

  const riskDistribution = useMemo(() => {
    const buckets = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    for (const item of cases) {
      const risk = String(item?.ai_analysis?.risk_level || "").toUpperCase();
      if (risk === "LOW" || risk === "MEDIUM" || risk === "HIGH") {
        buckets[risk] += 1;
      }
    }
    return [
      { name: "LOW", value: buckets.LOW },
      { name: "MEDIUM", value: buckets.MEDIUM },
      { name: "HIGH", value: buckets.HIGH },
    ];
  }, [cases]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Site Head Governance Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Consolidated statistics and evaluation outcomes across manager and HR governance layers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Cases</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats?.total_cases ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-warning mt-1">{stats?.pending_cases ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold text-success mt-1">{stats?.resolved_cases ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Escalated</p>
          <p className="text-2xl font-bold text-destructive mt-1">{stats?.escalated_cases ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">High Risk</p>
          <p className="text-2xl font-bold text-destructive mt-1">{stats?.high_risk_cases ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Avg Gov Score</p>
          <p className="text-2xl font-bold text-foreground mt-1">{Number(stats?.avg_governance_score ?? 0).toFixed(2)}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Loading site head analytics...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground mb-3">HR Recommendation Distribution</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={recommendationChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground mb-3">AI Risk Level Mix</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={riskDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveDashboard;
