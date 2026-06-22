import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  LogOut, Users, ShieldCheck, Clock4, XCircle, CheckCircle2, Search, Loader2,
  Plus, FileText, Link as LinkIcon, Trash2, Edit3, Calendar, FileSpreadsheet,
  AlertCircle, BarChart3, TrendingUp, CheckCircle, Clock
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — AssignHub" }] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const { user, loading, role, signOut } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth", search: { tab: "signin" }, replace: true }); return; }
    if (role !== "admin") navigate({ to: "/dashboard", replace: true });
  }, [loading, user, role, navigate]);

  if (loading || role !== "admin") {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground text-sm font-bold">A</div>
            <div>
              <div className="text-sm font-semibold leading-tight">AssignHub</div>
              <div className="text-xs text-muted-foreground leading-tight">Administrator</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate({ to: "/", replace: true }))}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
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
        <div className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
          <button className={tabClass("students")} onClick={() => setActiveTab("students")}>
            <Users className="mr-2 h-4 w-4" /> Students
          </button>
          <button className={tabClass("assignments")} onClick={() => setActiveTab("assignments")}>
            <FileText className="mr-2 h-4 w-4" /> Assignments
          </button>
          <button className={tabClass("submissions")} onClick={() => setActiveTab("submissions")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Submissions
          </button>
          <button className={tabClass("analytics")} onClick={() => setActiveTab("analytics")}>
            <BarChart3 className="mr-2 h-4 w-4" /> Analytics
          </button>
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Users} label="Total students" value={stats.total} tone="brand" />
        <StatTile icon={Clock4} label="Pending Requests" value={stats.pending} tone="warning" />
        <StatTile icon={CheckCircle2} label="Approved" value={stats.approved} tone="success" />
        <StatTile icon={XCircle} label="Rejected" value={stats.rejected} tone="destructive" />
      </div>

      <div className="rounded-xl border border-border bg-card">
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Assignment management</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Create Assignment</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
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
  assignment: Assignment;
  student: Profile;
}

function SubmissionsTab() {
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["submissions-admin"],
    queryFn: async (): Promise<Submission[]> => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, assignment:assignments(*), student:profiles(*)")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  return (
    <div className="space-y-4">
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
                <TableHead>Delay status</TableHead>
                <TableHead className="text-right">Submission Content</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</TableCell></TableRow>
              ) : submissions?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No submissions recorded yet.</TableCell></TableRow>
              ) : submissions?.map((s) => {
                const isLate = new Date(s.submitted_at) > new Date(s.assignment.deadline);
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
                      {isLate ? (
                        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Late Submission</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/10 border-success/20">On Time</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.format === "file" ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={s.content} target="_blank" rel="noreferrer"><LinkIcon className="mr-1.5 h-3.5 w-3.5" /> Download File</a>
                        </Button>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedSub(s)}>Read Answer</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Submission Answer</DialogTitle>
                              <DialogDescription>
                                Submitted by {selectedSub?.student?.full_name} for "{selectedSub?.assignment?.title}"
                              </DialogDescription>
                            </DialogHeader>
                            <div className="border rounded-lg p-4 bg-muted/40 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-foreground font-mono">
                              {selectedSub?.content}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
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
        .select("*, assignment:assignments(*), student:profiles(*)");
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

  return (
    <div className="space-y-6">
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

// Stats helper component
function StatTile({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: number; tone: "brand" | "warning" | "success" | "destructive" }) {
  const toneClass = {
    brand: "text-brand bg-brand/10",
    warning: "text-[oklch(0.55_0.13_75)] bg-warning/20",
    success: "text-[oklch(0.5_0.13_152)] bg-success/15",
    destructive: "text-destructive bg-destructive/10",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${toneClass}`}><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
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