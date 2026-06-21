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
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AssignHub" },
      { name: "description", content: "Sign in or register for AssignHub. The first registered account becomes the institute administrator." },
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
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, role, profile, refresh } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

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
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6">
              <SignInForm onDone={refresh} />
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <SignUpForm onDone={refresh} switchToSignIn={() => setTab("signin")} />
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          The first account created becomes the admin. Subsequent signups are students pending approval.
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
        <Input id="si-password" type="password" autoComplete="current-password" {...register("password")} />
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
        data: { full_name: data.full_name },
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
    toast.success("Account created");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="su-name">Full name</Label>
        <Input id="su-name" autoComplete="name" {...register("full_name")} />
        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-password">Password</Label>
        <Input id="su-password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create account
      </Button>
    </form>
  );
}