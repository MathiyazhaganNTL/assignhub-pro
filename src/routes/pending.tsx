import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Clock4, XCircle, RefreshCw, LogOut } from "lucide-react";

export const Route = createFileRoute("/pending")({
  head: () => ({ meta: [{ title: "Awaiting approval — AssignHub" }] }),
  component: PendingPage,
});

function PendingPage() {
  const navigate = useNavigate();
  const { user, loading, profile, role, signOut, refresh } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth", replace: true }); return; }
    if (role === "admin") { navigate({ to: "/admin", replace: true }); return; }
    if (profile?.status === "approved") navigate({ to: "/dashboard", replace: true });
  }, [loading, user, role, profile, navigate]);

  if (loading || !profile) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  const rejected = profile.status === "rejected";

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${rejected ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-[oklch(0.55_0.13_75)]"}`}>
          {rejected ? <XCircle className="h-7 w-7" /> : <Clock4 className="h-7 w-7" />}
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          {rejected ? "Account not approved" : "Awaiting admin approval"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {rejected
            ? "Your registration was reviewed and rejected by the administrator."
            : "Your account is pending review. You'll get access to assignments as soon as an administrator approves you."}
        </p>
        {rejected && profile.rejection_reason && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left text-sm text-destructive">
            {profile.rejection_reason}
          </div>
        )}
        <div className="mt-6 grid gap-2">
          <Button onClick={() => void refresh()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Check status
          </Button>
          <Button onClick={() => signOut().then(() => navigate({ to: "/auth", replace: true }))} variant="ghost">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}