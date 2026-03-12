import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/lib/api";

type GovernanceContext = {
  employee?: {
    id: string;
    full_name?: string;
    email?: string;
    role?: string;
    department?: string;
  };
  employee_data?: Record<string, number>;
  ai_risk_level?: string;
  latest_report?: {
    id?: string | null;
    created_at?: string | null;
    report_content?: string | null;
    summary?: Record<string, unknown> | null;
  } | null;
  governance_case?: {
    manager_result?: Record<string, unknown>;
    hr_review?: Record<string, unknown>;
  } | null;
};

const toTitle = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const flattenObject = (input: unknown, prefix = ""): string[] => {
  if (input === null || input === undefined) {
    return [];
  }

  if (typeof input !== "object") {
    return prefix ? [`${toTitle(prefix)}: ${String(input)}`] : [String(input)];
  }

  if (Array.isArray(input)) {
    if (input.length === 0) {
      return [];
    }

    return input.flatMap((item, index) => flattenObject(item, prefix ? `${prefix} ${index + 1}` : `${index + 1}`));
  }

  return Object.entries(input as Record<string, unknown>).flatMap(([key, value]) => {
    const nextPrefix = prefix ? `${prefix} ${key}` : key;

    if (typeof value === "object" && value !== null) {
      return flattenObject(value, nextPrefix);
    }

    return [`${toTitle(nextPrefix)}: ${String(value)}`];
  });
};

const formatReportContent = (rawContent: string | null | undefined) => {
  const content = String(rawContent || "").trim();
  if (!content) {
    return "No report content.";
  }

  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;

    const lines: string[] = [];
    if (parsed.report_title) {
      lines.push(`Report Title: ${String(parsed.report_title)}`);
    }

    if (parsed.employee_details && typeof parsed.employee_details === "object") {
      lines.push("");
      lines.push("Employee Details:");
      lines.push(...flattenObject(parsed.employee_details).map((line) => `- ${line}`));
    }

    if (parsed.performance_metrics && typeof parsed.performance_metrics === "object") {
      lines.push("");
      lines.push("Performance Metrics:");
      lines.push(...flattenObject(parsed.performance_metrics).map((line) => `- ${line}`));
    }

    if (parsed.evaluation && typeof parsed.evaluation === "object") {
      lines.push("");
      lines.push("Evaluation Summary:");
      lines.push(...flattenObject(parsed.evaluation).map((line) => `- ${line}`));
    }

    const consumedKeys = new Set(["report_title", "employee_details", "performance_metrics", "evaluation"]);
    const remainingEntries = Object.entries(parsed).filter(([key]) => !consumedKeys.has(key));
    if (remainingEntries.length > 0) {
      lines.push("");
      lines.push("Additional Details:");
      for (const [key, value] of remainingEntries) {
        lines.push(...flattenObject(value, key).map((line) => `- ${line}`));
      }
    }

    return lines.join("\n").trim() || content;
  } catch {
    return content;
  }
};

