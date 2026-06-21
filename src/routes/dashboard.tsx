import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen, Bell, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AssignHub" }] }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const navigate = useNavigate();
  const { user, loading, role, profile, signOut } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth", replace: true }); return; }
    if (role === "admin") { navigate({ to: "/admin", replace: true }); return; }
    if (profile && profile.status !== "approved") navigate({ to: "/pending", replace: true });
  }, [loading, user, role, profile, navigate]);

  if (loading || !profile) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground text-sm font-bold">A</div>
            <div>
              <div className="text-sm font-semibold leading-tight">AssignHub</div>
              <div className="text-xs text-muted-foreground leading-tight">Student</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate({ to: "/", replace: true }))}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/10 to-card p-6">
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{profile.full_name || "Student"}</h1>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" /> Account approved
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard icon={BookOpen} label="Active assignments" value="0" />
          <StatCard icon={CheckCircle2} label="Submitted" value="0" />
          <StatCard icon={Bell} label="Notifications" value="0" />
        </div>

        <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No assignments yet</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">When an administrator publishes an assignment, it will show up here.</p>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}