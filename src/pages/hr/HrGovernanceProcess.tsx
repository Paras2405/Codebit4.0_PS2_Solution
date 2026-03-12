import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/lib/api";

type GovernanceCase = {
  employee_id?: string;
  employee_name?: string;
  employee_email?: string | null;
  ai_analysis?: { risk_level?: string } | null;
  manager_review?: { manager_decision?: string; conflict_detected?: boolean } | null;
  hr_review?: { hr_recommendation?: string; governance_risk_score?: number } | null;
  site_head_review?: { decision?: string; conflict_detected?: boolean; next_step?: string } | null;
  hr_second_review?: { hr_decision?: string; hr_comment?: string; reviewed_at?: string } | null;
  governance_status?: string;
  updated_at?: string;
};

type HrStats = {
  total_cases?: number;
  awaiting_hr?: number;
  escalated_to_hr?: number;
  hr_second_review_completed?: number;
};

const HrGovernanceProcess = () => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<HrStats | null>(null);
  const [cases, setCases] = useState<GovernanceCase[]>([]);
  const [submittingEmployeeId, setSubmittingEmployeeId] = useState<string | null>(null);
  const [hrDecisionByEmployee, setHrDecisionByEmployee] = useState<Record<string, string>>({});
  const [hrCommentByEmployee, setHrCommentByEmployee] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [casesResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/governance/hr/cases`),
        fetch(`${API_BASE_URL}/api/governance/hr/stats`),
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
      setError(loadError instanceof Error ? loadError.message : "Unable to load HR governance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return cases;
    }

    return cases.filter((item) => [item.employee_name, item.employee_email, item.employee_id, item.governance_status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q));
  }, [cases, search]);

  const submitSecondReview = async (employeeId: string) => {
    const hrDecision = String(hrDecisionByEmployee[employeeId] || "REVIEW_REQUIRED").trim().toUpperCase();
    const hrComment = String(hrCommentByEmployee[employeeId] || "").trim();

    setSubmittingEmployeeId(employeeId);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/governance/hr/second-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          hr_decision: hrDecision,
          hr_comment: hrComment,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to submit HR second review. Status ${response.status}`);
      }

      setMessage(`HR second review submitted for employee ${employeeId}.`);
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit HR second review");
    } finally {
      setSubmittingEmployeeId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Governance Process Tracking</h1>
        <p className="text-sm text-muted-foreground">
          Validate manager-triggered governance pipeline results across HR and site-head stages.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Cases</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats?.total_cases ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Awaiting Site Head</p>
          <p className="text-2xl font-bold text-primary mt-1">{stats?.awaiting_hr ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Escalated To HR</p>
          <p className="text-2xl font-bold text-destructive mt-1">{stats?.escalated_to_hr ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">HR Re-Review Done</p>
          <p className="text-2xl font-bold text-success mt-1">{stats?.hr_second_review_completed ?? 0}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <Input
          placeholder="Search by employee, email, id, or status..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3">Employee</th>
              <th className="px-5 py-3">AI Risk</th>
              <th className="px-5 py-3">Manager Decision</th>
              <th className="px-5 py-3">HR Recommendation</th>
              <th className="px-5 py-3">Site Head</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-5 py-6 text-sm text-muted-foreground" colSpan={6}>Loading governance cases...</td>
              </tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-sm text-muted-foreground" colSpan={6}>No governance cases found.</td>
              </tr>
            ) : filteredCases.map((item) => (
              <tr key={item.employee_id || item.employee_email} className="border-b border-border last:border-0 align-top">
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-foreground">{item.employee_name || "Unnamed Employee"}</p>
                  <p className="text-[10px] text-muted-foreground">{item.employee_email || item.employee_id || "-"}</p>
                </td>
                <td className="px-5 py-4 text-sm text-foreground">{item.ai_analysis?.risk_level || "-"}</td>
                <td className="px-5 py-4 text-sm text-foreground">{item.manager_review?.manager_decision || "-"}</td>
                <td className="px-5 py-4 text-sm text-foreground">
                  {item.hr_review?.hr_recommendation || "Pending"}
                  <p className="text-[10px] text-muted-foreground">Score: {Number(item.hr_review?.governance_risk_score ?? 0).toFixed(2)}</p>
                </td>
                <td className="px-5 py-4 text-sm text-foreground">
                  {item.site_head_review?.decision || "Pending"}
                  <p className="text-[10px] text-muted-foreground">{item.site_head_review?.next_step || "-"}</p>
                </td>
                <td className="px-5 py-4 text-sm text-foreground">
                  <p>{item.governance_status || "PENDING"}</p>

                  {item.governance_status === "HR_RE_REVIEW" ? (
                    <div className="mt-3 space-y-2 rounded border border-warning/20 bg-warning/5 p-3">
                      <select
                        className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        value={hrDecisionByEmployee[item.employee_id || ""] || "REVIEW_REQUIRED"}
                        onChange={(event) => setHrDecisionByEmployee((prev) => ({
                          ...prev,
                          [item.employee_id || ""]: event.target.value,
                        }))}
                      >
                        <option value="SAFE">SAFE</option>
                        <option value="REVIEW_REQUIRED">REVIEW_REQUIRED</option>
                        <option value="ESCALATE">ESCALATE</option>
                      </select>
                      <Textarea
                        rows={2}
                        placeholder="HR second review comment"
                        value={hrCommentByEmployee[item.employee_id || ""] || ""}
                        onChange={(event) => setHrCommentByEmployee((prev) => ({
                          ...prev,
                          [item.employee_id || ""]: event.target.value,
                        }))}
                      />
                      <Button
                        size="sm"
                        disabled={submittingEmployeeId === item.employee_id}
                        onClick={() => submitSecondReview(String(item.employee_id || ""))}
                      >
                        {submittingEmployeeId === item.employee_id ? "Submitting..." : "Submit HR Re-Review"}
                      </Button>
                    </div>
                  ) : null}

                  {item.hr_second_review ? (
                    <p className="mt-2 text-[10px] text-success">
                      HR second review: {item.hr_second_review.hr_decision || "-"}
                    </p>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
};

export default HrGovernanceProcess;