const ManagerEmployeeDetail = () => {
  const { id } = useParams();
  const [context, setContext] = useState<GovernanceContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [managerDecision, setManagerDecision] = useState("ACCEPT");
  const [managerComment, setManagerComment] = useState("");
  const [confidenceScore, setConfidenceScore] = useState("0.65");

  const [justificationText, setJustificationText] = useState("");
  const [attachmentText, setAttachmentText] = useState("");
  const [justificationResult, setJustificationResult] = useState<Record<string, unknown> | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<Record<string, unknown> | null>(null);
  const [hrResult, setHrResult] = useState<Record<string, unknown> | null>(null);

  const loadContext = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/governance/employee/${id}/context`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Unable to fetch governance context. Status ${response.status}`);
      }
      const payload = await response.json();
      setContext(payload);
      setFeedbackResult((payload?.governance_case?.manager_result as Record<string, unknown>) || null);
      setHrResult((payload?.governance_case?.hr_review as Record<string, unknown>) || null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to fetch governance context");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContext();
  }, [id]);

  const requiresJustification = useMemo(() => {
    const conflict = Boolean(feedbackResult?.conflict_detected);
    const required = Boolean(feedbackResult?.justification_required);
    return conflict || required;
  }, [feedbackResult]);

  const hrRecommendation = useMemo(() => {
    const value = hrResult as {
      hr_recommendation?: string;
      hr_review?: { hr_recommendation?: string };
    } | null;
    return value?.hr_recommendation || value?.hr_review?.hr_recommendation || "-";
  }, [hrResult]);

  const hrGovernanceScore = useMemo(() => {
    const value = hrResult as {
      governance_risk_score?: number;
      hr_review?: { governance_risk_score?: number };
    } | null;
    return value?.governance_risk_score ?? value?.hr_review?.governance_risk_score ?? "-";
  }, [hrResult]);

  const formattedReportContent = useMemo(
    () => formatReportContent(context?.latest_report?.report_content),
    [context?.latest_report?.report_content],
  );

  const runHrReview = async (employeeId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/governance/hr-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || `Unable to run HR review. Status ${response.status}`);
    }

    setHrResult(payload?.result?.hr_review || payload?.result || null);
    return payload;
  };

  const handleSubmitFeedback = async () => {
    if (!id || !context?.ai_risk_level) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/governance/manager-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: id,
          ai_risk_level: context.ai_risk_level,
          manager_decision: managerDecision,
          manager_comment: managerComment,
          confidence_score: Number(confidenceScore || 0.65),
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to submit manager feedback. Status ${response.status}`);
      }

      setFeedbackResult(payload?.result || null);
      if (!Boolean(payload?.result?.justification_required)) {
        await runHrReview(id);
        setMessage("Manager feedback submitted and pipeline moved to HR review.");
      } else {
        setMessage(payload?.message || "Manager feedback submitted.");
      }
      await loadContext();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit manager feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitJustification = async () => {
    if (!id || !context?.ai_risk_level) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const attachments = attachmentText
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);

      const response = await fetch(`${API_BASE_URL}/api/governance/submit-justification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: id,
          ai_risk_level: context.ai_risk_level,
          manager_decision: managerDecision,
          justification_text: justificationText,
          attachments,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to submit justification. Status ${response.status}`);
      }

      setJustificationResult(payload?.result || null);
      setFeedbackResult(payload?.result || null);
      if (!Boolean(payload?.requires_retry) && String(payload?.result?.next_step || "").toUpperCase() === "HR_REVIEW") {
        await runHrReview(id);
        setMessage("Justification validated and pipeline moved to HR review.");
      } else {
        setMessage(payload?.message || "Justification submitted.");
      }
      await loadContext();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit justification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendToHrReview = async () => {
    if (!id) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const payload = await runHrReview(id);
      setMessage(payload?.message || "HR review completed.");
      await loadContext();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to run HR review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading governance context...</p>;
  }

  if (error && !context) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/manager/team" className="inline-flex items-center text-xs font-semibold text-primary uppercase tracking-wider hover:underline">
        <ArrowLeft className="mr-1 h-3 w-3" /> Back to Team
      </Link>

      <div className="rounded-lg border border-border bg-card p-5">
        <h1 className="text-xl font-bold text-foreground">Governance Review: {context?.employee?.full_name || "Employee"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {(context?.employee?.role || "-") + " - " + (context?.employee?.department || "-")} - {context?.employee?.email || "No Email"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Risk Level</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{context?.ai_risk_level || "-"}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completion Ratio</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{Number(context?.employee_data?.completion_ratio ?? 0).toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attendance Percent</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{Number(context?.employee_data?.attendance_percent ?? 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Manager Governance Layer</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Manager Decision</p>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={managerDecision}
              onChange={(event) => setManagerDecision(event.target.value)}
            >
              <option value="ACCEPT">ACCEPT</option>
              <option value="REJECT">REJECT</option>
              <option value="EXTEND_PROBATION">EXTEND_PROBATION</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Confidence Score</p>
            <Input value={confidenceScore} onChange={(event) => setConfidenceScore(event.target.value)} className="mt-1" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Manager Comment</p>
            <Input value={managerComment} onChange={(event) => setManagerComment(event.target.value)} className="mt-1" />
          </div>
        </div>

        <Button onClick={handleSubmitFeedback} disabled={submitting}>Submit Manager Feedback</Button>

        {feedbackResult ? (
          <div className="rounded border border-border p-3 text-sm">
            <p><strong>Conflict Detected:</strong> {String(Boolean(feedbackResult.conflict_detected))}</p>
            <p><strong>Justification Required:</strong> {String(Boolean(feedbackResult.justification_required))}</p>
            <p><strong>Next Step:</strong> {String(feedbackResult.next_step || "-")}</p>
          </div>
        ) : null}

        {requiresJustification ? (
          <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 space-y-3">
            <p className="text-sm font-semibold text-warning flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Conflict with AI decision. Justification is required.
            </p>
            <Textarea
              rows={5}
              value={justificationText}
              onChange={(event) => setJustificationText(event.target.value)}
              placeholder="Provide a detailed override justification referencing performance evidence and AI factors."
            />
            <Textarea
              rows={3}
              value={attachmentText}
              onChange={(event) => setAttachmentText(event.target.value)}
              placeholder="Attachment names or URLs, comma/newline separated"
            />
            <Button onClick={handleSubmitJustification} disabled={submitting}>Validate Justification</Button>
          </div>
        ) : null}

        {justificationResult ? (
          <div className="rounded border border-border p-3 text-sm">
            <p><strong>Justification Valid:</strong> {String(Boolean(justificationResult.justification_valid))}</p>
            <p><strong>Evidence Provided:</strong> {String(Boolean(justificationResult.evidence_provided))}</p>
            <p><strong>Validation Score:</strong> {String(justificationResult.validation_score ?? "-")}</p>
            <p><strong>Governance Status:</strong> {String(justificationResult.governance_status || "-")}</p>
            <p><strong>Next Step:</strong> {String(justificationResult.next_step || "-")}</p>
          </div>
        ) : null}

        <Button onClick={handleSendToHrReview} disabled={submitting} variant="outline">
          <ShieldCheck className="mr-2 h-4 w-4" /> Send To HR Governance Review
        </Button>

        {hrResult ? (
          <div className="rounded border border-border p-3 text-sm">
            <p><strong>HR Recommendation:</strong> {String(hrRecommendation)}</p>
            <p><strong>Governance Risk Score:</strong> {String(hrGovernanceScore)}</p>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Generated Employee Report (Manager Portal)</h2>
        {!context?.latest_report ? (
          <p className="text-sm text-muted-foreground mt-2">No generated report found yet for this employee.</p>
        ) : (
          <div className="space-y-3 mt-3 text-sm">
            <p><strong>Generated At:</strong> {context.latest_report.created_at || "-"}</p>
            <p><strong>Report Content:</strong></p>
            <div className="rounded border border-border bg-muted/20 p-3 whitespace-pre-wrap text-muted-foreground">
              {formattedReportContent}
            </div>
            {context.latest_report.summary ? (
              <div className="rounded border border-border p-3">
                <p className="font-semibold mb-2">Report Summary</p>
                {Object.entries(context.latest_report.summary).map(([key, value]) => (
                  <p key={key}>{key}: {String(value)}</p>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
};

export default ManagerEmployeeDetail;
