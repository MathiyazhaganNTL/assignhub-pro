import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  LogOut, BookOpen, Bell, CheckCircle2, Clock, AlertCircle, FileText,
  Link as LinkIcon, UploadCloud, Loader2, Check, RefreshCw, Sparkles,
  User, Settings, ChevronDown, Phone, Trophy, Eye, XCircle, Upload
} from "lucide-react";
import { CoinVaultIcon } from "@/components/gamification-icons";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AssignHub" }] }),
  component: StudentDashboard,
});

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
  status: "submitted" | "under_review" | "approved" | "rejected" | "resubmitted";
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_comments?: string | null;
  approval_points?: number | null;
  approval_coins?: number | null;
  resubmission_count: number;
  reviewer?: {
    full_name: string | null;
  } | null;
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

function SubmissionStatusBadge({ status }: { status: Submission["status"] }) {
  switch (status) {
    case "submitted":
      return (
        <Badge variant="secondary" className="bg-[#4F7DF3]/15 text-[#4F7DF3] hover:bg-[#4F7DF3]/15 border-none font-semibold flex items-center gap-1">
          <Upload className="h-3.5 w-3.5" /> Submitted
        </Badge>
      );
    case "under_review":
      return (
        <Badge variant="secondary" className="bg-orange-500/15 text-orange-600 hover:bg-orange-500/15 border-none font-semibold flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> Under Review
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="secondary" className="bg-success/15 text-success hover:bg-success/15 border-none font-semibold flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="secondary" className="bg-destructive/15 text-destructive hover:bg-destructive/15 border-none font-semibold flex items-center gap-1">
          <XCircle className="h-3.5 w-3.5" /> Rejected
        </Badge>
      );
    case "resubmitted":
      return (
        <Badge variant="secondary" className="bg-indigo-500/15 text-indigo-600 hover:bg-indigo-500/15 border-none font-semibold flex items-center gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> Resubmitted
        </Badge>
      );
    default:
      return null;
  }
}

function StudentDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading, role, profile, signOut } = useAuth();
  
  // Modal State
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [subFormat, setSubFormat] = useState<"file" | "text">("text");
  const [subContent, setSubContent] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleOpenDialog = (a: Assignment, existingSub?: Submission) => {
    setActiveAssignment(a);
    if (existingSub) {
      setSubFormat(existingSub.format);
      setSubContent(existingSub.content);
    } else {
      setSubFormat("text");
      setSubContent("");
    }
    setSubmissionOpen(true);
  };

  // Queries
  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ["student-assignments"],
    queryFn: async (): Promise<Assignment[]> => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .order("deadline", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Assignment[];
    },
    enabled: !!user,
  });

  const { data: submissions, isLoading: loadingSubmissions } = useQuery({
    queryKey: ["student-submissions"],
    queryFn: async (): Promise<Submission[]> => {
      // Try with reviewer FK join first; if migration not applied, fallback to simple select
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("student_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((d: any) => ({ ...d, resubmission_count: d.resubmission_count ?? 0 })) as any[];
    },
    enabled: !!user,
  });

  const { data: notifications, isLoading: loadingNotifications } = useQuery({
    queryKey: ["student-notifications"],
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    enabled: !!user,
  });

  const { data: userCoins } = useQuery({
    queryKey: ["user-coins"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_coins")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data ?? { total_coins: 0, coin_level: 0 };
    },
    enabled: !!user,
  });

  // Real-time postgres subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("student-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => { 
          qc.invalidateQueries({ queryKey: ["student-notifications"] });
          toast("New notification received!");
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignments" },
        () => { 
          qc.invalidateQueries({ queryKey: ["student-assignments"] });
          toast("Assignments updated!");
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions", filter: `student_id=eq.${user.id}` },
        () => { qc.invalidateQueries({ queryKey: ["student-submissions"] }); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_coins", filter: `user_id=eq.${user.id}` },
        () => { qc.invalidateQueries({ queryKey: ["user-coins"] }); }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, qc]);

  // Auth Protection
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth", search: { tab: "signin" }, replace: true }); return; }
    if (role === "admin") { navigate({ to: "/admin", replace: true }); return; }
    if (profile && profile.status !== "approved") navigate({ to: "/pending", replace: true });
  }, [loading, user, role, profile, navigate]);

  // Mutations
  const markNotificationsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-notifications"] });
    }
  });

  const submitAssignment = useMutation({
    mutationFn: async () => {
      const existingSub = submissions?.find((s) => s.assignment_id === activeAssignment?.id);
      
      if (existingSub) {
        const updatePayload: Record<string, any> = {
          format: subFormat,
          content: subContent,
          submitted_at: new Date().toISOString(),
        };
        // Include workflow fields only if status column exists (migration applied)
        if ('status' in existingSub) {
          updatePayload.status = "resubmitted";
          updatePayload.reviewed_by = null;
          updatePayload.reviewed_at = null;
          updatePayload.review_comments = null;
          updatePayload.approval_points = null;
          updatePayload.approval_coins = null;
        }
        const { error } = await supabase
          .from("submissions")
          .update(updatePayload)
          .eq("id", existingSub.id);
        if (error) throw error;
      } else {
        const insertPayload: Record<string, any> = {
          assignment_id: activeAssignment?.id!,
          student_id: user?.id!,
          format: subFormat,
          content: subContent,
        };
        const { error } = await supabase
          .from("submissions")
          .insert(insertPayload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      const existingSub = submissions?.find((s) => s.assignment_id === activeAssignment?.id);
      toast.success(existingSub ? "Assignment resubmitted successfully!" : "Assignment submitted successfully!");
      qc.invalidateQueries({ queryKey: ["student-submissions"] });
      setSubmissionOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  // Storage Upload Helper
  const uploadSubmissionFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}_${activeAssignment?.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("submissions")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("submissions")
        .getPublicUrl(filePath);

      setSubContent(publicUrl);
      toast.success("File uploaded successfully!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSubFormat("text");
    setSubContent("");
    setActiveAssignment(null);
  };

  const unreadCount = useMemo(() => {
    return notifications?.filter(n => !n.is_read).length || 0;
  }, [notifications]);

  const stats = useMemo(() => {
    const total = assignments?.length || 0;
    const submitted = submissions?.length || 0;
    const active = total - submitted;
    return { total, submitted, active };
  }, [assignments, submissions]);

  if (loading || !profile) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground text-sm font-bold">A</div>
            <div>
              <div className="text-sm font-semibold leading-tight">AssignHub</div>
              <div className="text-xs text-muted-foreground leading-tight">Student Portal</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <Popover onOpenChange={(open) => { if(open && unreadCount > 0) markNotificationsRead.mutate(); }}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4.5 w-4.5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && <Badge variant="secondary" className="bg-destructive/10 text-destructive border-none">{unreadCount} new</Badge>}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-border">
                  {loadingNotifications ? (
                    <div className="p-4 text-center text-xs text-muted-foreground"><Loader2 className="animate-spin inline h-4 w-4 mr-1" /> Loading...</div>
                  ) : notifications?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">No notifications yet.</div>
                  ) : (
                    notifications?.map((n) => (
                      <div key={n.id} className={`p-4 text-left transition-colors hover:bg-muted/10 ${!n.is_read ? 'bg-brand/5' : ''}`}>
                        <div className="font-semibold text-xs text-foreground flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-normal">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-muted/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring" id="profile-menu-trigger">
                  <Avatar className="h-8 w-8 border-2 border-brand/20">
                    <AvatarImage src={profile.profile_picture_url || undefined} alt={profile.full_name || "Student"} />
                    <AvatarFallback className="bg-brand/10 text-brand text-xs font-bold">
                      {(profile.full_name || "S").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end" sideOffset={8}>
                {/* Profile Header */}
                <div className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border-2 border-brand/20">
                      <AvatarImage src={profile.profile_picture_url || undefined} alt={profile.full_name || "Student"} />
                      <AvatarFallback className="bg-brand/10 text-brand text-sm font-bold">
                        {(profile.full_name || "S").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{profile.full_name || "Student"}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-brand/10 text-brand border-none font-semibold">Student</Badge>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-success/10 text-success border-none font-semibold">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                          {profile.status === "approved" ? "Approved" : profile.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {profile.mobile_no && (
                    <div className="flex items-center gap-1.5 mt-2.5 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{profile.mobile_no}</span>
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/student/profile" search={{ edit: false }}>
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/student/profile" search={{ edit: true }}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => signOut().then(() => navigate({ to: "/", replace: true }))}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/10 to-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{profile.full_name || "Student"}</h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-success font-medium">
              <CheckCircle2 className="h-4 w-4" /> Account Approved & Access Granted
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2 shadow-sm">
              <CoinVaultIcon className="w-10 h-10" />
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Overall Coins</p>
                <p className="text-lg font-extrabold leading-none text-[#E8A838]">{userCoins?.total_coins || 0}</p>
              </div>
            </div>
            <Button size="default" variant="default" className="bg-brand text-brand-foreground font-semibold" asChild>
              <Link to="/student/rewards">
                <Trophy className="h-4 w-4 mr-2" /> View Gamified Dashboard
              </Link>
            </Button>
            <Button size="icon" variant="outline" onClick={() => { qc.invalidateQueries(); toast.success("Refreshed data!"); }} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={BookOpen} label="Total assignments" value={String(stats.total)} />
          <StatCard icon={CheckCircle2} label="Submitted" value={String(stats.submitted)} />
          <StatCard icon={Clock} label="Pending submission" value={String(stats.active)} tone={stats.active > 0 ? "warning" : "default"} />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Your Assignments</h2>
          
          {loadingAssignments || loadingSubmissions ? (
            <div className="text-center py-20 text-sm text-muted-foreground"><Loader2 className="animate-spin inline h-5 w-5 mr-2" />Loading assignments…</div>
          ) : assignments?.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No assignments published yet</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Check back later once the administrator releases new assignment material.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {assignments?.map((a) => {
                const sub = submissions?.find((s) => s.assignment_id === a.id);
                const isLate = new Date() > new Date(a.deadline);
                
                return (
                  <div key={a.id} className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base text-foreground leading-snug">{a.title}</h3>
                        {sub ? (
                          <SubmissionStatusBadge status={sub.status} />
                        ) : isLate ? (
                          <Badge variant="destructive" className="bg-destructive/15 text-destructive hover:bg-destructive/15 border-none font-semibold"><AlertCircle className="h-3 w-3 mr-1" /> Overdue</Badge>
                        ) : (
                          <Badge variant="outline" className="text-warning border-warning/30 bg-warning/5 font-semibold"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap font-medium">
                        {a.description || "No guidelines specified for this assignment."}
                      </p>

                      {a.format === "rich-text" && (
                        <div className="mt-4 bg-muted/40 rounded-lg p-3 text-xs border font-medium text-foreground max-h-24 overflow-y-auto whitespace-pre-wrap">{a.content}</div>
                      )}

                      {a.format === "link" && (
                        <div className="mt-4">
                          <Button size="sm" variant="outline" asChild>
                            <a href={a.content} target="_blank" rel="noreferrer"><LinkIcon className="mr-1.5 h-3.5 w-3.5" /> View External Resource</a>
                          </Button>
                        </div>
                      )}

                      {a.format === "pdf" && (
                        <div className="mt-4">
                          <Button size="sm" variant="outline" asChild>
                            <a href={a.content} target="_blank" rel="noreferrer"><FileText className="mr-1.5 h-3.5 w-3.5" /> View PDF document</a>
                          </Button>
                        </div>
                      )}

                      {sub && sub.status === "approved" && (
                        <div className="mt-4 p-3.5 bg-success/5 border border-success/20 rounded-xl text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="font-bold text-success text-[13px]">Assignment Approved</span>
                          </div>
                          {(sub.approval_points || sub.approval_coins) && (
                            <p className="text-muted-foreground font-medium">Earned <span className="text-foreground font-bold">+{sub.approval_points} points</span> & <span className="text-foreground font-bold">+{sub.approval_coins} coins</span></p>
                          )}
                          {sub.review_comments && (
                            <div className="bg-background border border-success/20 rounded-lg p-2.5 text-foreground font-medium italic whitespace-pre-wrap leading-relaxed mt-1">{sub.review_comments}</div>
                          )}
                        </div>
                      )}

                      {sub && sub.status === "rejected" && (
                        <div className="mt-4 p-3.5 bg-destructive/5 border border-destructive/20 rounded-xl text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span className="font-bold text-destructive text-[13px]">Assignment Rejected</span>
                          </div>
                          {sub.review_comments && (
                            <div className="mt-1">
                              <span className="block text-[10px] uppercase font-bold text-destructive/70 mb-1">Reason for Rejection:</span>
                              <div className="bg-background border border-destructive/20 rounded-lg p-2.5 text-foreground font-medium whitespace-pre-wrap leading-relaxed">{sub.review_comments}</div>
                            </div>
                          )}
                          <p className="text-muted-foreground font-medium mt-1">Please review the feedback above and resubmit your work.</p>
                        </div>
                      )}

                      {sub && (sub.status === "submitted" || sub.status === "under_review" || sub.status === "resubmitted") && (
                        <div className="mt-4 p-3.5 bg-muted/20 border border-border/40 rounded-xl text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className="font-bold text-foreground text-[13px] capitalize">{sub.status.replace('_', ' ')}</span>
                          </div>
                          {sub.reviewed_by && (
                            <p className="text-muted-foreground font-medium">Reviewed by: <span className="text-foreground font-semibold">{sub.reviewer?.full_name || "Admin"}</span></p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> Due: {new Date(a.deadline).toLocaleString()}
                      </div>
                      
                      {(!sub || sub.status === 'rejected') && (
                        (() => {
                          const resubLimitReached = sub && sub.status === 'rejected' && (sub.resubmission_count ?? 0) >= 2;
                          
                          if (resubLimitReached) {
                            return (
                              <div className="flex flex-col items-end gap-1.5">
                                <Button size="sm" variant="outline" className="border-muted text-muted-foreground font-semibold shadow-sm cursor-not-allowed opacity-60" disabled>
                                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Resubmit Assignment
                                </Button>
                                <p className="text-[10px] text-destructive font-medium text-right max-w-[200px] leading-tight">Maximum resubmission limit reached. Please contact administrator.</p>
                              </div>
                            );
                          }
                          
                          return (
                            <Dialog open={submissionOpen && activeAssignment?.id === a.id} onOpenChange={(val) => { setSubmissionOpen(val); if(val) setActiveAssignment(a); else resetForm(); }}>
                              <DialogTrigger asChild>
                                {sub ? (
                                  <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold shadow-sm" onClick={() => handleOpenDialog(a, sub)}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Resubmit Assignment</Button>
                                ) : (
                                  <Button size="sm" variant={isLate ? "destructive" : "default"} onClick={() => handleOpenDialog(a)}><UploadCloud className="mr-1.5 h-4 w-4" /> Submit Work</Button>
                                )}
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>{sub ? "Resubmit assignment" : "Submit assignment"}</DialogTitle>
                                  <DialogDescription>
                                    {sub ? `Upload your revised submission response for "${a.title}".` : `Upload your submission response for "${a.title}".`}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                  <div className="space-y-1.5">
                                    <label className="text-sm font-semibold">Submission format</label>
                                    <Select value={subFormat} onValueChange={(val: any) => { setSubFormat(val); setSubContent(""); }}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="text">Written text answer</SelectItem>
                                        <SelectItem value="file">File upload</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {subFormat === "text" ? (
                                    <div className="space-y-1.5">
                                      <label className="text-sm font-semibold">Your response text</label>
                                      <Textarea value={subContent} onChange={(e) => setSubContent(e.target.value)} placeholder="Type your text submission details here..." rows={6} />
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5 border border-dashed border-border rounded-lg p-4 bg-muted/40">
                                      <label className="text-sm font-semibold block mb-2">Upload attachment</label>
                                      <Input type="file" onChange={uploadSubmissionFile} disabled={uploading} className="bg-background cursor-pointer" />
                                      {uploading && <div className="text-xs text-muted-foreground mt-1"><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />Uploading file to storage...</div>}
                                      {subContent && !uploading && (
                                        <div className="text-xs text-brand font-medium mt-2 flex items-center gap-1">
                                          <CheckCircle2 className="h-3.5 w-3.5 text-success" /> File ready
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setSubmissionOpen(false)}>Cancel</Button>
                                  <Button onClick={() => submitAssignment.mutate()} disabled={!subContent || submitAssignment.isPending}>
                                    {submitAssignment.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                                    {sub ? "Resubmit" : "Submit"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          );
                        })()
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "default" }: { icon: typeof BookOpen; label: string; value: string; tone?: "default" | "warning" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground font-semibold">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={`mt-2 text-3xl font-extrabold ${tone === "warning" && value !== "0" ? "text-warning" : "text-foreground"}`}>{value}</div>
    </div>
  );
}