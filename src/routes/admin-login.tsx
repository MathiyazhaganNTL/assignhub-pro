import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, Lock } from "lucide-react";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin Login — AssignHub" },
      { name: "description", content: "Administrator sign-in for AssignHub. Access the admin dashboard to manage students and assignments." },
    ],
  }),
  component: AdminLoginPage,
});

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, role, profile, refresh } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (role === "admin") navigate({ to: "/admin", replace: true });
    else if (profile?.status === "approved") {
      toast.error("This login is for administrators only. Redirecting to student dashboard.");
      navigate({ to: "/dashboard", replace: true });
    } else {
      toast.error("This login is for administrators only.");
      supabase.auth.signOut();
    }
  }, [authLoading, user, role, profile, navigate]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<z.infer<typeof signInSchema>>({ 
      resolver: zodResolver(signInSchema),
      defaultValues: {
        email: "admin@assignhub.com",
        password: "password123",
      }
    });

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-10">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-brand-foreground text-xs font-bold">A</div>
          AssignHub
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-xl font-bold tracking-tight">Administrator Login</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in with your admin credentials to access the dashboard.</p>
          </div>

          <div className="mb-6 rounded-lg border border-brand/20 bg-brand/5 p-4 text-sm text-brand-foreground/90">
            <p className="font-semibold mb-1">Demo Admin Credentials:</p>
            <p>Email: <strong>admin@assignhub.com</strong></p>
            <p>Password: <strong>password123</strong></p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input id="admin-email" type="email" autoComplete="email" placeholder="admin@yourInstitute.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <Input id="admin-password" type="password" autoComplete="current-password" placeholder="Enter your password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Lock className="mr-2 h-4 w-4" />
              Sign in as Admin
            </Button>
          </form>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Are you a student?</p>
          <Link to="/auth" search={{ tab: "signup" }} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            Request student access →
          </Link>
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          This page is for administrators only. Students should use the student portal.
        </p>
      </div>
    </div>
  );
}
