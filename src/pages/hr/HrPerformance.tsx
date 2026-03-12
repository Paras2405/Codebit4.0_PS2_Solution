import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SuccessionCandidate = {
  rank: number;
  employee_id?: string | null;
  employee_name?: string;
  employee_email?: string | null;
  role?: string | null;
  department?: string | null;
  performance_score?: number;
  potential_score?: number;
  succession_score?: number;
  talent_category?: string;
  explanation?: string[];
};

type SuccessionResponse = {
  threshold: number;
  evaluated_count: number;
  qualified_count: number;
  ranked_candidates: SuccessionCandidate[];
};

const HrPerformance = () => {
  const [thresholdInput, setThresholdInput] = useState("50");
  const [thresholdApplied, setThresholdApplied] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SuccessionResponse | null>(null);

  const fetchRankings = async (threshold: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ml/succession-ranking?threshold=${threshold}`);
      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new Error(responseBody?.error || `Unable to load succession ranking. Status ${response.status}`);
      }

      const data = await response.json();
      setPayload({
        threshold: Number(data?.threshold ?? threshold),
        evaluated_count: Number(data?.evaluated_count ?? 0),
        qualified_count: Number(data?.qualified_count ?? 0),
        ranked_candidates: Array.isArray(data?.ranked_candidates) ? data.ranked_candidates : [],
      });
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to fetch succession ranking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings(thresholdApplied);
  }, [thresholdApplied]);

  const handleApplyThreshold = () => {
    const parsed = Number(thresholdInput);
    const normalized = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 50;
    setThresholdInput(String(normalized));
    setThresholdApplied(normalized);
  };

  const rankedCandidates = useMemo(
    () => (payload?.ranked_candidates || []).sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0)),
    [payload],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance Succession Ranking</h1>
          <p className="text-sm text-muted-foreground">
            All employees are evaluated using succession ML scoring. Only threshold-passing employees are ranked below.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Threshold</p>
            <Input
              type="number"
              min={0}
              max={100}
              value={thresholdInput}
              onChange={(event) => setThresholdInput(event.target.value)}
              className="w-24"
            />
          </div>
          <Button onClick={handleApplyThreshold}>Apply</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employees Evaluated</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{payload?.evaluated_count ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qualified For Succession</p>
          <p className="mt-2 text-2xl font-bold text-success">{payload?.qualified_count ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Applied Threshold</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{payload?.threshold ?? thresholdApplied}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Evaluating all employees for succession ranking...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : rankedCandidates.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">No employees crossed the current threshold.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rankedCandidates.map((candidate) => (
            <div key={candidate.employee_id || `${candidate.rank}-${candidate.employee_email}`} className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rank #{candidate.rank}</p>
                  <h2 className="text-lg font-semibold text-foreground">{candidate.employee_name || "Unnamed Employee"}</h2>
                  <p className="text-xs text-muted-foreground">
                    {(candidate.role || "-") + " - " + (candidate.department || "-")} - {candidate.employee_email || "No Email"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Succession Result</p>
                  <p className="text-sm font-semibold text-success">{candidate.talent_category || "Uncategorized"}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded border border-border p-3">
                  <p className="text-xs text-muted-foreground">Performance Score</p>
                  <p className="text-lg font-semibold text-foreground">{Number(candidate.performance_score ?? 0).toFixed(2)}</p>
                </div>
                <div className="rounded border border-border p-3">
                  <p className="text-xs text-muted-foreground">Potential Score</p>
                  <p className="text-lg font-semibold text-foreground">{Number(candidate.potential_score ?? 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4 rounded border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Explanation</p>
                {Array.isArray(candidate.explanation) && candidate.explanation.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-foreground">
                    {candidate.explanation.map((line, idx) => (
                      <li key={`${candidate.employee_id || candidate.rank}-${idx}`}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No explanation returned by model.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HrPerformance;
