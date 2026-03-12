import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/api";

type GovernanceCase = {
  employee_id?: string;
  employee_name?: string;
  employee_email?: string | null;
  ai_analysis?: { risk_level?: string } | null;
  hr_review?: {
    hr_recommendation?: string;
    governance_risk_score?: number;
    next_step?: string;
  } | null;
  site_head_review?: {
    decision?: string;
    conflict_detected?: boolean;
    next_step?: string;
  } | null;
  governance_status?: string;
  updated_at?: string;
};

type StatsPayload = {
  total_cases?: number;
  pending_cases?: number;
  resolved_cases?: number;
  escalated_cases?: number;
  high_risk_cases?: number;
  avg_governance_score?: number;
};

const PendingDecisions = () => {
  const [search, setSearch] = useState("");
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
        setError(loadError instanceof Error ? loadError.message : "Unable to load pending decisions");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return cases;
    }

    return cases.filter((item) => [item.employee_name, item.employee_email, item.employee_id]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q));
  }, [cases, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pending Governance Decisions</h1>
        <p className="text-sm text-muted-foreground">
          Site-head review queue with manager and HR governance outcomes for each employee.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Cases</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats?.total_cases ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-warning mt-1">{stats?.pending_cases ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold text-success mt-1">{stats?.resolved_cases ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Escalated</p>
          <p className="text-2xl font-bold text-destructive mt-1">{stats?.escalated_cases ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">High Risk Cases</p>
          <p className="text-2xl font-bold text-destructive mt-1">{stats?.high_risk_cases ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Governance Score</p>
          <p className="text-2xl font-bold text-foreground mt-1">{Number(stats?.avg_governance_score ?? 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search employee name, email or id..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3">Employee</th>
              <th className="px-5 py-3">AI Risk</th>
              <th className="px-5 py-3">HR Recommendation</th>
              <th className="px-5 py-3">Governance Score</th>
              <th className="px-5 py-3">Current Status</th>
              <th className="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-5 py-6 text-sm text-muted-foreground" colSpan={6}>Loading governance cases...</td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-5 py-6 text-sm text-destructive" colSpan={6}>{error}</td>
              </tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-sm text-muted-foreground" colSpan={6}>No matching governance cases found.</td>
              </tr>
            ) : filteredCases.map((item) => (
              <tr key={item.employee_id || item.employee_email} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-foreground">{item.employee_name || "Unnamed Employee"}</p>
                  <p className="text-[10px] text-muted-foreground">{item.employee_email || item.employee_id || "-"}</p>
                </td>
                <td className="px-5 py-4 text-sm text-foreground">{item.ai_analysis?.risk_level || "-"}</td>
                <td className="px-5 py-4 text-sm text-foreground">{item.hr_review?.hr_recommendation || "Pending"}</td>
                <td className="px-5 py-4 text-sm text-foreground">{Number(item.hr_review?.governance_risk_score ?? 0).toFixed(2)}</td>
                <td className="px-5 py-4 text-sm text-foreground">{item.governance_status || "PENDING"}</td>
                <td className="px-5 py-4">
                  <Link to={`/site-head/review/${item.employee_id || ""}`} className="text-sm font-semibold text-primary hover:underline">
                    Open Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingDecisions;
