import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle, Clock, ScrollText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/lib/api";

type EmployeeTask = {
  id: string;
  title: string;
  deadline: string | null;
  status: "Pending" | "In Progress" | "Completed";
  updatedAt: string | null;
};

type PerformanceRecord = {
  completion_ratio?: number;
};

type AuditLogRecord = {
  id: string;
  timestamp?: string;
  actor?: string;
  action?: string;
};

const normalizeStatus = (value: string): EmployeeTask["status"] => {
  const status = String(value || "").toLowerCase();
  if (status === "completed" || status === "complete") return "Completed";
  if (status === "in progress") return "In Progress";
  return "Pending";
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [performance, setPerformance] = useState<PerformanceRecord | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?.email) {
        setTasks([]);
        setPerformance(null);
        setAuditLogs([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [tasksResponse, performanceResponse, logsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/tasks?assignedToEmail=${encodeURIComponent(user.email)}`),
          fetch(`${API_BASE_URL}/api/employee-performance/${encodeURIComponent(user.email.toLowerCase())}`),
          fetch(`${API_BASE_URL}/api/audit-logs?limit=12`),
        ]);

        const tasksPayload = await tasksResponse.json().catch(() => ({}));
        const performancePayload = await performanceResponse.json().catch(() => ({}));
        const logsPayload = await logsResponse.json().catch(() => []);

        const apiTasks = Array.isArray(tasksPayload?.tasks) ? tasksPayload.tasks : [];
        const normalizedTasks: EmployeeTask[] = apiTasks.map((task: any) => ({
          id: String(task.id),
          title: String(task.title || "Untitled task"),
          deadline: task.deadline || null,
          status: normalizeStatus(task.managerStatus || task.status || "Pending"),
          updatedAt: task.updatedAt || task.createdAt || null,
        }));

        setTasks(normalizedTasks);
        setPerformance(performancePayload?.performance || null);
        setAuditLogs(Array.isArray(logsPayload) ? logsPayload.slice(0, 6) : []);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, [user?.email]);

  const completed = tasks.filter((task) => task.status === "Completed").length;
  const pending = tasks.filter((task) => task.status === "Pending").length;

  const recentTasks = useMemo(
    () => [...tasks]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 3),
    [tasks],
  );

  const kpis = [
    { label: "Tasks Assigned", value: tasks.length, icon: ClipboardList, color: "text-primary" },
    { label: "Completed", value: completed, icon: CheckCircle, color: "text-green-600" },
    { label: "Pending", value: pending, icon: Clock, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name || "Alex"}</h1>
          <p className="text-muted-foreground text-sm">Here's your probation overview and recent activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-primary text-primary px-3 py-1">Probationary</Badge>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0">45 Days Remaining</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
              </div>
              <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-50`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Task Updates</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading tasks...</p>
            ) : recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks assigned yet.</p>
            ) : recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground">Due: {formatDate(task.deadline)}</p>
                </div>
                <Badge variant={task.status === "Completed" ? "default" : task.status === "In Progress" ? "secondary" : "outline"} className="text-xs">
                  {task.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Audit Logs</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading audit logs...</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit logs found.</p>
            ) : auditLogs.map((log) => (
              <div key={log.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">Audit</Badge>
                  <span className="text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{log.action || "Unknown action"}</p>
                <p className="text-xs text-muted-foreground mt-1">Actor: {log.actor || "System"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
