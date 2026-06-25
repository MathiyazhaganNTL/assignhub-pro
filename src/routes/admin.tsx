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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
  LogOut, Users, ShieldCheck, Clock4, XCircle, CheckCircle2, Search, Loader2,
  Plus, FileText, Link as LinkIcon, Trash2, Edit3, Calendar, FileSpreadsheet,
  AlertCircle, BarChart3, TrendingUp, CheckCircle, Clock, ChevronDown, User, Settings,
  Eye, Upload, RefreshCw, Compass
} from "lucide-react";
import { useOnboarding } from "@/lib/onboarding-context";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — AssignHub" }] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const { user, loading, role, profile, signOut } = useAuth();
  const { startTour } = useOnboarding();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth", search: { tab: "signin" }, replace: true }); return; }
    if (role !== "admin") navigate({ to: "/dashboard", replace: true });
  }, [loading, user, role, navigate]);

  if (loading || role !== "admin") {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  const adminInitials = (profile?.full_name || "A").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="AssignHub Logo" className="h-8 w-8 object-contain drop-shadow-[0_2px_8px_oklch(0.66_0.17_256_/_0.3)] shrink-0" />
            <div>
              <div className="text-sm font-semibold leading-tight">AssignHub</div>
              <div className="text-xs text-muted-foreground leading-tight">Administrator</div>
            </div>
          </div>

          {/* Admin Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button data-tour="admin-profile-trigger" className="flex items-center gap-2.5 rounded-full p-1 pr-3 hover:bg-muted/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring" id="admin-profile-trigger">
                <Avatar className="h-8 w-8 border-2 border-brand/25">
                  <AvatarImage src={profile?.profile_picture_url || undefined} alt={profile?.full_name || "Admin"} />
                  <AvatarFallback className="bg-brand/15 text-brand text-xs font-bold">{adminInitials}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold leading-tight truncate max-w-[120px]">{profile?.full_name || "Administrator"}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Super Admin</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72" align="end" sideOffset={8}>
              {/* Admin Profile Header */}
              <div className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 border-2 border-brand/25">
                    <AvatarImage src={profile?.profile_picture_url || undefined} alt={profile?.full_name || "Admin"} />
                    <AvatarFallback className="bg-brand/15 text-brand text-sm font-bold">{adminInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{profile?.full_name || "Administrator"}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email || user?.email}</p>
                    <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0 h-4 bg-brand/10 text-brand border-none font-semibold">
                      <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> Super Administrator
                    </Badge>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/admin-profile" search={{ edit: false }}>
                    <User className="h-4 w-4 mr-2" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/admin-profile" search={{ edit: true }}>
                    <Settings className="h-4 w-4 mr-2" /> Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-brand hover:text-brand font-semibold" onClick={() => startTour("admin")}>
                  <Compass className="h-4 w-4 mr-2" /> Product Tour
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => signOut().then(() => navigate({ to: "/", replace: true }))}
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><AdminDashboard /></main>
    </div>
  );
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"students" | "assignments" | "submissions" | "analytics">("students");

  const tabClass = (tab: typeof activeTab) =>
    `inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
      activeTab === tab
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground font-medium">Control access, upload assignments, track submissions, and check analytics.</p>
        </div>
        <div className="w-full overflow-x-auto scrollbar-none sm:w-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex h-10 items-center rounded-lg bg-muted p-1 text-muted-foreground min-w-max">
            <button data-tour-tab="students" className={tabClass("students")} onClick={() => setActiveTab("students")}>
              <Users className="mr-2 h-4 w-4" /> Students
            </button>
            <button data-tour-tab="assignments" className={tabClass("assignments")} onClick={() => setActiveTab("assignments")}>
              <FileText className="mr-2 h-4 w-4" /> Assignments
            </button>
            <button data-tour-tab="submissions" className={tabClass("submissions")} onClick={() => setActiveTab("submissions")}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Submissions
            </button>
            <button data-tour-tab="analytics" className={tabClass("analytics")} onClick={() => setActiveTab("analytics")}>
              <BarChart3 className="mr-2 h-4 w-4" /> Analytics
            </button>
          </div>
        </div>
      </div>

      {activeTab === "students" && <StudentsTab />}
      {activeTab === "assignments" && <AssignmentsTab />}
      {activeTab === "submissions" && <SubmissionsTab />}
      {activeTab === "analytics" && <AnalyticsTab />}
    </div>
  );
}

// ==========================================
// 1. STUDENTS TAB
// ==========================================
type Filter = "all" | "pending" | "approved" | "rejected";

function StudentsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("pending");
  const [search, setSearch] = useState("");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const stats = useMemo(() => {
    const list = profiles ?? [];
    return {
      total: list.length,
      pending: list.filter((p) => p.status === "pending").length,
      approved: list.filter((p) => p.status === "approved").length,
      rejected: list.filter((p) => p.status === "rejected").length,
    };
  }, [profiles]);

  const filtered = useMemo(() => {
    let list = profiles ?? [];
    if (filter !== "all") list = list.filter((p) => p.status === filter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => (p.full_name ?? "").toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
    return list;
  }, [profiles, filter, search]);

  const setStatus = useMutation({
    mutationFn: async (args: { id: string; status: "approved" | "rejected"; reason?: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status: args.status, rejection_reason: args.reason ?? null })
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.status === "approved" ? "Student approved" : "Student rejected");
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div data-tour="admin-overview" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Users} label="Total students" value={stats.total} tone="brand" />
        <StatTile icon={Clock4} label="Pending Requests" value={stats.pending} tone="warning" />
        <StatTile icon={CheckCircle2} label="Approved" value={stats.approved} tone="success" />
        <StatTile icon={XCircle} label="Rejected" value={stats.rejected} tone="destructive" />
      </div>

      <div data-tour="admin-students" className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
            {["pending", "approved", "rejected", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as Filter)}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  filter === f ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No students match this filter.</TableCell></TableRow>
              ) : filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold">{p.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.email}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell><StatusPill status={p.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {p.status !== "approved" && (
                        <Button size="sm" onClick={() => setStatus.mutate({ id: p.id, status: "approved", reason: null })} disabled={setStatus.isPending}>
                          Approve
                        </Button>
                      )}
                      {p.status !== "rejected" && (
                        <Button size="sm" variant="outline" onClick={() => {
                          const reason = window.prompt("Optional reason for rejection?") ?? "";
                          setStatus.mutate({ id: p.id, status: "rejected", reason: reason.trim() || null });
                        }} disabled={setStatus.isPending}>
                          Reject
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. ASSIGNMENTS TAB
// ==========================================
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

function AssignmentsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<"pdf" | "link" | "rich-text">("rich-text");
  const [content, setContent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: async (): Promise<Assignment[]> => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Assignment[];
    },
  });

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("assignments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("assignments")
        .getPublicUrl(filePath);

      setContent(publicUrl);
      toast.success("PDF uploaded successfully!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const createOrUpdateAssignment = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description: description || null,
        format,
        content,
        deadline: new Date(deadline).toISOString(),
      };

      if (editingAssignment) {
        const { error } = await supabase
          .from("assignments")
          .update(payload)
          .eq("id", editingAssignment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("assignments")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingAssignment ? "Assignment updated" : "Assignment uploaded successfully!");
      qc.invalidateQueries({ queryKey: ["assignments"] });
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assignment deleted");
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFormat("rich-text");
    setContent("");
    setDeadline("");
    setEditingAssignment(null);
  };

  const handleEdit = (a: Assignment) => {
    setEditingAssignment(a);
    setTitle(a.title);
    setDescription(a.description || "");
    setFormat(a.format);
    setContent(a.content);
    // Format to YYYY-MM-DDThh:mm
    const date = new Date(a.deadline);
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    setDeadline(localISOTime);
    setOpen(true);
  };

  return (
    <div data-tour="admin-assignments" className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Assignment management</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Create Assignment</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAssignment ? "Edit Assignment" : "Create Assignment"}</DialogTitle>
              <DialogDescription>
                Publish a new assignment for students with a strict submission deadline.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm Programming Assignment" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Description (Optional)</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write guidelines for the assignment..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Format</label>
                  <Select value={format} onValueChange={(val: any) => { setFormat(val); setContent(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rich-text">Rich-text / Markdown</SelectItem>
                      <SelectItem value="link">External URL Link</SelectItem>
                      <SelectItem value="pdf">PDF Upload File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Deadline</label>
                  <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
              </div>

              {format === "rich-text" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Assignment Material (Rich-text)</label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter instructions, questions or markdown description..." rows={5} />
                </div>
              )}

              {format === "link" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Assignment Link URL</label>
                  <Input type="url" value={content} onChange={(e) => setContent(e.target.value)} placeholder="https://example.com/assignment-details" />
                </div>
              )}

              {format === "pdf" && (
                <div className="space-y-1.5 border border-dashed border-border rounded-lg p-4 bg-muted/40">
                  <label className="text-sm font-semibold block mb-2">Upload PDF File</label>
                  <Input type="file" accept="application/pdf" onChange={uploadFile} disabled={uploading} className="bg-background cursor-pointer" />
                  {uploading && <div className="text-xs text-muted-foreground mt-1"><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />Uploading PDF file...</div>}
                  {content && !uploading && (
                    <div className="text-xs text-brand font-medium mt-2 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-success" /> File uploaded: <a href={content} target="_blank" rel="noreferrer" className="underline truncate max-w-xs">{content}</a>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => createOrUpdateAssignment.mutate()} disabled={!title || !deadline || !content || createOrUpdateAssignment.isPending}>
                {createOrUpdateAssignment.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {editingAssignment ? "Update" : "Publish"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment Title</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</TableCell></TableRow>
              ) : assignments?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No assignments created yet.</TableCell></TableRow>
              ) : assignments?.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-semibold">{a.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {a.format === "rich-text" ? <FileText className="mr-1 h-3 w-3 inline" /> : a.format === "link" ? <LinkIcon className="mr-1 h-3 w-3 inline" /> : <Calendar className="mr-1 h-3 w-3 inline" />}
                      {a.format === "rich-text" ? "text" : a.format}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    <span className={new Date(a.deadline) < new Date() ? "text-destructive" : "text-foreground"}>
                      {new Date(a.deadline).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(a)}>
                        <Edit3 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => { if(window.confirm("Delete this assignment?")) deleteAssignment.mutate(a.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. SUBMISSIONS TAB
// ==========================================
interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  format: "file" | "text";
  content: string;
  submitted_at: string;
  status: "submitted" | "under_review" | "approved" | "rejected" | "resubmitted";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  approval_points: number | null;
  approval_coins: number | null;
  resubmission_count: number;
  assignment: Assignment;
  student: Profile;
}

function SubmissionsTab() {
  const qc = useQueryClient();
  const { user } = useAuth();
  
  // Modal & Selection States
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  
  const [subToApprove, setSubToApprove] = useState<Submission | null>(null);
  const [subToReject, setSubToReject] = useState<Submission | null>(null);
  
  const [approvalPoints, setApprovalPoints] = useState("");
  const [approvalCoins, setApprovalCoins] = useState("");
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionComments, setRejectionComments] = useState("");

  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ["submissions-admin"],
    queryFn: async (): Promise<Submission[]> => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, assignment:assignments(*), student:profiles!submissions_student_id_fkey(*)")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // Real-time postgres subscriptions for submissions
  useEffect(() => {
    const channel = supabase
      .channel("admin-submissions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        () => {
          qc.invalidateQueries({ queryKey: ["submissions-admin"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  // Calculate stats metrics for cards
  const metrics = useMemo(() => {
    const list = submissions ?? [];
    return {
      total: list.length,
      submitted: list.filter(s => s.status === 'submitted').length,
      underReview: list.filter(s => s.status === 'under_review').length,
      approved: list.filter(s => s.status === 'approved').length,
      rejected: list.filter(s => s.status === 'rejected').length,
      resubmitted: list.filter(s => s.status === 'resubmitted').length,
    };
  }, [submissions]);

  // Mutations
  const startReviewMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase
        .from("submissions")
        .update({
          status: "under_review",
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submissionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["submissions-admin"] });
    },
    onError: (e: any) => {
      toast.error(`Failed to start review: ${e.message}`);
    }
  });

  const approveSubmissionMutation = useMutation({
    mutationFn: async (args: { id: string; points: number; coins: number; comments: string }) => {
      const { error } = await supabase
        .from("submissions")
        .update({
          status: "approved",
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          review_comments: args.comments.trim() || null,
          approval_points: args.points,
          approval_coins: args.coins,
        })
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Submission approved successfully!");
      qc.invalidateQueries({ queryKey: ["submissions-admin"] });
      setApproveOpen(false);
      setApprovalPoints("");
      setApprovalCoins("");
      setApprovalComments("");
    },
    onError: (e: any) => {
      toast.error(`Approval failed: ${e.message}`);
    }
  });

  const rejectSubmissionMutation = useMutation({
    mutationFn: async (args: { id: string; comments: string }) => {
      const { error } = await supabase
        .from("submissions")
        .update({
          status: "rejected",
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          review_comments: args.comments.trim(),
          approval_points: null,
          approval_coins: null,
        })
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Submission rejected successfully.");
      qc.invalidateQueries({ queryKey: ["submissions-admin"] });
      setRejectOpen(false);
      setRejectionComments("");
    },
    onError: (e: any) => {
      toast.error(`Rejection failed: ${e.message}`);
    }
  });

  // Calculate default coins/points rewards
  const calculateDefaultRewards = (sub: Submission) => {
    if (!sub || !sub.assignment) return { coins: 0, points: 50 };
    const deadline = new Date(sub.assignment.deadline);
    const assignedDate = new Date(sub.assignment.assigned_date || sub.assignment.created_at);
    const submittedAt = new Date(sub.submitted_at);
    
    // Total days allowed (clamped to at least 1)
    const daysTotal = Math.max(1, Math.ceil((deadline.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Max coins
    const maxCoins = sub.assignment.max_coins ?? 100;
    
    // Daily reduction rate
    const dailyReduction = sub.assignment.daily_reduction ?? Math.max(1, Math.round(maxCoins / daysTotal));
    
    // Days elapsed since assigned
    const daysElapsed = Math.max(0, Math.floor((submittedAt.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Coins earned
    const coinsEarned = Math.max(0, maxCoins - (daysElapsed * dailyReduction));
    
    // Points earned (base 50 + coin bonus)
    const pointsEarned = 50 + coinsEarned;
    
    return { coins: coinsEarned, points: pointsEarned };
  };

  const handleViewSubmission = (sub: Submission) => {
    setSelectedSub(sub);
    setViewOpen(true);
    if (sub.status === "submitted" || sub.status === "resubmitted") {
      startReviewMutation.mutate(sub.id);
    }
  };

  const handleOpenApprove = (sub: Submission) => {
    setSubToApprove(sub);
    const defaults = calculateDefaultRewards(sub);
    setApprovalPoints(String(defaults.points));
    setApprovalCoins(String(defaults.coins));
    setApprovalComments("");
    setApproveOpen(true);
  };

  const handleOpenReject = (sub: Submission) => {
    setSubToReject(sub);
    setRejectionComments("");
    setRejectOpen(true);
  };

  const handleApproveSubmit = () => {
    if (!subToApprove) return;
    const defaults = calculateDefaultRewards(subToApprove);
    const points = approvalPoints.trim() === "" ? defaults.points : Number(approvalPoints);
    const coins = approvalCoins.trim() === "" ? defaults.coins : Number(approvalCoins);
    
    approveSubmissionMutation.mutate({
      id: subToApprove.id,
      points,
      coins,
      comments: approvalComments,
    });
  };

  const handleRejectSubmit = () => {
    if (!subToReject || !rejectionComments.trim()) return;
    rejectSubmissionMutation.mutate({
      id: subToReject.id,
      comments: rejectionComments,
    });
  };

  const getFileName = (url: string) => {
    if (!url) return "Attachment File";
    try {
      const decoded = decodeURIComponent(url);
      const lastPart = decoded.split("/").pop() || "";
      const match = lastPart.match(/^[a-fA-F0-9-]+_[a-fA-F0-9-]+_(\d+)\.(\w+)$/i);
      if (match) {
        const ext = match[2].toUpperCase();
        return `Submitted Document (${ext})`;
      }
      const cleanName = lastPart.replace(/^[a-fA-F0-9-]+_[a-fA-F0-9-]+_\d+_/, "");
      if (cleanName && cleanName.length > 4 && cleanName.includes(".")) {
        return cleanName;
      }
      return lastPart || "Attachment File";
    } catch (e) {
      return "Attachment File";
    }
  };

  const getStatusBadge = (status: Submission["status"]) => {
    const activeStatus = status || "submitted";
    switch (activeStatus) {
      case "submitted":
        return <Badge variant="secondary" className="bg-[#4F7DF3]/15 text-[#4F7DF3] hover:bg-[#4F7DF3]/15 border-none font-semibold"><Upload className="h-3 w-3 mr-1" /> Submitted</Badge>;
      case "under_review":
        return <Badge variant="secondary" className="bg-orange-500/15 text-orange-600 hover:bg-orange-500/15 border-none font-semibold"><Eye className="h-3 w-3 mr-1" /> Under Review</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-success/15 text-success hover:bg-success/15 border-none font-semibold"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-destructive/15 text-destructive hover:bg-destructive/15 border-none font-semibold"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      case "resubmitted":
        return <Badge variant="secondary" className="bg-indigo-500/15 text-indigo-600 hover:bg-indigo-500/15 border-none font-semibold"><RefreshCw className="h-3 w-3 mr-1" /> Resubmitted</Badge>;
      default:
        return null;
    }
  };

  return (
    <div data-tour="admin-submissions" className="space-y-6">
      {/* 5 Status Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={Upload} label="Submitted" value={metrics.submitted} tone="brand" />
        <StatTile icon={Eye} label="Under Review" value={metrics.underReview} tone="warning" />
        <StatTile icon={CheckCircle2} label="Approved" value={metrics.approved} tone="success" />
        <StatTile icon={XCircle} label="Rejected" value={metrics.rejected} tone="destructive" />
        <StatTile icon={RefreshCw} label="Resubmitted" value={metrics.resubmitted} tone="indigo" />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Real-time Submission Tracker</h2>
        <Badge variant="outline" className="text-success border-success/40 bg-success/5"><Clock className="mr-1 h-3 w-3" /> Real-time active</Badge>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</TableCell></TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-destructive font-medium">
                    <AlertCircle className="mr-2 inline h-4 w-4 text-destructive" />
                    Failed to load submissions: {(error as any).message || String(error)}
                  </TableCell>
                </TableRow>
              ) : submissions?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">No submissions recorded yet.</TableCell></TableRow>
              ) : submissions?.map((s) => {
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{s.student?.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.student?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{s.assignment?.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(s.submitted_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Button data-tour="admin-actions" size="sm" variant="outline" onClick={() => handleViewSubmission(s)}>
                          <Eye className="h-4 w-4 mr-1.5" /> View
                        </Button>
                        {(() => {
                          const status = s.status || 'submitted';
                          if (status === 'approved') {
                            return (
                              <Badge variant="secondary" className="bg-success/15 text-success hover:bg-success/15 border-none font-semibold">
                                <CheckCircle className="h-3 w-3 mr-1" /> Approved · +{s.approval_points ?? 0} pts
                              </Badge>
                            );
                          }
                          if (status === 'rejected') {
                            return (
                              <Badge variant="secondary" className="bg-destructive/15 text-destructive hover:bg-destructive/15 border-none font-semibold">
                                <XCircle className="h-3 w-3 mr-1" /> Rejected
                              </Badge>
                            );
                          }
                          return getStatusBadge(status);
                        })()}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 1. VIEW SUBMISSION MODAL */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Submission Detail</DialogTitle>
            <DialogDescription>
              Review the student's answer text or file submission content.
            </DialogDescription>
          </DialogHeader>
          {selectedSub && (() => {
            const isLate = new Date(selectedSub.submitted_at) > new Date(selectedSub.assignment?.deadline);
            return (
              <div className="space-y-4 py-2.5">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="block font-bold text-muted-foreground/80 mb-0.5 uppercase tracking-wide">Student</span>
                    <span className="font-semibold text-foreground text-[13px]">{selectedSub.student?.full_name || "—"}</span>
                    <span className="block text-muted-foreground mt-0.5">{selectedSub.student?.email}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-muted-foreground/80 mb-0.5 uppercase tracking-wide">Assignment</span>
                    <span className="font-semibold text-foreground text-[13px]">{selectedSub.assignment?.title}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-muted-foreground/80 mb-0.5 uppercase tracking-wide">Submitted At</span>
                    <span className="font-semibold text-foreground">{new Date(selectedSub.submitted_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-muted-foreground/80 mb-0.5 uppercase tracking-wide">Status</span>
                    <div className="mt-1">{getStatusBadge(selectedSub.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs pt-3 border-t border-border">
                  <div>
                    <span className="block font-bold text-muted-foreground/80 mb-0.5 uppercase tracking-wide">Resubmission Count</span>
                    <span className="font-semibold text-foreground text-[13px]">{selectedSub.resubmission_count ?? 0} / 2</span>
                    {(selectedSub.resubmission_count ?? 0) >= 2 && (
                      <span className="block text-[10px] text-destructive font-medium mt-0.5">Limit reached</span>
                    )}
                  </div>
                  <div>
                    <span className="block font-bold text-muted-foreground/80 mb-0.5 uppercase tracking-wide">Submission Format</span>
                    <span className="font-semibold text-foreground text-[13px] capitalize">{selectedSub.format}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-muted-foreground/80 mb-0.5 uppercase tracking-wide">Delay Status</span>
                    <div className="mt-1">
                      {isLate ? (
                        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 font-semibold">Late Submission</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/10 border-success/20 font-semibold">On Time</Badge>
                      )}
                    </div>
                  </div>
                </div>

              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wide">Submitted Document</span>
                {selectedSub.format === "file" ? (
                  <div className="border border-border/80 rounded-xl p-4 bg-muted/20 w-full overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand/10 shrink-0">
                        <FileText className="h-5 w-5 text-brand" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{getFileName(selectedSub.content)}</p>
                        <p className="text-[10px] text-muted-foreground">Uploaded document</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild className="flex-1 font-semibold">
                        <a href={`https://docs.google.com/gview?url=${encodeURIComponent(selectedSub.content)}&embedded=false`} target="_blank" rel="noreferrer"><Eye className="mr-1.5 h-3.5 w-3.5" /> Preview</a>
                      </Button>
                      <Button size="sm" variant="outline" asChild className="flex-1 font-semibold">
                        <a href={selectedSub.content} download rel="noreferrer"><LinkIcon className="mr-1.5 h-3.5 w-3.5" /> Download</a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-border/80 rounded-xl p-4 bg-muted/20 max-h-60 overflow-y-auto whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
                    {selectedSub.content}
                  </div>
                )}
              </div>

              {/* Review History / Feedback */}
              {(selectedSub.status === "approved" || selectedSub.status === "rejected" || selectedSub.review_comments) && (
                <div className="space-y-2 pt-3 border-t border-border">
                  <span className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wide">Review & Feedback</span>
                  <div className="p-3 bg-muted/40 border border-border/60 rounded-xl text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-y-1">
                      <div className="text-muted-foreground">Reviewed At:</div>
                      <div className="font-semibold text-foreground">{selectedSub.reviewed_at ? new Date(selectedSub.reviewed_at).toLocaleString() : "—"}</div>
                      
                      {selectedSub.status === "approved" && (
                        <>
                          <div className="text-muted-foreground">Points Awarded:</div>
                          <div className="font-semibold text-success">+{selectedSub.approval_points} Points</div>
                          <div className="text-muted-foreground">Coins Awarded:</div>
                          <div className="font-semibold text-success">+{selectedSub.approval_coins} Coins</div>
                        </>
                      )}
                    </div>
                    {selectedSub.review_comments && (
                      <div className="pt-2 border-t border-border/60">
                        <span className="block text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Review Comments:</span>
                        <p className="font-medium text-foreground italic whitespace-pre-wrap leading-relaxed">{selectedSub.review_comments}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )})()}
          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
            {selectedSub && (selectedSub.status === 'submitted' || selectedSub.status === 'under_review' || selectedSub.status === 'resubmitted') && (
              <>
                <Button
                  className="bg-success text-success-foreground hover:bg-success/90 font-semibold"
                  onClick={() => { setViewOpen(false); handleOpenApprove(selectedSub); }}
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" /> Approve
                </Button>
                <Button
                  variant="destructive"
                  className="font-semibold"
                  onClick={() => { setViewOpen(false); handleOpenReject(selectedSub); }}
                >
                  <XCircle className="h-4 w-4 mr-1.5" /> Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. APPROVE SUBMISSION MODAL */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve Submission</DialogTitle>
            <DialogDescription>
              Award coins, points, and add review comments for this submission.
            </DialogDescription>
          </DialogHeader>
          {subToApprove && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/20 border border-border/40 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-foreground text-[13px]">{subToApprove.student?.full_name}</div>
                <div className="text-muted-foreground">Assignment: {subToApprove.assignment?.title}</div>
                <div className="text-muted-foreground">Submitted: {new Date(subToApprove.submitted_at).toLocaleString()}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Points Awarded</label>
                  <Input
                    type="number"
                    value={approvalPoints}
                    onChange={(e) => setApprovalPoints(e.target.value)}
                    placeholder={`Auto: ${calculateDefaultRewards(subToApprove).points}`}
                  />
                  <p className="text-[10px] text-muted-foreground">Empty defaults to auto-calculated.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Coins Awarded</label>
                  <Input
                    type="number"
                    value={approvalCoins}
                    onChange={(e) => setApprovalCoins(e.target.value)}
                    placeholder={`Auto: ${calculateDefaultRewards(subToApprove).coins}`}
                  />
                  <p className="text-[10px] text-muted-foreground">Empty defaults to auto-calculated.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Review Comments (Optional)</label>
                <Textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder="e.g. Excellent solution structure and clear documentation!"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>Cancel</Button>
            <Button
              onClick={handleApproveSubmit}
              disabled={approveSubmissionMutation.isPending}
              className="bg-success text-success-foreground hover:bg-success/90 font-semibold"
            >
              {approveSubmissionMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Approve Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. REJECT SUBMISSION MODAL */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Return the submission to the student for improvement. Comments are mandatory.
            </DialogDescription>
          </DialogHeader>
          {subToReject && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/20 border border-border/40 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-foreground text-[13px]">{subToReject.student?.full_name}</div>
                <div className="text-muted-foreground">Assignment: {subToReject.assignment?.title}</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Review Comments <span className="text-destructive">*</span></label>
                <Textarea
                  value={rejectionComments}
                  onChange={(e) => setRejectionComments(e.target.value)}
                  placeholder="e.g. Database explanation incomplete. Please add normalization examples and resubmit."
                  rows={4}
                  required
                  minLength={20}
                />
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">Describe what the student needs to correct. Minimum 20 characters.</p>
                  <span className={`text-[10px] font-medium ${rejectionComments.trim().length < 20 ? 'text-destructive' : 'text-success'}`}>{rejectionComments.trim().length}/20</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              onClick={handleRejectSubmit}
              disabled={rejectionComments.trim().length < 20 || rejectSubmissionMutation.isPending}
              variant="destructive"
              className="font-semibold"
            >
              {rejectSubmissionMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Reject Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// 4. ANALYTICS TAB
// ==========================================
function AnalyticsTab() {
  const { data: students } = useQuery<Profile[]>({
    queryKey: ["profiles-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("status", "approved");
      if (error) throw error;
      return data as Profile[];
    }
  });

  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: ["assignments-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assignments").select("*");
      if (error) throw error;
      return data as Assignment[];
    }
  });

  const { data: submissions } = useQuery<Submission[]>({
    queryKey: ["submissions-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, assignment:assignments(*), student:profiles!submissions_student_id_fkey(*)");
      if (error) throw error;
      return data as any[];
    }
  });

  const metrics = useMemo(() => {
    const totalStudents = students?.length || 0;
    const totalAssignments = assignments?.length || 0;
    const totalSubmissions = submissions?.length || 0;
    
    // Max possible submissions
    const totalExpected = totalStudents * totalAssignments;
    const completionRate = totalExpected > 0 ? Math.round((totalSubmissions / totalExpected) * 100) : 0;
    
    // Late count
    let lateCount = 0;
    submissions?.forEach(s => {
      if (s.assignment && new Date(s.submitted_at) > new Date(s.assignment.deadline)) {
        lateCount++;
      }
    });

    const onTimeCount = totalSubmissions - lateCount;

    // Student specific stats
    const studentList = students?.map(st => {
      const studentSubs = submissions?.filter(sb => sb.student_id === st.id) || [];
      const studentLates = studentSubs.filter(sb => sb.assignment && new Date(sb.submitted_at) > new Date(sb.assignment.deadline)).length;
      return {
        name: st.full_name || "Student",
        email: st.email,
        total: studentSubs.length,
        late: studentLates,
      };
    }) || [];

    return {
      completionRate,
      lateCount,
      onTimeCount,
      totalStudents,
      totalAssignments,
      totalSubmissions,
      studentList,
    };
  }, [students, assignments, submissions]);

  const statusCounts = useMemo(() => {
    const list = submissions ?? [];
    return {
      submitted: list.filter(s => s.status === 'submitted').length,
      underReview: list.filter(s => s.status === 'under_review').length,
      approved: list.filter(s => s.status === 'approved').length,
      rejected: list.filter(s => s.status === 'rejected').length,
      resubmitted: list.filter(s => s.status === 'resubmitted').length,
    };
  }, [submissions]);

  return (
    <div data-tour="admin-analytics" className="space-y-6">
      {/* 5 Status Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={Upload} label="Submitted" value={statusCounts.submitted} tone="brand" />
        <StatTile icon={Eye} label="Under Review" value={statusCounts.underReview} tone="warning" />
        <StatTile icon={CheckCircle2} label="Approved" value={statusCounts.approved} tone="success" />
        <StatTile icon={XCircle} label="Rejected" value={statusCounts.rejected} tone="destructive" />
        <StatTile icon={RefreshCw} label="Resubmitted" value={statusCounts.resubmitted} tone="indigo" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">Completion Rate</span>
            <TrendingUp className="h-4 w-4 text-brand" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{metrics.completionRate}%</span>
            <span className="text-xs text-muted-foreground">overall assignments</span>
          </div>
          <Progress value={metrics.completionRate} className="mt-3 h-2" />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">On-Time Submissions</span>
            <CheckCircle className="h-4 w-4 text-success" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold">{metrics.onTimeCount}</span>
            <span className="text-sm text-muted-foreground ml-2">out of {metrics.totalSubmissions}</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground font-medium">
            Assignments submitted before the deadline
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">Late Submissions</span>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-destructive">{metrics.lateCount}</span>
            <span className="text-sm text-muted-foreground ml-2">flagged late</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground font-medium">
            Submissions received after set deadline
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-semibold text-lg">Individual Student Activity</h3>
          <p className="text-xs text-muted-foreground">List of approved students, assignment submission status, and deadline compliance.</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Late Submissions</TableHead>
                <TableHead className="text-right">Compliance Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.studentList.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No approved students yet.</TableCell></TableRow>
              ) : metrics.studentList.map((st, i) => {
                const totalAssign = metrics.totalAssignments;
                const progressVal = totalAssign > 0 ? Math.round((st.total / totalAssign) * 100) : 0;
                const complianceVal = st.total > 0 ? Math.round(((st.total - st.late) / st.total) * 100) : 100;
                return (
                  <TableRow key={i}>
                    <TableCell className="font-semibold">{st.name}</TableCell>
                    <TableCell className="text-muted-foreground">{st.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{st.total}/{totalAssign}</span>
                        <div className="w-16"><Progress value={progressVal} className="h-1.5" /></div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-destructive">{st.late}</TableCell>
                    <TableCell className="text-right font-bold text-brand">{complianceVal}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: "brand" | "warning" | "success" | "destructive" | "indigo" }) {
  const toneClass = {
    brand: "text-brand bg-brand/10",
    warning: "text-[oklch(0.55_0.13_75)] bg-warning/20",
    success: "text-[oklch(0.5_0.13_152)] bg-success/15",
    destructive: "text-destructive bg-destructive/10",
    indigo: "text-indigo-600 bg-indigo-500/10",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${toneClass}`}><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: Profile["status"] }) {
  const map = {
    pending: { label: "Pending", cls: "bg-warning/20 text-[oklch(0.45_0.13_75)]" },
    approved: { label: "Approved", cls: "bg-success/15 text-[oklch(0.45_0.13_152)]" },
    rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive" },
  } as const;
  const m = map[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>{m.label}</span>;
}