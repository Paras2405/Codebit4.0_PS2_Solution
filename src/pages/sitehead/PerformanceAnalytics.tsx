import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

type GovernanceCase = {
  employee_id?: string;
  employee_name?: string;
  employee_data?: { department?: string } | null;
  ai_analysis?: { risk_level?: string } | null;
  hr_review?: { governance_risk_score?: number } | null;
  site_head_review?: { decision?: string; conflict_detected?: boolean } | null;
  governance_status?: string;
  updated_at?: string;
  latest_report?: {
    id?: string | null;
    generation_source?: string | null;
    created_at?: string | null;
  } | null;
};

type StatsPayload = {
  total_cases?: number;
  pending_cases?: number;
  resolved_cases?: number;
  escalated_cases?: number;
  high_risk_cases?: number;
};

const UNDER_REVIEW_STATUSES = new Set([
  "PENDING",
  "SITE_HEAD_REVIEW",
  "HR_RE_REVIEW",
  "JUSTIFICATION_REQUIRED",
  "HOLD",
]);

const PIE_COLORS = ["#16a34a", "#f59e0b", "#dc2626"];

const formatMonth = (value?: string | null) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short" });
};

const PerformanceAnalytics = () => {
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
          throw new Error(casesPayload?.error || `Unable to load analytics cases. Status ${casesResponse.status}`);
        }

        if (!statsResponse.ok) {
          throw new Error(statsPayload?.error || `Unable to load analytics stats. Status ${statsResponse.status}`);
        }

        setCases(Array.isArray(casesPayload?.cases) ? casesPayload.cases : []);
        setStats(statsPayload || null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load performance analytics");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const reportMetrics = useMemo(() => {
    const reportSourceCount = new Map<string, number>();
    const intakeByMonth = new Map<string, number>();
    let withReport = 0;

    for (const item of cases) {
      const report = item.latest_report;
      if (!report?.id) {
        continue;
      }

      withReport += 1;
      const source = String(report.generation_source || "UNKNOWN").toUpperCase();
      reportSourceCount.set(source, (reportSourceCount.get(source) || 0) + 1);

      const month = formatMonth(report.created_at || item.updated_at || null);
      intakeByMonth.set(month, (intakeByMonth.get(month) || 0) + 1);
    }

    return {
      withReport,
      sourceData: Array.from(reportSourceCount.entries()).map(([source, count]) => ({ source, count })),
      intakeTrend: Array.from(intakeByMonth.entries()).map(([month, reports]) => ({ month, reports })),
    };
  }, [cases]);

  const departmentData = useMemo(() => {
    const byDepartment = new Map<string, { total: number; underReview: number }>();

    for (const item of cases) {
      const department = String(item.employee_data?.department || "Unassigned");
      const status = String(item.governance_status || "PENDING").toUpperCase();
      const current = byDepartment.get(department) || { total: 0, underReview: 0 };

      current.total += 1;
      if (UNDER_REVIEW_STATUSES.has(status)) {
        current.underReview += 1;
      }

      byDepartment.set(department, current);
    }

    return Array.from(byDepartment.entries()).map(([department, values]) => ({
      department,
      totalCases: values.total,
      underReview: values.underReview,
    }));
  }, [cases]);

  const riskDistribution = useMemo(() => {
    const buckets = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    for (const item of cases) {
      const risk = String(item.ai_analysis?.risk_level || "").toUpperCase();
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

  const underReviewEmployees = useMemo(() => cases
    .filter((item) => UNDER_REVIEW_STATUSES.has(String(item.governance_status || "PENDING").toUpperCase()))
    .sort((left, right) => Number(right.hr_review?.governance_risk_score || 0) - Number(left.hr_review?.governance_risk_score || 0))
    .slice(0, 12)
    .map((item) => ({
      name: item.employee_name || "Unnamed Employee",
      score: Number(item.hr_review?.governance_risk_score || 0),
      status: String(item.governance_status || "PENDING").toUpperCase(),
      risk: String(item.ai_analysis?.risk_level || "UNSET").toUpperCase(),
    })), [cases]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Real-time governance and report intelligence for Site Head decision-making.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Governance Cases</p>
            <p className="text-3xl font-bold text-foreground mt-1">{stats?.total_cases ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Employees Under Review</p>
            <p className="text-3xl font-bold text-warning mt-1">{stats?.pending_cases ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Reports Received</p>
            <p className="text-3xl font-bold text-foreground mt-1">{reportMetrics.withReport}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">High Risk Cases</p>
            <p className="text-3xl font-bold text-destructive mt-1">{stats?.high_risk_cases ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Loading live performance analytics...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department Governance Load</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="totalCases" fill="hsl(var(--primary) / 0.35)" name="Total Cases" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="underReview" fill="hsl(var(--primary))" name="Under Review" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={riskDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manager Report Intake Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={reportMetrics.intakeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Area type="monotone" dataKey="reports" stroke="#0f766e" fill="#14b8a61a" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={reportMetrics.sourceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="source" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employees Under Review</CardTitle>
        </CardHeader>
        <CardContent>
          {underReviewEmployees.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees are currently under review.</p>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={underReviewEmployees}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="score" fill="#ea580c" radius={[4, 4, 0, 0]} name="Governance Score" />
                </BarChart>
              </ResponsiveContainer>

              {underReviewEmployees.map((employee) => (
                <div key={`${employee.name}-${employee.status}`} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{employee.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Score {employee.score.toFixed(2)}</Badge>
                      <Badge variant="outline">Risk {employee.risk}</Badge>
                      <Badge>{employee.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceAnalytics;
