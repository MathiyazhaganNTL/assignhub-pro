import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
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
  LogOut, Bell, CheckCircle2, Clock, AlertCircle, FileText,
  Link as LinkIcon, UploadCloud, Loader2, Check, User, Settings,
  ChevronDown, Phone, ChevronLeft, ChevronRight, ArrowRight, ArrowLeft,
  Eye, XCircle, Upload, RefreshCw
} from "lucide-react";
import {
  CoinVaultIcon,
  ClipboardCheckIcon,
  FlameIcon,
  CoinStackIcon,
  GiftIcon,
  RankTrophyIcon,
  getAnimatedAchievementIcon,
} from "@/components/gamification-icons";

export const Route = createFileRoute("/student/rewards")({
  head: () => ({ meta: [{ title: "Gamified Dashboard — AssignHub" }] }),
  component: GamifiedDashboard,
});

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  format: "pdf" | "link" | "rich-text";
  content: string;
  deadline: string;
  created_at: string;
  subject_id: string | null;
  assigned_date: string | null;
  max_coins: number | null;
  daily_reduction: number | null;
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

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface LeaderboardEntry {
  user_id: string;
  name: string | null;
  total_points: number;
  rank: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface ActivityLog {
  id: string;
  action: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Helper Functions                                                   */
/* ------------------------------------------------------------------ */

function getPointsLevel(totalPoints: number) {
  return Math.floor(totalPoints / 150) + 1;
}
function getPointsRingFill(totalPoints: number) {
  return (totalPoints % 150) / 150;
}
function getCoinLevel(totalCoins: number) {
  return Math.floor(totalCoins / 50);
}
function getCoinRingFill(totalCoins: number) {
  return (totalCoins % 50) / 50;
}

// Achievement icon resolver — now uses animated SVG icons via getAnimatedAchievementIcon

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* ------------------------------------------------------------------ */
/*  Main Dashboard Component                                           */
/* ------------------------------------------------------------------ */

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

function GamifiedDashboard() {
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

  // Calendar state
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  /* ---- Queries ---- */
  const { data: assignments } = useQuery({
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

  const { data: submissions } = useQuery({
    queryKey: ["student-submissions"],
    queryFn: async (): Promise<Submission[]> => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, reviewer:profiles!submissions_reviewed_by_fkey(full_name)")
        .eq("student_id", user!.id);
      if (error) throw error;
      return (data ?? []) as any[];
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

  const { data: userPoints } = useQuery({
    queryKey: ["user-points"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data ?? { total_points: 0, current_level: 1 };
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

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order("rank", { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as LeaderboardEntry[];
    },
    enabled: !!user,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async (): Promise<Subject[]> => {
      const { data, error } = await supabase.from("subjects").select("*").order("code");
      if (error) throw error;
      return (data ?? []) as Subject[];
    },
    enabled: !!user,
  });

  const { data: earnedAchievements } = useQuery({
    queryKey: ["user-achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: allAchievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: async (): Promise<Achievement[]> => {
      const { data, error } = await supabase.from("achievements").select("*");
      if (error) throw error;
      return (data ?? []) as Achievement[];
    },
    enabled: !!user,
  });

  const { data: activityLogs } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async (): Promise<ActivityLog[]> => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, action, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as ActivityLog[];
    },
    enabled: !!user,
  });

  /* ---- Real-time subscriptions ---- */
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("student-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["student-notifications"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments" }, () => {
        qc.invalidateQueries({ queryKey: ["student-assignments"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "submissions", filter: `student_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["student-submissions"] });
        qc.invalidateQueries({ queryKey: ["user-points"] });
        qc.invalidateQueries({ queryKey: ["user-coins"] });
        qc.invalidateQueries({ queryKey: ["leaderboard"] });
        qc.invalidateQueries({ queryKey: ["activity-logs"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_points", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["user-points"] });
        qc.invalidateQueries({ queryKey: ["leaderboard"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_coins", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["user-coins"] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, qc]);

  /* ---- Auth Protection ---- */
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth", search: { tab: "signin" }, replace: true }); return; }
    if (role === "admin") { navigate({ to: "/admin", replace: true }); return; }
    if (profile && profile.status !== "approved") navigate({ to: "/pending", replace: true });
  }, [loading, user, role, profile, navigate]);

  /* ---- Mutations ---- */
  const markNotificationsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-notifications"] }),
  });

  const submitAssignment = useMutation({
    mutationFn: async () => {
      const existingSub = submissions?.find((s) => s.assignment_id === activeAssignment?.id);
      
      if (existingSub) {
        const { error } = await supabase
          .from("submissions")
          .update({
            format: subFormat,
            content: subContent,
            status: "resubmitted",
            submitted_at: new Date().toISOString(),
            reviewed_by: null,
            reviewed_at: null,
            review_comments: null,
            approval_points: null,
            approval_coins: null,
          })
          .eq("id", existingSub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("submissions").insert({
          assignment_id: activeAssignment?.id!,
          student_id: user?.id!,
          format: subFormat,
          content: subContent,
          status: "submitted",
        });
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
    onError: (err: any) => toast.error(err.message),
  });

  const uploadSubmissionFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}_${activeAssignment?.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("submissions").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("submissions").getPublicUrl(fileName);
      setSubContent(publicUrl);
      toast.success("File uploaded successfully!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = useCallback(() => {
    setSubFormat("text");
    setSubContent("");
    setActiveAssignment(null);
  }, []);

  /* ---- Computed values ---- */
  const unreadCount = useMemo(() => notifications?.filter((n) => !n.is_read).length || 0, [notifications]);

  const totalPoints = userPoints?.total_points ?? 0;
  const totalCoins = userCoins?.total_coins ?? 0;
  const pointsLevel = getPointsLevel(totalPoints);
  const coinLevel = getCoinLevel(totalCoins);
  const pointsRing = getPointsRingFill(totalPoints);
  const coinRing = getCoinRingFill(totalCoins);

  const myRank = useMemo(() => {
    return leaderboard?.find((e) => e.user_id === user?.id)?.rank ?? null;
  }, [leaderboard, user]);

  const streak = useMemo(() => {
    if (!submissions || submissions.length === 0) return 0;
    const dates = [...new Set(submissions.map((s) => new Date(s.submitted_at).toDateString()))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let count = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (dates[i] === expected.toDateString()) count++;
      else break;
    }
    return count;
  }, [submissions]);

  const todayApprovedSubmissions = useMemo(() => {
    const today = new Date().toDateString();
    return submissions?.filter((s) => s.status === "approved" && new Date(s.submitted_at).toDateString() === today).length ?? 0;
  }, [submissions]);

  const coinsEarnedToday = useMemo(() => {
    const today = new Date().toDateString();
    return submissions?.filter((s) => s.status === "approved" && new Date(s.submitted_at).toDateString() === today)
      .reduce((sum, s) => sum + (s.approval_coins || 0), 0) ?? 0;
  }, [submissions]);

  // Filter assignments by subject
  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    if (selectedSubject === "all") return assignments;
    return assignments.filter((a) => a.subject_id === selectedSubject);
  }, [assignments, selectedSubject]);

  // Get the first assignment with dates for the roadmap
  const roadmapAssignment = useMemo(() => {
    const sorted = [...filteredAssignments].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    return sorted.find((a) => !submissions?.some((s) => s.assignment_id === a.id)) ?? sorted[0] ?? null;
  }, [filteredAssignments, submissions]);

  // Next reward milestone (multiples of 200)
  const nextRewardTarget = Math.ceil((totalPoints + 1) / 200) * 200;
  const rewardProgress = totalPoints / nextRewardTarget;

  if (loading || !profile) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ============ HEADER ============ */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted/30 hover:bg-muted py-1.5 px-3 rounded-md">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground text-sm font-bold shadow-sm">A</div>
              <div>
                <div className="text-sm font-semibold leading-tight">AssignHub</div>
                <div className="text-[10px] text-muted-foreground leading-tight uppercase tracking-wider font-semibold">Student Portal</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <Popover onOpenChange={(open) => { if (open && unreadCount > 0) markNotificationsRead.mutate(); }}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4.5 w-4.5 text-muted-foreground" />
                  {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />}
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
                      <div key={n.id} className={`p-4 text-left transition-colors hover:bg-muted/10 ${!n.is_read ? "bg-brand/5" : ""}`}>
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
                  <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">{profile.full_name || "Student"}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end" sideOffset={8}>
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
                      <Phone className="h-3 w-3" /><span>{profile.mobile_no}</span>
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/student/profile" search={{ edit: false }}><User className="h-4 w-4 mr-2" /> View Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/student/profile" search={{ edit: true }}><Settings className="h-4 w-4 mr-2" /> Edit Profile</Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => signOut().then(() => navigate({ to: "/", replace: true }))}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ============ MAIN CONTENT ============ */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ============ LEFT COLUMN (2/3) ============ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome */}
            <div>
              <p className="text-sm text-muted-foreground">Welcome back,</p>
              <h1 className="text-3xl font-bold tracking-tight mt-1">{profile.full_name || "Student"}</h1>
              <p className="text-sm text-brand font-medium mt-1">Keep learning, keep earning points!</p>
            </div>

            {/* Points & Coins Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GamificationRingCard
                label="My Points"
                value={totalPoints}
                unit="points"
                level={pointsLevel}
                fill={pointsRing}
                colorFrom="#4F7DF3"
                colorTo="#7B9CF8"
                icon={<PointsIcon />}
              />
              <GamificationRingCard
                label="My Coins"
                value={totalCoins}
                unit="coins"
                level={coinLevel}
                fill={coinRing}
                colorFrom="#E8A838"
                colorTo="#F0C060"
                icon={<CoinsIcon />}
              />
            </div>

            {/* Today Summary */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-base font-bold mb-4">Today Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                <MiniStat icon={<ClipboardCheckIcon size={22} />} label="Assignments Completed" value={todayApprovedSubmissions} />
                <MiniStat icon={<FlameIcon size={22} />} label="Streak" value={`${streak} days`} />
                <MiniStat icon={<CoinStackIcon size={22} />} label="Coins Earned Today" value={coinsEarnedToday} />
              </div>
            </div>

            {/* Achievements */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-base font-bold mb-4">Achievements</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(allAchievements ?? []).map((ach) => {
                  const earned = earnedAchievements?.some((ea: any) => ea.achievement_id === ach.id);
                  return (
                    <div
                      key={ach.id}
                      className={`rounded-xl border p-4 text-center transition-all duration-250 hover:scale-[1.02] hover:shadow-md hover:border-brand/30 ${earned ? "border-brand/30 bg-brand/5" : "border-border bg-muted/30 opacity-60"}`}
                    >
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-background border border-border shadow-sm">
                        {getAnimatedAchievementIcon(ach.icon, !!earned)}
                      </div>
                      <p className="text-xs font-bold mt-2">{ach.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{ach.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assignment Roadmap */}
            {roadmapAssignment && <AssignmentRoadmap assignment={roadmapAssignment} />}

            {/* Next Reward */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base font-bold">Next Reward</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">You are {nextRewardTarget - totalPoints} points away from your next reward!</p>
                </div>
                <div className="text-sm font-bold text-muted-foreground">{totalPoints} / {nextRewardTarget} points</div>
              </div>
              <div className="mt-3 h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, rewardProgress * 100)}%`,
                    background: "linear-gradient(90deg, #4F7DF3, #7B9CF8)",
                  }}
                />
              </div>
              <div className="flex justify-end mt-1.5">
                <GiftIcon size={28} />
              </div>
            </div>

            {/* Your Assignments */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Your Assignments</h2>
              {!assignments || assignments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No assignments published yet</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">Check back later once the administrator releases new assignment material.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {assignments.map((a) => {
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
                            <div className="mt-4"><Button size="sm" variant="outline" asChild><a href={a.content} target="_blank" rel="noreferrer"><LinkIcon className="mr-1.5 h-3.5 w-3.5" /> View External Resource</a></Button></div>
                          )}
                          {a.format === "pdf" && (
                            <div className="mt-4"><Button size="sm" variant="outline" asChild><a href={a.content} target="_blank" rel="noreferrer"><FileText className="mr-1.5 h-3.5 w-3.5" /> View PDF document</a></Button></div>
                          )}

                          {sub && (
                            <div className="mt-4 p-3.5 bg-muted/20 border border-border/40 rounded-xl text-xs space-y-2">
                              <p className="font-bold text-foreground">Review Status</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground">
                                <div>
                                  <span className="block text-[10px] uppercase font-bold text-muted-foreground/70 mb-0.5">Status:</span>
                                  <span className="font-semibold text-foreground capitalize text-[13px]">{sub.status.replace('_', ' ')}</span>
                                </div>
                                
                                {sub.reviewed_by && (
                                  <div>
                                    <span className="block text-[10px] uppercase font-bold text-muted-foreground/70 mb-0.5">Reviewed By:</span>
                                    <span className="font-semibold text-foreground text-[13px]">{sub.reviewer?.full_name || "Admin"}</span>
                                  </div>
                                )}
                                
                                {sub.review_comments && (
                                  <div className="sm:col-span-2 mt-1">
                                    <span className="block text-[10px] uppercase font-bold text-muted-foreground/70 mb-1">Comments:</span>
                                    <div className="bg-background border border-border/80 rounded-lg p-2.5 text-foreground font-medium italic whitespace-pre-wrap leading-relaxed">{sub.review_comments}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2">
                          <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> Due: {new Date(a.deadline).toLocaleString()}
                          </div>
                          {(!sub || sub.status === 'rejected') && (
                            <Dialog open={submissionOpen && activeAssignment?.id === a.id} onOpenChange={(val) => { setSubmissionOpen(val); if (val) setActiveAssignment(a); else resetForm(); }}>
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
                                          <CheckCircle2 className="h-3.5 w-3.5 text-success" /> File ready: <a href={subContent} target="_blank" rel="noreferrer" className="underline truncate max-w-xs">{subContent}</a>
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
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ============ RIGHT COLUMN (1/3) ============ */}
          <div className="space-y-6">
            {/* Profile Overview */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold">Profile Overview</h2>
                <Link to="/student/profile" search={{ edit: false }} className="text-xs text-brand font-semibold flex items-center gap-0.5 hover:underline">
                  View profile <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-brand font-semibold">Rank</p>
                  <p className="text-4xl font-extrabold tracking-tight">#{myRank ?? "—"}</p>
                </div>
                <div className="ml-auto"><RankTrophyIcon /></div>
              </div>
              <Link to="/dashboard" className="text-xs text-brand font-semibold flex items-center gap-0.5 mt-3 hover:underline">
                View leaderboard <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Leaderboard */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-base font-bold mb-4">Student Leaderboard</h2>
              <div className="space-y-2.5">
                {(!leaderboard || leaderboard.length === 0) ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No leaderboard data yet.</p>
                ) : (
                  leaderboard.map((entry) => (
                    <div key={entry.user_id} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${entry.user_id === user?.id ? "bg-brand/8 border border-brand/20" : "hover:bg-muted/40"}`}>
                      <RankBadge rank={entry.rank} />
                      <span className="text-sm font-medium flex-1 truncate">{entry.name ?? "Student"}</span>
                      <span className="text-xs font-bold text-muted-foreground">{entry.total_points} pts</span>
                    </div>
                  ))
                )}
              </div>
              <button className="text-xs text-brand font-semibold flex items-center gap-0.5 mt-4 hover:underline">
                View full leaderboard <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Assignment Calendar */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-base font-bold mb-3">Assignment Calendar</h2>
              <CalendarWidget
                month={calMonth}
                year={calYear}
                onPrevMonth={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }}
                onNextMonth={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }}
                assignments={filteredAssignments}
              />

              {/* Subject Selector */}
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-xs font-bold mb-1">Select Subject</p>
                <p className="text-[10px] text-muted-foreground mb-2">View calendar & roadmap for a subject</p>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {(subjects ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Calendar Legend */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Assigned Date</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Due Date</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand" /> In Progress</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive/40" /> Late Due</div>
              </div>
            </div>

            {/* Recent Activity */}
            {activityLogs && activityLogs.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-base font-bold mb-3">Recent Activity</h2>
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                      <div>
                        <p className="text-xs font-medium leading-snug">{log.action}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-Components                                                     */
/* ------------------------------------------------------------------ */

function GamificationRingCard({ label, value, unit, level, fill, colorFrom, colorTo, icon }: {
  label: string; value: number; unit: string; level: number; fill: number; colorFrom: string; colorTo: string; icon: React.ReactNode;
}) {
  const radius = 40;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fill);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-5" style={{ borderColor: `${colorFrom}30` }}>
      <div className="relative shrink-0">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/30" />
          <circle
            cx="48" cy="48" r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 48 48)"
            style={{
              stroke: `url(#grad-${label.replace(/\s/g, "")})`,
              transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          <defs>
            <linearGradient id={`grad-${label.replace(/\s/g, "")}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={colorFrom} />
              <stop offset="100%" stopColor={colorTo} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">{icon}</div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-semibold">{label}</p>
        <p className="text-3xl font-extrabold tracking-tight">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{unit}</p>
        <p className="text-xs font-bold mt-1" style={{ color: colorFrom }}>Level {level}</p>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/50">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-[10px] text-muted-foreground font-medium leading-tight">{label}</p>
      <p className="text-xl font-extrabold mt-1">{value}</p>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "bg-amber-400 text-white",
    2: "bg-gray-400 text-white",
    3: "bg-amber-600 text-white",
  };
  return (
    <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${colors[rank] || "bg-muted text-muted-foreground"}`}>
      {rank}
    </span>
  );
}

function CalendarWidget({ month, year, onPrevMonth, onNextMonth, assignments }: {
  month: number; year: number; onPrevMonth: () => void; onNextMonth: () => void; assignments: Assignment[];
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  // Build date -> type map
  const dateMap = useMemo(() => {
    const map: Record<number, Set<string>> = {};
    assignments.forEach((a) => {
      const assigned = new Date(a.assigned_date || a.created_at);
      const due = new Date(a.deadline);
      if (assigned.getMonth() === month && assigned.getFullYear() === year) {
        const d = assigned.getDate();
        if (!map[d]) map[d] = new Set();
        map[d].add("assigned");
      }
      if (due.getMonth() === month && due.getFullYear() === year) {
        const d = due.getDate();
        if (!map[d]) map[d] = new Set();
        map[d].add("due");
      }
      // In-progress days between assigned and due
      const start = new Date(assigned);
      start.setDate(start.getDate() + 1);
      while (start < due) {
        if (start.getMonth() === month && start.getFullYear() === year) {
          const d = start.getDate();
          if (!map[d]) map[d] = new Set();
          map[d].add("progress");
        }
        start.setDate(start.getDate() + 1);
      }
    });
    return map;
  }, [assignments, month, year]);

  const cells = [];
  // Previous month fill
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDays = getDaysInMonth(prevYear, prevMonth);
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push(<div key={`prev-${i}`} className="text-center text-xs text-muted-foreground/40 py-1.5">{prevDays - i}</div>);
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const types = dateMap[d];
    const hasAssigned = types?.has("assigned");
    const hasDue = types?.has("due");
    const hasProgress = types?.has("progress");

    let dotColor = "";
    if (hasDue) dotColor = "bg-destructive";
    else if (hasAssigned) dotColor = "bg-success";
    else if (hasProgress) dotColor = "bg-brand";

    cells.push(
      <div key={d} className={`relative text-center text-xs py-1.5 rounded-md font-medium ${isToday ? "bg-brand text-brand-foreground font-bold" : ""} ${hasDue && !isToday ? "text-destructive font-bold" : ""} ${hasAssigned && !isToday && !hasDue ? "text-success font-bold" : ""}`}>
        {d}
        {dotColor && !isToday && <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full ${dotColor}`} />}
      </div>,
    );
  }
  // Next month fill
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push(<div key={`next-${i}`} className="text-center text-xs text-muted-foreground/40 py-1.5">{i}</div>);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrevMonth} className="p-1 rounded hover:bg-muted transition"><ChevronLeft className="h-4 w-4" /></button>
        <p className="text-sm font-bold">{MONTH_NAMES[month]} {year}</p>
        <button onClick={onNextMonth} className="p-1 rounded hover:bg-muted transition"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-[10px] text-muted-foreground font-semibold py-1">{d}</div>
        ))}
        {cells}
      </div>
    </div>
  );
}

function AssignmentRoadmap({ assignment }: { assignment: Assignment }) {
  const assignedDate = new Date(assignment.assigned_date || assignment.created_at);
  const dueDate = new Date(assignment.deadline);
  const maxCoins = assignment.max_coins ?? 100;
  const daysDiff = Math.max(1, Math.ceil((dueDate.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24)));
  const dailyReduction = assignment.daily_reduction ?? Math.max(1, Math.round(maxCoins / daysDiff));

  // Build roadmap nodes
  const nodes: { date: Date; label: string; coins: string; isStart: boolean; isEnd: boolean }[] = [];
  for (let i = 0; i <= daysDiff; i++) {
    const d = new Date(assignedDate);
    d.setDate(d.getDate() + i);
    const isStart = i === 0;
    const isEnd = i === daysDiff;
    const coins = isStart ? `+${maxCoins} coins` : `-${dailyReduction} coins`;
    const label = isStart ? "Assigned" : isEnd ? "Due Date" : "In Progress";
    nodes.push({ date: d, label, coins, isStart, isEnd });
  }

  // Only show max 6 nodes to avoid overflow
  const displayNodes = nodes.length > 6
    ? [nodes[0], ...nodes.slice(1, 4), { date: nodes[nodes.length - 2].date, label: "...", coins: "", isStart: false, isEnd: false }, nodes[nodes.length - 1]]
    : nodes;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-base font-bold text-destructive mb-4">Assignment Roadmap</h2>
      <div className="flex items-start overflow-x-auto pb-2 gap-0">
        {displayNodes.map((node, i) => (
          <div key={i} className="flex items-start shrink-0">
            <div className="flex flex-col items-center" style={{ minWidth: 80 }}>
              <div className={`h-10 w-10 rounded-full border-2 grid place-items-center text-[10px] font-bold leading-tight ${node.isEnd ? "border-destructive text-destructive bg-destructive/10" : node.isStart ? "border-success text-success bg-success/10" : "border-brand text-brand bg-brand/10"}`}>
                <span className="text-[8px]">{MONTH_NAMES[node.date.getMonth()].slice(0, 3)}</span>
                <span className="text-sm -mt-0.5">{node.date.getDate()}</span>
              </div>
              <p className={`text-[10px] font-bold mt-1.5 ${node.isEnd ? "text-destructive" : node.isStart ? "text-success" : "text-muted-foreground"}`}>{node.label}</p>
              <p className={`text-[10px] font-semibold ${node.coins.startsWith("+") ? "text-success" : "text-destructive"}`}>{node.coins}</p>
            </div>
            {i < displayNodes.length - 1 && (
              <div className="flex items-center mt-4 px-1">
                <div className="w-6 border-t-2 border-dashed border-brand/40" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- SVG Icons ---- */

function PointsIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#4F7DF3]">
      <rect x="4" y="6" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="14" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="16" cy="14" r="1.5" fill="currentColor" opacity="0.5" />
      <line x1="10" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CoinsIcon() {
  return (
    <div className="relative" style={{ width: 48, height: 48 }}>
      <style>{`
        @keyframes coin-fall-1 { 0% { opacity:0; transform:translateY(0); } 15% { opacity:1; } 85% { opacity:1; } 100% { opacity:0; transform:translateY(22px); } }
        @keyframes coin-fall-2 { 0% { opacity:0; transform:translateY(0) rotate(0); } 20% { opacity:1; } 80% { opacity:1; } 100% { opacity:0; transform:translateY(20px) rotate(40deg); } }
        @keyframes coin-fall-3 { 0% { opacity:0; transform:translateY(0) rotate(0); } 10% { opacity:1; } 90% { opacity:1; } 100% { opacity:0; transform:translateY(24px) rotate(-30deg); } }
        @keyframes bag-react { 0%,80%,100% { transform:scale(1); } 90% { transform:scale(1.04); } }
        @keyframes cloud-drift { 0%,100% { transform:translateX(0); } 50% { transform:translateX(1.5px); } }
      `}</style>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        {/* Cloud */}
        <g style={{ animation: "cloud-drift 4s ease-in-out infinite" }}>
          <ellipse cx="24" cy="8" rx="10" ry="4.5" fill="#e2e8f0" />
          <ellipse cx="20" cy="7.5" rx="6" ry="4" fill="#f1f5f9" />
          <ellipse cx="28" cy="7" rx="5" ry="3.5" fill="#f1f5f9" />
          <ellipse cx="24" cy="6.5" rx="7" ry="3.5" fill="#f8fafc" />
        </g>
        {/* Falling coins */}
        <g>
          <circle cx="21" cy="13" r="2.5" fill="#F0C060" stroke="#D4A030" strokeWidth="0.5" style={{ animation: "coin-fall-1 2.8s ease-in infinite", animationDelay: "0s" }} />
          <circle cx="27" cy="14" r="2" fill="#F0C060" stroke="#D4A030" strokeWidth="0.5" style={{ animation: "coin-fall-2 2.8s ease-in infinite", animationDelay: "0.5s" }} />
          <circle cx="24" cy="12" r="2.2" fill="#F0C060" stroke="#D4A030" strokeWidth="0.5" style={{ animation: "coin-fall-3 2.8s ease-in infinite", animationDelay: "1s" }} />
          <circle cx="19" cy="14" r="1.8" fill="#F0C060" stroke="#D4A030" strokeWidth="0.5" style={{ animation: "coin-fall-2 2.8s ease-in infinite", animationDelay: "1.6s" }} />
        </g>
        {/* Coin bag */}
        <g style={{ animation: "bag-react 2.8s ease-in-out infinite", transformOrigin: "24px 38px" }}>
          {/* Bag body */}
          <path d="M16 34 C16 30 18 28 24 28 C30 28 32 30 32 34 C32 40 30 42 24 42 C18 42 16 40 16 34Z" fill="#E8A838" />
          {/* Bag tie / neck */}
          <path d="M20 28 C20 26 22 25 24 25 C26 25 28 26 28 28" stroke="#D4A030" strokeWidth="1.2" fill="none" />
          <ellipse cx="24" cy="28" rx="4" ry="1" fill="#D4A030" />
          {/* Dollar sign */}
          <text x="24" y="37" fontSize="8" fill="#B8860B" textAnchor="middle" fontWeight="bold" fontFamily="system-ui">$</text>
          {/* Bag highlight */}
          <ellipse cx="21" cy="33" rx="2" ry="3" fill="#F0C060" opacity="0.4" />
        </g>
      </svg>
    </div>
  );
}