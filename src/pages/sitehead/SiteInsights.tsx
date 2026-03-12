import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { API_BASE_URL } from "@/lib/api";
import { Sparkles, TrendingUp, AlertTriangle } from "lucide-react";

type GovernanceCase = {
  employee_data?: { department?: string } | null;
  ai_analysis?: { risk_level?: string } | null;
  site_head_review?: { conflict_detected?: boolean } | null;
  governance_status?: string;
  updated_at?: string;
};

type StatsPayload = {
  total_cases?: number;
  pending_cases?: number;
  resolved_cases?: number;
  escalated_cases?: number;
  high_risk_cases?: number;
};

type InsightSeverity = "positive" | "warning" | "critical";

const severityStyle: Record<InsightSeverity, { bg: string; icon: typeof TrendingUp; iconColor: string }> = {
  positive: { bg: "bg-green-50 border-green-200", icon: TrendingUp, iconColor: "text-green-600" },
  warning: { bg: "bg-amber-50 border-amber-200", icon: AlertTriangle, iconColor: "text-amber-600" },
  critical: { bg: "bg-destructive/5 border-destructive/20", icon: AlertTriangle, iconColor: "text-destructive" },
};

const SiteInsights = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [cases, setCases] = useState<GovernanceCase[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const [casesResponse, statsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/governance/sitehead/cases`),
          fetch(`${API_BASE_URL}/api/governance/sitehead/stats`),
        ]);

        const casesPayload = await casesResponse.json().catch(() => ({}));
        const statsPayload = await statsResponse.json().catch(() => ({}));

        if (!casesResponse.ok) {
          throw new Error(casesPayload?.error || `Unable to load site cases. Status ${casesResponse.status}`);
        }
        if (!statsResponse.ok) {
          throw new Error(statsPayload?.error || `Unable to load site stats. Status ${statsResponse.status}`);
        }

        if (!isActive) {
          return;
        }

        setCases(Array.isArray(casesPayload?.cases) ? casesPayload.cases : []);
        setStats(statsPayload || null);
        setLastUpdated(new Date().toISOString());
        setError(null);
      } catch (loadError) {
        if (!isActive) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load real-time insights");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void load();
    const timer = setInterval(() => {
      void load();
    }, 20000);

    return () => {
      isActive = false;
      clearInterval(timer);
    };
  }, []);

  const deptSummary = useMemo(() => {
    const map = new Map<string, { total: number; highRisk: number }>();

    for (const item of cases) {
      const department = String(item.employee_data?.department || "Unassigned");
      const riskLevel = String(item.ai_analysis?.risk_level || "").toUpperCase();
      const current = map.get(department) || { total: 0, highRisk: 0 };
      current.total += 1;
      if (riskLevel === "HIGH") {
        current.highRisk += 1;
      }
      map.set(department, current);
    }

    return Array.from(map.entries())
      .map(([department, values]) => ({
        department,
        total: values.total,
        highRiskShare: values.total > 0 ? Math.round((values.highRisk / values.total) * 100) : 0,
      }))
      .sort((left, right) => right.highRiskShare - left.highRiskShare);
  }, [cases]);

  const insightCards = useMemo(() => {
    const totalCases = stats?.total_cases ?? 0;
    const highRiskCases = stats?.high_risk_cases ?? 0;
    const escalatedCases = stats?.escalated_cases ?? 0;
    const pendingCases = stats?.pending_cases ?? 0;

    const highRiskRatio = totalCases > 0 ? Math.round((highRiskCases / totalCases) * 100) : 0;
    const escalationRatio = totalCases > 0 ? Math.round((escalatedCases / totalCases) * 100) : 0;

    const generated: Array<{ title: string; description: string; severity: InsightSeverity }> = [
      {
        title: "Governance Completion Momentum",
        description: `${stats?.resolved_cases ?? 0} of ${totalCases} cases are resolved. Keep current review velocity to reduce backlog.`,
        severity: pendingCases <= 2 ? "positive" : "warning",
      },
      {
        title: "High-Risk Exposure",
        description: `${highRiskCases} high-risk cases (${highRiskRatio}%) are active in the current governance pool.`,
        severity: highRiskRatio >= 40 ? "critical" : highRiskRatio >= 20 ? "warning" : "positive",
      },
      {
        title: "Escalation Pressure",
        description: `${escalatedCases} cases are escalated (${escalationRatio}% of total) and require policy-level attention.`,
        severity: escalationRatio >= 30 ? "critical" : escalationRatio > 0 ? "warning" : "positive",
      },
    ];

    return generated;
  }, [stats]);

  const stabilityIndex = useMemo(() => {
    const totalCases = stats?.total_cases ?? 0;
    const resolvedCases = stats?.resolved_cases ?? 0;
    const escalatedCases = stats?.escalated_cases ?? 0;

    if (totalCases <= 0) {
      return 100;
    }

    const resolvedShare = resolvedCases / totalCases;
    const escalationPenalty = escalatedCases / totalCases;
    const value = Math.round((resolvedShare * 100) - (escalationPenalty * 35) + 50);
    return Math.max(0, Math.min(100, value));
  }, [stats]);

  const lastRefreshText = useMemo(() => {
    if (!lastUpdated) {
      return "Not refreshed yet";
    }
    return new Date(lastUpdated).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [lastUpdated]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Site Insights</h1>
        <p className="text-muted-foreground text-sm">
          Real-time strategic intelligence generated from live governance outcomes.
        </p>
        <p className="text-xs text-muted-foreground mt-1">Last refreshed: {lastRefreshText}</p>
      </div>

      {error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <p className="text-xs uppercase font-semibold opacity-80">Governance Stability Index</p>
            <p className="text-4xl font-bold mt-2">{stabilityIndex}%</p>
            <Progress value={stabilityIndex} className="h-2 mt-3 bg-primary-foreground/20" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">High-Risk Departments</CardTitle>
          </CardHeader>
          <CardContent>
            {deptSummary.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground">No department governance data available.</p>
            ) : (
              <div className="space-y-2">
                {deptSummary.slice(0, 5).map((item) => (
                  <div key={item.department} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <span className="text-sm text-foreground">{item.department}</span>
                    <Badge variant="outline">{item.highRiskShare}% high risk</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Queue Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="text-sm text-foreground">Pending Review</span>
              <Badge>{stats?.pending_cases ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="text-sm text-foreground">Escalated Cases</span>
              <Badge variant="outline">{stats?.escalated_cases ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="text-sm text-foreground">Resolved Cases</span>
              <Badge variant="secondary">{stats?.resolved_cases ?? 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Real-Time Strategic Insights
        </h2>
        <div className="space-y-4">
          {insightCards.map((insight, index) => {
            const style = severityStyle[insight.severity];
            return (
              <Card key={`${insight.title}-${index}`} className={`${style.bg} border`}>
                <CardContent className="flex items-start gap-4 p-5">
                  <style.icon className={`h-6 w-6 ${style.iconColor} shrink-0 mt-0.5`} />
                  <div>
                    <h3 className="font-semibold text-foreground">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SiteInsights;
