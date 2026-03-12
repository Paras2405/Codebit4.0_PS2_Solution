import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/lib/api";

type GovernanceCase = {
  employee_id?: string;
  employee_name?: string;
  employee_email?: string;
  employee_data?: Record<string, number>;
  ai_analysis?: { risk_level?: string };
  manager_review?: Record<string, unknown>;
  hr_review?: {
    policy_violations?: string[];
    violation_count?: number;
    governance_risk_score?: number;
    hr_recommendation?: string;
    next_step?: string;
  };
  site_head_review?: {
    decision?: string;
    conflict_detected?: boolean;
    next_step?: string;
  } | null;
  hr_second_review?: {
    hr_decision?: string;
    hr_comment?: string;
    reviewed_at?: string;
  } | null;
  latest_report?: {
    report_content?: string | null;
    summary?: Record<string, unknown> | null;
    created_at?: string | null;
  } | null;
};

const EmployeeReview = () => {
  const { employeeId } = useParams();
  const [caseData, setCaseData] = useState<GovernanceCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [decisionNote, setDecisionNote] = useState("");
  const [hrSecondDecision, setHrSecondDecision] = useState("REVIEW_REQUIRED");

  const loadCase = async () => {
    if (!employeeId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/governance/sitehead/case/${employeeId}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to fetch case. Status ${response.status}`);
      }
      setCaseData(payload?.case || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to fetch case details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [employeeId]);

  const handleSiteHeadDecision = async (decision: string) => {
    if (!employeeId) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/governance/sitehead/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          site_head_decision: decision,
          decision_note: decisionNote,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to submit site head decision. Status ${response.status}`);
      }

      setMessage(payload?.message || "Site head decision recorded.");
      await loadCase();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit site head decision");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHrSecondReview = async () => {
    if (!employeeId) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/governance/hr/second-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          hr_decision: hrSecondDecision,
          hr_comment: decisionNote,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to record HR second review. Status ${response.status}`);
      }

      setMessage(payload?.message || "HR second review recorded.");
      await loadCase();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to record HR second review");
    } finally {
      setSubmitting(false);
    }
  };

  const policyViolations = useMemo(() => {
    if (!Array.isArray(caseData?.hr_review?.policy_violations)) {
      return [];
    }
    return caseData?.hr_review?.policy_violations || [];
  }, [caseData]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading case review...</p>;
  }

  if (error && !caseData) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/site-head/pending" className="inline-flex items-center text-xs font-semibold text-primary uppercase tracking-wider hover:underline">
        <ArrowLeft className="mr-1 h-3 w-3" /> Back to Pending Decisions
      </Link>

      <div className="rounded-lg border border-border bg-card p-5">
        <h1 className="text-xl font-bold text-foreground">Employee Governance Evaluation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {(caseData?.employee_name || "Unnamed Employee") + " - " + (caseData?.employee_email || caseData?.employee_id || "-")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">AI Risk Level</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{caseData?.ai_analysis?.risk_level || "-"}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">HR Recommendation</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{caseData?.hr_review?.hr_recommendation || "-"}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Governance Score</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{Number(caseData?.hr_review?.governance_risk_score ?? 0).toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Violation Count</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{Number(caseData?.hr_review?.violation_count ?? 0)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground">HR Policy Violations</h2>
          {policyViolations.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-2">No violations recorded for this case.</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm text-foreground">
              {policyViolations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground">Manager Report (considered in evaluation)</h2>
          {!caseData?.latest_report ? (
            <p className="text-sm text-muted-foreground mt-2">No generated manager report found.</p>
          ) : (
            <div className="space-y-2 mt-3 text-sm">
              <p><strong>Generated At:</strong> {caseData.latest_report.created_at || "-"}</p>
              <div className="rounded border border-border bg-muted/20 p-3 whitespace-pre-wrap text-muted-foreground">
                {caseData.latest_report.report_content || "No report content."}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Site Head Decision</h2>
        <Textarea
          rows={4}
          value={decisionNote}
          onChange={(event) => setDecisionNote(event.target.value)}
          placeholder="Provide decision notes and executive rationale..."
        />
        <div className="flex flex-wrap gap-2">
          <Button disabled={submitting} onClick={() => handleSiteHeadDecision("APPROVE")}>Approve</Button>
          <Button disabled={submitting} variant="outline" onClick={() => handleSiteHeadDecision("EXTEND_PROBATION")}>Extension</Button>
          <Button disabled={submitting} variant="destructive" onClick={() => handleSiteHeadDecision("TERMINATE")}>Reject</Button>
        </div>
        {caseData?.site_head_review ? (
          <div className="rounded border border-border p-3 text-sm">
            <p><strong>Decision:</strong> {caseData.site_head_review.decision || "-"}</p>
            <p><strong>Conflict Detected:</strong> {String(Boolean(caseData.site_head_review.conflict_detected))}</p>
            <p><strong>Next Step:</strong> {caseData.site_head_review.next_step || "-"}</p>
          </div>
        ) : null}
      </div>

      {caseData?.site_head_review?.next_step === "HR_RE_REVIEW" ? (
        <div className="rounded-lg border border-warning/20 bg-warning/5 p-5 space-y-3">
          <h2 className="font-semibold text-warning">Escalated To HR Second Review</h2>
          <p className="text-sm text-muted-foreground">Conflict occurred at site-head decision stage. Record HR second review to continue closure.</p>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={hrSecondDecision}
            onChange={(event) => setHrSecondDecision(event.target.value)}
          >
            <option value="SAFE">SAFE</option>
            <option value="REVIEW_REQUIRED">REVIEW_REQUIRED</option>
            <option value="ESCALATE">ESCALATE</option>
          </select>
          <Button disabled={submitting} onClick={handleHrSecondReview}>Submit HR Second Review</Button>
          {caseData?.hr_second_review ? (
            <p className="text-sm text-success">HR second review submitted: {caseData.hr_second_review.hr_decision || "-"}</p>
          ) : null}
        </div>
      ) : null}

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
};

export default EmployeeReview;
