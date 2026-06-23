import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, ClipboardList, Activity, BarChart3, Bell, Lock,
  ArrowRight, CheckCircle2, GraduationCap, Building2, Briefcase, Users,
  UserPlus, LogIn,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AssignHub — Controlled Assignment Management for Modern Education" },
      { name: "description", content: "Controlled-access assignment platform for colleges, coaching centers, training institutes and hiring programs." },
      { property: "og:title", content: "AssignHub — Controlled Assignment Management" },
      { property: "og:description", content: "Student registers → Admin approves → Assignments unlock." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Benefits />
      <CTA />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 overflow-hidden">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-foreground font-bold">A</div>
          <span className="text-lg font-bold tracking-tight">AssignHub</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#benefits" className="hover:text-foreground">For institutes</a>
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Full sign-in on sm+, icon-only on xs */}
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/auth" search={{ tab: "signin" }}><LogIn className="mr-1.5 h-3.5 w-3.5" /> Sign in</Link></Button>
          <Button asChild variant="ghost" size="icon" className="sm:hidden h-9 w-9"><Link to="/auth" search={{ tab: "signin" }}><LogIn className="h-4 w-4" /></Link></Button>
          {/* Full button on sm+, compact on xs */}
          <Button asChild size="sm" className="hidden sm:inline-flex"><Link to="/auth" search={{ tab: "signup" }}><UserPlus className="mr-1.5 h-3.5 w-3.5" /> Request access</Link></Button>
          <Button asChild size="sm" className="sm:hidden text-xs px-2.5"><Link to="/auth" search={{ tab: "signup" }}><UserPlus className="mr-1 h-3.5 w-3.5" /> Register</Link></Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--brand)_18%,transparent),transparent_60%)]" />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" />
            Controlled-access EdTech platform
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Controlled Assignment Management for{" "}
            <span className="bg-gradient-to-r from-brand to-[oklch(0.62_0.18_220)] bg-clip-text text-transparent">Modern Education</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Students request access, admins approve, and assignments unlock. A secure platform for colleges, coaching centers, training institutes and hiring programs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link to="/auth" search={{ tab: "signup" }}><UserPlus className="mr-2 h-4 w-4" /> Request student access</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <Link to="/admin-login"><ShieldCheck className="mr-2 h-4 w-4" /> Admin login</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Already a student?{" "}
            <Link to="/auth" search={{ tab: "signin" }} className="font-medium text-brand hover:underline">Student sign in</Link>
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-5xl"><DashboardPreview /></div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-[oklch(0.66_0.17_256/0.15)]">
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="ml-3 text-xs text-muted-foreground">assignhub.app/admin</span>
        </div>
        <div className="grid grid-cols-12 gap-0">
          <aside className="col-span-3 hidden border-r border-border bg-secondary/40 p-4 md:block">
            <div className="space-y-1.5 text-sm">
              {["Overview", "Students", "Assignments", "Submissions", "Analytics"].map((n, i) => (
                <div key={n} className={`rounded-md px-3 py-2 ${i === 0 ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}>{n}</div>
              ))}
            </div>
          </aside>
          <div className="col-span-12 p-6 md:col-span-9">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { l: "Students", v: "248", k: "brand" },
                { l: "Pending", v: "12", k: "warning" },
                { l: "Approved", v: "236", k: "success" },
                { l: "Active", v: "18", k: "brand" },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border border-border bg-card p-3">
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                  <div className={`mt-1 text-2xl font-bold ${s.k === "warning" ? "text-[oklch(0.6_0.15_75)]" : s.k === "success" ? "text-[oklch(0.55_0.13_152)]" : "text-brand"}`}>{s.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-border bg-card p-4">
              <div className="mb-3 text-sm font-semibold">Pending approvals</div>
              <div className="space-y-2">
                {["Aanya Sharma", "Rohan Mehta", "Priya Iyer"].map((n) => (
                  <div key={n} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-sm">
                    <span>{n}</span>
                    <span className="flex gap-2">
                      <span className="rounded bg-success px-2 py-0.5 text-xs text-success-foreground">Approve</span>
                      <span className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">Reject</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  { icon: UserPlus, title: "Student access requests", desc: "Students register with their details and request access. No one gets in without admin approval." },
  { icon: ShieldCheck, title: "Admin approval workflow", desc: "Admin reviews every registration and approves or rejects. Nothing is exposed by default." },
  { icon: ClipboardList, title: "Assignment management", desc: "Create, edit, attach files, set deadlines, assign cohorts in seconds." },
  { icon: Activity, title: "Real-time tracking", desc: "See submissions land instantly with status indicators and late flags." },
  { icon: BarChart3, title: "Submission analytics", desc: "Completion rates, trends and student performance at a glance." },
  { icon: Bell, title: "Push notifications", desc: "Approval, new assignment and deadline reminders delivered automatically." },
  { icon: Lock, title: "Secure storage", desc: "Submission files stored with controlled, role-based access." },
];

function Features() {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const SPEED = 0.8; // px per frame — smooth but noticeable flow
  const CARD_W = 340; // card width + gap
  const TOTAL_W = features.length * CARD_W;

  const tick = useCallback(() => {
    if (!pausedRef.current) {
      offsetRef.current = (offsetRef.current + SPEED) % TOTAL_W;
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [TOTAL_W]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  const pause = useCallback(() => { pausedRef.current = true; }, []);
  const resume = useCallback(() => { pausedRef.current = false; }, []);

  // Triple the cards for seamless loop
  const tripled = [...features, ...features, ...features];

  return (
    <section id="features" className="border-t border-border bg-surface py-20 sm:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to run assignments</h2>
          <p className="mt-3 text-muted-foreground">Designed around the realities of academic and training programs.</p>
        </div>
      </div>

      {/* Carousel viewport */}
      <div
        className="relative mt-14"
        onMouseEnter={pause}
        onMouseLeave={() => { setHoveredIdx(null); resume(); }}
        onTouchStart={pause}
        onTouchEnd={resume}
      >
        {/* Edge fade masks */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 sm:w-32 bg-gradient-to-r from-[var(--surface)] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 sm:w-32 bg-gradient-to-l from-[var(--surface)] to-transparent" />

        {/* Scrolling track */}
        <div
          ref={trackRef}
          className="flex will-change-transform"
          style={{ width: `${tripled.length * CARD_W}px` }}
        >
          {tripled.map((f, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <div
                key={`${f.title}-${i}`}
                className="shrink-0 px-3"
                style={{ width: `${CARD_W}px` }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div
                  className={[
                    "rounded-2xl border bg-card p-7 h-full transition-all duration-300 ease-out",
                    isHovered
                      ? "scale-[1.03] shadow-xl shadow-brand/8 border-brand/30"
                      : "scale-100 shadow-sm border-border",
                  ].join(" ")}
                >
                  <div className={[
                    "grid h-11 w-11 place-items-center rounded-xl transition-colors duration-300",
                    isHovered ? "bg-brand text-white" : "bg-brand/10 text-brand",
                  ].join(" ")}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold leading-snug">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { n: "01", t: "Student requests access", d: "Sign up with your name, email and details. Your account enters a pending approval queue." },
  { n: "02", t: "Admin reviews & approves", d: "The admin sees your request on their dashboard and approves or rejects it." },
  { n: "03", t: "Student logs in & works", d: "Once approved, log in to view assignments, submit work, and track deadlines." },
  { n: "04", t: "Progress tracked in real time", d: "Admin monitors submissions, completion rates and deadlines. Students see their own progress." },
];

function HowItWorks() {
  return (
    <section id="how" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">A simple, controlled flow from registration to submission.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-card p-6">
              <div className="text-xs font-semibold tracking-widest text-brand">{s.n}</div>
              <h3 className="mt-2 text-base font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const audiences = [
  { icon: Building2, t: "Colleges", d: "Manage cohorts across departments with role-based control." },
  { icon: GraduationCap, t: "Coaching centers", d: "Distribute structured assignment packs to enrolled batches." },
  { icon: Users, t: "Training institutes", d: "Track learner progress through curated programs." },
  { icon: Briefcase, t: "Hiring assessments", d: "Issue controlled assessments to verified candidates only." },
];

function Benefits() {
  return (
    <section id="benefits" className="border-t border-border bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for educators who care about access</h2>
          <p className="mt-3 text-muted-foreground">Not a generic LMS. AssignHub is access-first.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a) => (
            <div key={a.t} className="rounded-xl border border-border bg-card p-6">
              <a.icon className="h-6 w-6 text-brand" />
              <h3 className="mt-3 text-base font-semibold">{a.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{a.d}</p>
            </div>
          ))}
        </div>
        <ul className="mx-auto mt-12 grid max-w-3xl gap-3 text-sm sm:grid-cols-2">
          {["Zero default access", "Role-based dashboards", "Activity logging", "Mobile-friendly experience"].map((t) => (
            <li key={t} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-success" /> {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/50 px-6 py-12 text-center sm:px-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Get started in seconds</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Admins: create your institute account. Students: request access and start working on assignments once approved.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-6"><Link to="/auth" search={{ tab: "signup" }}><UserPlus className="mr-2 h-4 w-4" /> Request student access</Link></Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6"><Link to="/admin-login"><ShieldCheck className="mr-2 h-4 w-4" /> Admin login</Link></Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Already a student?{" "}
          <Link to="/auth" search={{ tab: "signin" }} className="font-medium text-brand hover:underline">Student sign in</Link>
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-brand text-xs font-bold text-brand-foreground">A</div>
          <span>© {new Date().getFullYear()} AssignHub. All rights reserved.</span>
        </div>
        <div className="flex gap-5">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}