import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldCheck, Loader2, UserPlus, LogIn } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search.tab === "signup" ? "signup" as const : "signin" as const,
  }),
  head: () => ({
    meta: [
      { title: "Student Portal — AssignHub" },
      { name: "description", content: "Student portal for AssignHub. Sign in or request access to view and submit assignments." },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const signUpSchema = signInSchema.extend({
  full_name: z.string().trim().min(2, "Name is required").max(100),
  roll_number: z.string().trim().max(50).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, role, profile, refresh } = useAuth();
  const searchParams = Route.useSearch();
  const [tab, setTab] = useState<"signin" | "signup">(searchParams.tab === "signup" ? "signup" : "signin");

  useEffect(() => {
    if (searchParams.tab === "signup" || searchParams.tab === "signin") {
      setTab(searchParams.tab);
    }
  }, [searchParams.tab]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (role === "admin") navigate({ to: "/admin", replace: true });
    else if (profile?.status === "approved") navigate({ to: "/dashboard", replace: true });
    else navigate({ to: "/pending", replace: true });
  }, [authLoading, user, role, profile, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-10">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-brand-foreground text-xs font-bold">A</div>
          AssignHub
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-5 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
              <UserPlus className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-xl font-bold tracking-tight">Student Portal</h1>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin"><LogIn className="mr-1.5 h-3.5 w-3.5" /> Sign in</TabsTrigger>
              <TabsTrigger value="signup"><UserPlus className="mr-1.5 h-3.5 w-3.5" /> Request access</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6">
              <p className="mb-4 text-sm text-muted-foreground">Sign in with your approved student account.</p>
              <SignInForm onDone={refresh} />
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <p className="mb-4 text-sm text-muted-foreground">Register to request access. An admin will review and approve your request.</p>
              <SignUpForm onDone={refresh} switchToSignIn={() => setTab("signin")} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Are you an administrator?</p>
          <Link to="/admin-login" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin login →
          </Link>
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Students must be approved by an admin before accessing assignments.
        </p>
      </div>
    </div>
  );
}

function SignInForm({ onDone }: { onDone: () => Promise<void> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<z.infer<typeof signInSchema>>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      toast.error(error.message);
      return;
    }
    await onDone();
    toast.success("Welcome back");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="si-password">Password</Label>
        <PasswordInput id="si-password" autoComplete="current-password" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}

function SignUpForm({ onDone, switchToSignIn }: { onDone: () => Promise<void>; switchToSignIn: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<z.infer<typeof signUpSchema>>({ resolver: zodResolver(signUpSchema) });

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: { full_name: data.full_name, roll_number: data.roll_number || undefined },
      },
    });
    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        toast.error("Account already exists. Please sign in.");
        switchToSignIn();
      } else {
        toast.error(error.message);
      }
      return;
    }
    await onDone();
    toast.success("Access request submitted! You'll be notified once an admin approves your account.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="su-name">Full name</Label>
        <Input id="su-name" autoComplete="name" placeholder="Enter your full name" {...register("full_name")} />
        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-roll">Roll number <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input id="su-roll" placeholder="e.g. CS2024-042" {...register("roll_number")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-password">Password</Label>
        <PasswordInput id="su-password" autoComplete="new-password" placeholder="At least 6 characters" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <UserPlus className="mr-2 h-4 w-4" />
        Request access
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <button type="button" onClick={switchToSignIn} className="font-medium text-brand hover:underline">Sign in instead</button>
      </p>
    </form>
  );
}