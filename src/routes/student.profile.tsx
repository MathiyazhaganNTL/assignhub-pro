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
  Loader2, Calendar, Linkedin, Target, GraduationCap,
  Mail, Phone, Hash, Building2, Upload, FileText, Eye, Download, Edit3, User
} from "lucide-react";

export const Route = createFileRoute("/student/profile")({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: search.edit === true || search.edit === "true",
  }),
  head: () => ({
    meta: [
      { title: "My Profile — AssignHub" },
      { name: "description", content: "View and manage your student profile on AssignHub." },
    ],
  }),
  component: StudentProfilePage,
});

// ==========================================
// Types
// ==========================================
interface Assignment {
  id: string;
  title: string;
  description: string | null;
  format: "pdf" | "link" | "rich-text";
  content: string;
  deadline: string;
  created_at: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  format: "file" | "text";
  content: string;
  submitted_at: string;
}

// ==========================================
// Main Component
// ==========================================
function StudentProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading, role, profile, signOut, refresh } = useAuth();
  const { edit: openEdit } = Route.useSearch();
  const [editOpen, setEditOpen] = useState(false);

  // Auth protection
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth", search: { tab: "signin" }, replace: true }); return; }
    if (role === "admin") { navigate({ to: "/admin", replace: true }); return; }
    if (profile && profile.status !== "approved") navigate({ to: "/pending", replace: true });
  }, [loading, user, role, profile, navigate]);

  // Open edit dialog from URL search param
  useEffect(() => {
    if (openEdit && profile) setEditOpen(true);
  }, [openEdit, profile]);

  // Queries
  const { data: assignments } = useQuery({
    queryKey: ["student-assignments"],
    queryFn: async (): Promise<Assignment[]> => {
      const { data, error } = await supabase.from("assignments").select("*").order("deadline", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Assignment[];
    },
    enabled: !!user,
  });

  const { data: submissions } = useQuery({
    queryKey: ["student-submissions"],
    queryFn: async (): Promise<Submission[]> => {
      const { data, error } = await supabase.from("submissions").select("*").eq("student_id", user!.id);
      if (error) throw error;
      return (data ?? []) as Submission[];
    },
    enabled: !!user,
  });

  const stats = useMemo(() => {
    const total = assignments?.length || 0;
    const submitted = submissions?.length || 0;
    const pending = total - submitted;
    const completion = total > 0 ? Math.round((submitted / total) * 100) : 0;
    let lateCount = 0;
    submissions?.forEach((s) => {
      const a = assignments?.find((a) => a.id === s.assignment_id);
      if (a && new Date(s.submitted_at) > new Date(a.deadline)) lateCount++;
    });
    return { total, submitted, pending, completion, lateCount };
  }, [assignments, submissions]);

  // Recent activity — last 5 submissions
  const recentActivity = useMemo(() => {
    if (!submissions || !assignments) return [];
    return submissions
      .map((s) => {
        const a = assignments.find((a) => a.id === s.assignment_id);
        return { ...s, assignmentTitle: a?.title || "Unknown Assignment", assignmentDeadline: a?.deadline };
      })
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
      .slice(0, 5);
  }, [submissions, assignments]);

  if (loading || !profile) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground"><Loader2 className="animate-spin h-5 w-5 mr-2 inline" /> Loading…</div>;
  }

  const initials = (profile.full_name || "S").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
        {/* ==========================================
            1. Profile Header
            ========================================== */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/8 via-card to-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-brand/15 shadow-lg">
                <AvatarImage src={profile.profile_picture_url || undefined} alt={profile.full_name || "Student"} />
                <AvatarFallback className="bg-brand/10 text-brand text-2xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => setEditOpen(true)}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Upload className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold tracking-tight">{profile.full_name || "Student"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                <Badge variant="secondary" className="bg-brand/10 text-brand border-none font-semibold">
                  <GraduationCap className="h-3 w-3 mr-1" /> Student
                </Badge>
                <Badge variant="secondary" className="bg-success/10 text-success border-none font-semibold">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Approved Account
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            2. Personal Information Card
            ========================================== */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">Personal Information</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Your academic identity and contact details</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} className="text-brand hover:text-brand">
              <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          </div>
          <div className="p-6 grid gap-5 sm:grid-cols-2">
            <InfoField icon={User} label="Full Name" value={profile.full_name} />
            <InfoField icon={Mail} label="Email Address" value={profile.email} />
            <InfoField icon={Phone} label="Mobile Number" value={profile.mobile_no} />
            <InfoField icon={Hash} label="Roll Number" value={profile.roll_number} />
            <InfoField icon={Building2} label="Department" value={profile.department} />
            <InfoField icon={GraduationCap} label="Year" value={profile.year} />
            <InfoField icon={BookOpen} label="Semester" value={profile.semester} />
            <InfoField
              icon={Linkedin}
              label="LinkedIn"
              value={profile.linkedin_url}
              isLink
            />
            <div className="sm:col-span-2">
              <InfoField icon={Target} label="Career Goal" value={profile.career_goal} />
            </div>
            <InfoField icon={Calendar} label="Joined" value={profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : null} />
          </div>
        </div>

        {/* ==========================================
            3. Assignment Summary Card
            ========================================== */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold text-lg">Assignment Summary</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Your overall progress and completion statistics</p>
          </div>
          <div className="p-6">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
              <SummaryStatCard label="Total" value={stats.total} icon={BookOpen} tone="brand" />
              <SummaryStatCard label="Submitted" value={stats.submitted} icon={CheckCircle2} tone="success" />
              <SummaryStatCard label="Pending" value={stats.pending} icon={Clock} tone="warning" />
              <SummaryStatCard label="Late" value={stats.lateCount} icon={AlertCircle} tone="destructive" />
              <div className="col-span-2 lg:col-span-1 rounded-xl border border-border bg-muted/30 p-4 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-brand">{stats.completion}%</span>
                <span className="text-[11px] text-muted-foreground font-medium mt-1">Completion</span>
                <Progress value={stats.completion} className="mt-2 h-1.5 w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            4. Recent Activity
            ========================================== */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold text-lg">Recent Activity</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Your latest assignment submissions</p>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                No submissions yet. Start submitting your assignments!
              </div>
            ) : (
              recentActivity.map((item) => {
                const isLate = item.assignmentDeadline && new Date(item.submitted_at) > new Date(item.assignmentDeadline);
                return (
                  <div key={item.id} className="px-6 py-4 flex items-start gap-3">
                    <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${isLate ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">Assignment Submitted</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">"{item.assignmentTitle}"</p>
                      {isLate && (
                        <Badge variant="destructive" className="mt-1.5 text-[10px] px-1.5 py-0 h-4 bg-destructive/10 text-destructive border-none">Late Submission</Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                      {new Date(item.submitted_at).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      {" · "}
                      {new Date(item.submitted_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* ==========================================
          5. Edit Profile Dialog
          ========================================== */}
      <EditProfileDialog
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
        <a href={value} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand hover:underline truncate block">
          {value}
        </a>
      ) : (
        <p className="text-sm font-medium text-foreground">{value || <span className="text-muted-foreground italic">Not provided</span>}</p>
      )}
    </div>
  );
}

function SummaryStatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof BookOpen; tone: "brand" | "success" | "warning" | "destructive" }) {
  const toneClasses = {
    brand: "text-brand bg-brand/10",
    success: "text-success bg-success/10",
    warning: "text-[oklch(0.55_0.13_75)] bg-warning/15",
    destructive: "text-destructive bg-destructive/10",
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
      <div className={`mx-auto grid h-9 w-9 place-items-center rounded-full ${toneClasses[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
      <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
    </div>
  );
}

// ==========================================
// Edit Profile Dialog
// ==========================================
function EditProfileDialog({
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
  const [year, setYear] = useState(profile.year || "");
  const [semester, setSemester] = useState(profile.semester || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || "");
  const [careerGoal, setCareerGoal] = useState(profile.career_goal || "");
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.profile_picture_url || "");

  // Sync form when profile changes
  useEffect(() => {
    setFullName(profile.full_name || "");
    setMobileNo(profile.mobile_no || "");
    setDepartment(profile.department || "");
    setYear(profile.year || "");
    setSemester(profile.semester || "");
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
          year: year.trim() || null,
          semester: semester.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          career_goal: careerGoal.trim() || null,
          profile_picture_url: avatarUrl || null,
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const initials = (profile.full_name || "S").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your profile information. Some fields are managed by your administrator.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16 border-2 border-brand/20">
                <AvatarImage src={avatarUrl || undefined} alt={fullName || "Student"} />
                <AvatarFallback className="bg-brand/10 text-brand font-bold">{initials}</AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="avatar-upload" className="text-sm font-semibold">Profile Photo</Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className="mt-1.5 cursor-pointer bg-background"
              />
              <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG. Max 2MB.</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-mobile">Mobile Number</Label>
              <Input id="edit-mobile" value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} placeholder="+91 9876543210" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-department">Department</Label>
              <Input id="edit-department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Computer Science Engineering" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-year">Year</Label>
              <Input id="edit-year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2nd Year" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-semester">Semester</Label>
              <Input id="edit-semester" value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g. 4" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-linkedin">LinkedIn URL</Label>
              <Input id="edit-linkedin" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-goal">Career Goal</Label>
            <Textarea id="edit-goal" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} placeholder="What do you want to become? e.g. Full Stack Developer & AI Engineer" rows={3} />
          </div>

          {/* Read-only Fields */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Admin-controlled fields (read-only)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-0.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input value={profile.email} disabled className="bg-muted/50 text-xs" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs text-muted-foreground">Roll Number</Label>
                <Input value={profile.roll_number || "Not assigned"} disabled className="bg-muted/50 text-xs" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Input value={profile.status.charAt(0).toUpperCase() + profile.status.slice(1)} disabled className="bg-muted/50 text-xs" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Input value="Student" disabled className="bg-muted/50 text-xs" />
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
