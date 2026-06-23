import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Profile } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, CheckCircle2, BookOpen, Clock, AlertCircle,
  Loader2, Calendar, Linkedin, Target, ShieldCheck,
  Mail, Phone, Hash, Building2, Upload, Edit3, User, Users,
  Globe, GraduationCap, FileText, TrendingUp, Briefcase
} from "lucide-react";

export const Route = createFileRoute("/admin-profile")({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: search.edit === true || search.edit === "true",
  }),
  head: () => ({
    meta: [
      { title: "Admin Profile — AssignHub" },
      { name: "description", content: "Administrator profile and platform management settings." },
    ],
  }),
  component: AdminProfilePage,
});

// ==========================================
// Types
// ==========================================
interface StudentProfile {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
}
interface Assignment {
  id: string;
  title: string;
  created_at: string;
}
interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at: string;
}

// ==========================================
// Main Component
// ==========================================
function AdminProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading, role, profile, signOut, refresh } = useAuth();
  const { edit: openEdit } = Route.useSearch();
  const [editOpen, setEditOpen] = useState(false);

  // Auth protection
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth", search: { tab: "signin" }, replace: true }); return; }
    if (role !== "admin") navigate({ to: "/dashboard", replace: true });
  }, [loading, user, role, navigate]);

  useEffect(() => {
    if (openEdit && profile) setEditOpen(true);
  }, [openEdit, profile]);

  // Platform data queries
  const { data: students } = useQuery({
    queryKey: ["admin-students-profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, email, full_name, status");
      if (error) throw error;
      return (data ?? []) as StudentProfile[];
    },
    enabled: !!user,
  });

  const { data: assignments } = useQuery({
    queryKey: ["admin-assignments-profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assignments").select("id, title, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Assignment[];
    },
    enabled: !!user,
  });

  const { data: submissions } = useQuery({
    queryKey: ["admin-submissions-profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("submissions").select("id, assignment_id, student_id, submitted_at").order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Submission[];
    },
    enabled: !!user,
  });

  const platformStats = useMemo(() => {
    const totalStudents = students?.filter((s) => s.id !== user?.id).length || 0;
    const approved = students?.filter((s) => s.status === "approved" && s.id !== user?.id).length || 0;
    const pending = students?.filter((s) => s.status === "pending").length || 0;
    const totalAssignments = assignments?.length || 0;
    const totalSubmissions = submissions?.length || 0;
    const maxPossible = totalStudents * totalAssignments;
    const completionRate = maxPossible > 0 ? Math.round((totalSubmissions / maxPossible) * 100) : 0;
    return { totalStudents, approved, pending, totalAssignments, totalSubmissions, completionRate };
  }, [students, assignments, submissions, user]);

  // Recent admin activity timeline
  const recentActivity = useMemo(() => {
    if (!assignments || !students || !submissions) return [];
    const events: { id: string; type: string; title: string; detail: string; time: string }[] = [];

    // Recent assignment creations
    assignments.slice(0, 3).forEach((a) => {
      events.push({
        id: `a-${a.id}`,
        type: "assignment",
        title: "Assignment Created",
        detail: a.title,
        time: a.created_at,
      });
    });

    // Recent student approvals
    students.filter((s) => s.status === "approved" && s.id !== user?.id).slice(0, 3).forEach((s) => {
      events.push({
        id: `s-${s.id}`,
        type: "student",
        title: "Student Approved",
        detail: s.full_name || s.email,
        time: new Date().toISOString(), // no created_at for status changes, approximate
      });
    });

    // Recent submissions
    submissions.slice(0, 3).forEach((sub) => {
      const student = students.find((s) => s.id === sub.student_id);
      events.push({
        id: `sub-${sub.id}`,
        type: "submission",
        title: "Submission Received",
        detail: student?.full_name || student?.email || "Student",
        time: sub.submitted_at,
      });
    });

    return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
  }, [assignments, students, submissions, user]);

  if (loading || !profile) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground"><Loader2 className="animate-spin h-5 w-5 mr-2 inline" /> Loading…</div>;
  }

  const initials = (profile.full_name || "A").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
        {/* ==========================================
            1. Profile Header — Executive Style
            ========================================== */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/8 via-card to-card overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-brand/20 via-brand/10 to-transparent" />
          <div className="px-6 sm:px-8 pb-6 -mt-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-card shadow-xl">
                  <AvatarImage src={profile.profile_picture_url || undefined} alt={profile.full_name || "Admin"} />
                  <AvatarFallback className="bg-brand/15 text-brand text-2xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => setEditOpen(true)}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Upload className="h-5 w-5 text-white" />
                </button>
              </div>
              <div className="flex-1 text-center sm:text-left sm:pb-1">
                <h1 className="text-2xl font-bold tracking-tight">{profile.full_name || "Administrator"}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{profile.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2.5">
                  <Badge variant="secondary" className="bg-brand/10 text-brand border-none font-semibold">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Super Administrator
                  </Badge>
                  <Badge variant="secondary" className="bg-success/10 text-success border-none font-semibold">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Active Account
                  </Badge>
                </div>
              </div>
              <div className="text-center sm:text-right text-xs text-muted-foreground sm:pb-2">
                <p>Managing AssignHub Platform</p>
                <p className="mt-0.5 font-medium">Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            2. Admin Information Card
            ========================================== */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">Administrator Information</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Your account details and professional information</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} className="text-brand hover:text-brand">
              <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          </div>
          <div className="p-6 grid gap-5 sm:grid-cols-2">
            <InfoField icon={User} label="Full Name" value={profile.full_name} />
            <InfoField icon={Mail} label="Email Address" value={profile.email} />
            <InfoField icon={Phone} label="Phone Number" value={profile.mobile_no} />
            <InfoField icon={Briefcase} label="Designation" value={profile.department || "Platform Administrator"} />
            <InfoField icon={Building2} label="Organization" value="AssignHub" />
            <InfoField icon={Linkedin} label="LinkedIn" value={profile.linkedin_url} isLink />
            <div className="sm:col-span-2">
              <InfoField icon={Target} label="Professional Goal" value={profile.career_goal} />
            </div>
            <InfoField icon={Hash} label="Admin ID" value={`ADM-${new Date(profile.created_at).getFullYear()}-${String(1).padStart(3, "0")}`} />
            <InfoField icon={Calendar} label="Account Created" value={profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : null} />
          </div>
        </div>

        {/* ==========================================
            3. Platform Management Summary
            ========================================== */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold text-lg">Platform Management Summary</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Overview of your platform's activity and performance</p>
          </div>
          <div className="p-6">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
              <PlatformStatCard label="Total Students" value={platformStats.totalStudents} icon={Users} tone="brand" />
              <PlatformStatCard label="Approved" value={platformStats.approved} icon={CheckCircle2} tone="success" />
              <PlatformStatCard label="Pending Approvals" value={platformStats.pending} icon={Clock} tone="warning" />
              <PlatformStatCard label="Assignments Created" value={platformStats.totalAssignments} icon={BookOpen} tone="brand" />
              <PlatformStatCard label="Submissions" value={platformStats.totalSubmissions} icon={FileText} tone="success" />
              <div className="rounded-xl border border-border bg-gradient-to-br from-brand/5 to-muted/20 p-5 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-brand">{platformStats.completionRate}%</span>
                <span className="text-[11px] text-muted-foreground font-medium mt-1">Completion Rate</span>
                <Progress value={platformStats.completionRate} className="mt-2 h-1.5 w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            4. Admin Activity Timeline
            ========================================== */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold text-lg">Recent Activity</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Latest administrative actions on the platform</p>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                No recent activity recorded.
              </div>
            ) : (
              recentActivity.map((event) => {
                const iconMap = { assignment: BookOpen, student: Users, submission: FileText };
                const toneMap = { assignment: "bg-brand/10 text-brand", student: "bg-success/10 text-success", submission: "bg-violet-500/10 text-violet-600" };
                const IconComp = iconMap[event.type as keyof typeof iconMap] || FileText;
                const toneClass = toneMap[event.type as keyof typeof toneMap] || "bg-muted text-muted-foreground";
                return (
                  <div key={event.id} className="px-6 py-4 flex items-start gap-3">
                    <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${toneClass}`}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.detail}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                      {new Date(event.time).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ==========================================
            5. Organization Information
            ========================================== */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold text-lg">Organization Information</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Platform and institutional details</p>
          </div>
          <div className="p-6 grid gap-5 sm:grid-cols-2">
            <InfoField icon={Building2} label="Institution" value="AssignHub Academy" />
            <InfoField icon={GraduationCap} label="Type" value="Educational Institution" />
            <InfoField icon={Calendar} label="Academic Year" value="2026-2027" />
            <InfoField icon={Globe} label="Platform Version" value="v1.0.0" />
          </div>
        </div>

        {/* ==========================================
            6. Security Section
            ========================================== */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold text-lg">Security</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Account security and access management</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/20">
              <div>
                <p className="text-sm font-semibold">Password</p>
                <p className="text-xs text-muted-foreground mt-0.5">Last changed: Account creation</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info("Password change available via email reset.")}>Change Password</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/20">
              <div>
                <p className="text-sm font-semibold">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-warning/10 text-[oklch(0.55_0.13_75)] border-none font-semibold">Not Enabled</Badge>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info("2FA setup coming soon.")}>Enable 2FA</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/20">
              <div>
                <p className="text-sm font-semibold">Active Sessions</p>
                <p className="text-xs text-muted-foreground mt-0.5">1 active session (this device)</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { signOut(); navigate({ to: "/", replace: true }); }}>Logout All Devices</Button>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Dialog */}
      <EditAdminProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
        userId={user?.id || ""}
        onSaved={() => { refresh(); qc.invalidateQueries(); toast.success("Profile updated!"); }}
      />
    </div>
  );
}

// ==========================================
// Helper Components
// ==========================================

function InfoField({ icon: Icon, label, value, isLink }: { icon: typeof User; label: string; value: string | null | undefined; isLink?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {isLink && value ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand hover:underline truncate block">{value}</a>
      ) : (
        <p className="text-sm font-medium text-foreground">{value || <span className="text-muted-foreground italic">Not provided</span>}</p>
      )}
    </div>
  );
}

function PlatformStatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Users; tone: "brand" | "success" | "warning" }) {
  const toneClasses = {
    brand: "text-brand bg-brand/10",
    success: "text-success bg-success/10",
    warning: "text-[oklch(0.55_0.13_75)] bg-warning/15",
  };
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-5 text-center">
      <div className={`mx-auto grid h-10 w-10 place-items-center rounded-full ${toneClasses[tone]}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="mt-2.5 text-2xl font-extrabold">{value}</div>
      <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ==========================================
// Edit Admin Profile Dialog
// ==========================================
function EditAdminProfileDialog({
  open,
  onOpenChange,
  profile,
  userId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  userId: string;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [mobileNo, setMobileNo] = useState(profile.mobile_no || "");
  const [department, setDepartment] = useState(profile.department || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || "");
  const [careerGoal, setCareerGoal] = useState(profile.career_goal || "");
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.profile_picture_url || "");

  useEffect(() => {
    setFullName(profile.full_name || "");
    setMobileNo(profile.mobile_no || "");
    setDepartment(profile.department || "");
    setLinkedinUrl(profile.linkedin_url || "");
    setCareerGoal(profile.career_goal || "");
    setAvatarUrl(profile.profile_picture_url || "");
  }, [profile]);

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB."); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(publicUrl);
      toast.success("Photo uploaded!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          mobile_no: mobileNo.trim() || null,
          department: department.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          career_goal: careerGoal.trim() || null,
          profile_picture_url: avatarUrl || null,
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => { onSaved(); onOpenChange(false); },
    onError: (err: any) => toast.error(err.message),
  });

  const initials = (profile.full_name || "A").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Administrator Profile</DialogTitle>
          <DialogDescription>Update your admin profile and platform information.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-brand/25">
                <AvatarImage src={avatarUrl || undefined} alt={fullName || "Admin"} />
                <AvatarFallback className="bg-brand/15 text-brand font-bold">{initials}</AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="admin-avatar-upload" className="text-sm font-semibold">Profile Photo</Label>
              <Input id="admin-avatar-upload" type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="mt-1.5 cursor-pointer bg-background" />
              <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG. Max 2MB.</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Full Name</Label>
              <Input id="admin-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Administrator name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-phone">Phone Number</Label>
              <Input id="admin-phone" value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} placeholder="+91 9876543210" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-dept">Designation / Department</Label>
              <Input id="admin-dept" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Platform Administrator" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-linkedin">LinkedIn URL</Label>
              <Input id="admin-linkedin" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-goal">Professional Goal</Label>
            <Textarea id="admin-goal" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} placeholder="Your professional mission or goal" rows={3} />
          </div>

          {/* Read-only Fields */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">System-managed fields (read-only)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-0.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input value={profile.email} disabled className="bg-muted/50 text-xs" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Input value="Super Administrator" disabled className="bg-muted/50 text-xs" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs text-muted-foreground">Admin ID</Label>
                <Input value={`ADM-${new Date(profile.created_at).getFullYear()}-001`} disabled className="bg-muted/50 text-xs" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs text-muted-foreground">Account Created</Label>
                <Input value={new Date(profile.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })} disabled className="bg-muted/50 text-xs" />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
            {saveProfile.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
