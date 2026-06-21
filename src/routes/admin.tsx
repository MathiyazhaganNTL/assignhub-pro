import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Profile } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogOut, Users, ShieldCheck, Clock4, XCircle, CheckCircle2, Search, Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — AssignHub" }] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const { user, loading, role, signOut } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth", replace: true }); return; }
    if (role !== "admin") navigate({ to: "/dashboard", replace: true });
  }, [loading, user, role, navigate]);

  if (loading || role !== "admin") {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground text-sm font-bold">A</div>
            <div>
              <div className="text-sm font-semibold leading-tight">AssignHub</div>
              <div className="text-xs text-muted-foreground leading-tight">Administrator</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate({ to: "/", replace: true }))}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><AdminBody /></main>
    </div>
  );
}

type Filter = "all" | "pending" | "approved" | "rejected";

function AdminBody() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("pending");
  const [search, setSearch] = useState("");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const stats = useMemo(() => {
    const list = profiles ?? [];
    return {
      total: list.length,
      pending: list.filter((p) => p.status === "pending").length,
      approved: list.filter((p) => p.status === "approved").length,
      rejected: list.filter((p) => p.status === "rejected").length,
    };
  }, [profiles]);

  const filtered = useMemo(() => {
    let list = profiles ?? [];
    if (filter !== "all") list = list.filter((p) => p.status === filter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => (p.full_name ?? "").toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
    return list;
  }, [profiles, filter, search]);

  const setStatus = useMutation({
    mutationFn: async (args: { id: string; status: "approved" | "rejected"; reason?: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status: args.status, rejection_reason: args.reason ?? null })
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.status === "approved" ? "Student approved" : "Student rejected");
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student management</h1>
          <p className="text-sm text-muted-foreground">Approve, reject and review registered students.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Users} label="Total students" value={stats.total} tone="brand" />
        <StatTile icon={Clock4} label="Pending" value={stats.pending} tone="warning" />
        <StatTile icon={CheckCircle2} label="Approved" value={stats.approved} tone="success" />
        <StatTile icon={XCircle} label="Rejected" value={stats.rejected} tone="destructive" />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">No students match this filter.</TableCell></TableRow>
              ) : filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.email}</TableCell>
                  <TableCell><StatusPill status={p.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {p.status !== "approved" && (
                        <Button size="sm" onClick={() => setStatus.mutate({ id: p.id, status: "approved", reason: null })} disabled={setStatus.isPending}>
                          Approve
                        </Button>
                      )}
                      {p.status !== "rejected" && (
                        <Button size="sm" variant="outline" onClick={() => {
                          const reason = window.prompt("Optional reason for rejection?") ?? "";
                          setStatus.mutate({ id: p.id, status: "rejected", reason: reason.trim() || null });
                        }} disabled={setStatus.isPending}>
                          Reject
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> You are signed in as an administrator. Only approved students can access assignments.
      </p>
    </>
  );
}

function StatTile({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: number; tone: "brand" | "warning" | "success" | "destructive" }) {
  const toneClass = {
    brand: "text-brand bg-brand/10",
    warning: "text-[oklch(0.55_0.13_75)] bg-warning/20",
    success: "text-[oklch(0.5_0.13_152)] bg-success/15",
    destructive: "text-destructive bg-destructive/10",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${toneClass}`}><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: Profile["status"] }) {
  const map = {
    pending: { label: "Pending", cls: "bg-warning/20 text-[oklch(0.45_0.13_75)]" },
    approved: { label: "Approved", cls: "bg-success/15 text-[oklch(0.45_0.13_152)]" },
    rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive" },
  } as const;
  const m = map[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}