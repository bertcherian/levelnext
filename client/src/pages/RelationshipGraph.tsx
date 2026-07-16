import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users, Plus, Star, Zap, Search, Linkedin, Mail, Phone,
  Pencil, Trash2, RefreshCw, Target, TrendingUp, Heart, Clock,
  ChevronRight, Building2, MapPin, Award, AlertCircle
} from "lucide-react";

const RELATIONSHIP_TYPES = [
  "Former Colleague", "Former Manager", "Former Direct Report",
  "Industry Peer", "Mentor", "Mentee", "Alumni",
  "Conference Connection", "Client", "Vendor", "Board Member",
  "Investor", "Community Member", "Friend", "Family",
];

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  reconnect: { label: "Reconnect", color: "bg-amber-100 text-amber-800" },
  strengthen: { label: "Strengthen", color: "bg-blue-100 text-blue-800" },
  ask_advice: { label: "Ask Advice", color: "bg-purple-100 text-purple-800" },
  offer_value: { label: "Offer Value", color: "bg-green-100 text-green-800" },
  request_intro: { label: "Request Intro", color: "bg-rose-100 text-rose-800" },
  maintain: { label: "Maintain", color: "bg-gray-100 text-gray-700" },
  celebrate: { label: "Celebrate", color: "bg-yellow-100 text-yellow-800" },
  share_article: { label: "Share Article", color: "bg-indigo-100 text-indigo-800" },
  coffee: { label: "Coffee Chat", color: "bg-orange-100 text-orange-800" },
};

const SCORE_DIMENSIONS = [
  { key: "scoreTrust", label: "Trust", icon: Heart },
  { key: "scoreInfluence", label: "Influence", icon: TrendingUp },
  { key: "scoreAccessibility", label: "Accessibility", icon: Zap },
  { key: "scoreRecency", label: "Recency", icon: Clock },
  { key: "scoreWarmth", label: "Warmth", icon: Star },
  { key: "scoreStrategicValue", label: "Strategic Value", icon: Target },
  { key: "scoreLikelihoodToHelp", label: "Likely to Help", icon: Award },
];

function ScoreBar({ value }: { value: number | null }) {
  const pct = ((value ?? 0) / 10) * 100;
  const color = (value ?? 0) >= 7 ? "bg-emerald-500" : (value ?? 0) >= 4 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-4">{value ?? "–"}</span>
    </div>
  );
}

type Contact = {
  id: number;
  name: string;
  currentTitle?: string | null;
  currentCompany?: string | null;
  industry?: string | null;
  geography?: string | null;
  linkedinUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  relationshipType: string;
  howWeKnowEachOther?: string | null;
  sharedHistory?: string | null;
  notes?: string | null;
  isKeyConnector?: boolean | null;
  compositeScore?: number | null;
  recommendedAction?: string | null;
  recommendedActionReason?: string | null;
  scoreTrust?: number | null;
  scoreInfluence?: number | null;
  scoreAccessibility?: number | null;
  scoreRecency?: number | null;
  scoreWarmth?: number | null;
  scoreStrategicValue?: number | null;
  scoreLikelihoodToHelp?: number | null;
};

type FormData = {
  name: string;
  currentTitle: string;
  currentCompany: string;
  industry: string;
  geography: string;
  linkedinUrl: string;
  email: string;
  phone: string;
  relationshipType: string;
  howWeKnowEachOther: string;
  sharedHistory: string;
  notes: string;
  isKeyConnector: boolean;
};

const emptyForm: FormData = {
  name: "", currentTitle: "", currentCompany: "", industry: "", geography: "",
  linkedinUrl: "", email: "", phone: "", relationshipType: "",
  howWeKnowEachOther: "", sharedHistory: "", notes: "", isKeyConnector: false,
};

export default function RelationshipGraph() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [scoringId, setScoringId] = useState<number | null>(null);

  const { data: contacts = [], refetch } = trpc.careerAccess.getRelationships.useQuery();
  const addMutation = trpc.careerAccess.addRelationship.useMutation({
    onSuccess: () => { toast.success("Contact added and scored by AI"); setShowForm(false); setForm(emptyForm); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.careerAccess.updateRelationship.useMutation({
    onSuccess: () => { toast.success("Contact updated"); setShowForm(false); setEditContact(null); setForm(emptyForm); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.careerAccess.deleteRelationship.useMutation({
    onSuccess: () => { toast.success("Contact removed"); setSelectedContact(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const scoreMutation = trpc.careerAccess.scoreRelationship.useMutation({
    onSuccess: () => { toast.success("Relationship re-scored"); setScoringId(null); refetch(); },
    onError: (e) => { toast.error(e.message); setScoringId(null); },
  });

  const filtered = (contacts as Contact[]).filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.currentCompany ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || c.relationshipType === filterType;
    return matchSearch && matchType;
  });

  const keyConnectors = filtered.filter(c => c.isKeyConnector);
  const highValue = filtered.filter(c => !c.isKeyConnector && (c.compositeScore ?? 0) >= 70);
  const others = filtered.filter(c => !c.isKeyConnector && (c.compositeScore ?? 0) < 70);

  function openAdd() {
    setEditContact(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(c: Contact) {
    setEditContact(c);
    setForm({
      name: c.name, currentTitle: c.currentTitle ?? "", currentCompany: c.currentCompany ?? "",
      industry: c.industry ?? "", geography: c.geography ?? "", linkedinUrl: c.linkedinUrl ?? "",
      email: c.email ?? "", phone: c.phone ?? "", relationshipType: c.relationshipType,
      howWeKnowEachOther: c.howWeKnowEachOther ?? "", sharedHistory: c.sharedHistory ?? "",
      notes: c.notes ?? "", isKeyConnector: c.isKeyConnector ?? false,
    });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.name || !form.relationshipType) {
      toast.error("Name and relationship type are required.");
      return;
    }
    if (editContact) {
      updateMutation.mutate({ id: editContact.id, ...form });
    } else {
      addMutation.mutate(form);
    }
  }

  function ContactCard({ c }: { c: Contact }) {
    const action = c.recommendedAction ? ACTION_LABELS[c.recommendedAction] : null;
    return (
      <div
        className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#C9A84C] hover:shadow-md transition-all"
        onClick={() => setSelectedContact(c)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0A1628] truncate">{c.name}</span>
              {c.isKeyConnector && <Star className="w-3.5 h-3.5 text-[#C9A84C] fill-[#C9A84C] shrink-0" />}
            </div>
            {c.currentTitle && <p className="text-xs text-gray-500 truncate">{c.currentTitle}</p>}
            {c.currentCompany && (
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600 truncate">{c.currentCompany}</span>
              </div>
            )}
          </div>
          {c.compositeScore != null && (
            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              c.compositeScore >= 70 ? "bg-emerald-100 text-emerald-700" :
              c.compositeScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
            }`}>
              {c.compositeScore}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline" className="text-xs py-0">{c.relationshipType}</Badge>
          {action && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${action.color}`}>
              {action.label}
            </span>
          )}
        </div>
      </div>
    );
  }

  function ContactGroup({ title, contacts: group, icon: Icon, color }: {
    title: string; contacts: Contact[]; icon: React.ElementType; color: string;
  }) {
    if (group.length === 0) return null;
    return (
      <div className="mb-6">
        <div className={`flex items-center gap-2 mb-3 px-1`}>
          <Icon className={`w-4 h-4 ${color}`} />
          <span className={`text-sm font-semibold ${color}`}>{title}</span>
          <span className="text-xs text-gray-400">({group.length})</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {group.map(c => <ContactCard key={c.id} c={c} />)}
        </div>
      </div>
    );
  }

  return (
    <PlatformLayout title="Relationship Graph">
      <div className="min-h-screen bg-[#F5F0E8] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628]">Relationship Graph</h1>
            <p className="text-sm text-gray-500 mt-1">
              Map and score your professional network to find the fastest path to your target roles.
            </p>
          </div>
          <Button onClick={openAdd} className="bg-[#C9A84C] hover:bg-[#b8963e] text-white gap-2">
            <Plus className="w-4 h-4" /> Add Contact
          </Button>
        </div>

        {/* Stats Bar */}
        {(contacts as Contact[]).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Contacts", value: (contacts as Contact[]).length, color: "text-[#0A1628]" },
              { label: "Key Connectors", value: (contacts as Contact[]).filter(c => c.isKeyConnector).length, color: "text-[#C9A84C]" },
              { label: "High Value (70+)", value: (contacts as Contact[]).filter(c => (c.compositeScore ?? 0) >= 70).length, color: "text-emerald-600" },
              { label: "Avg Score", value: (contacts as Contact[]).length > 0 ? Math.round((contacts as Contact[]).reduce((s, c) => s + (c.compositeScore ?? 0), 0) / (contacts as Contact[]).length) : 0, color: "text-blue-600" },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl p-3 border border-gray-200">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {RELATIONSHIP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Contact List */}
        {(contacts as Contact[]).length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#0A1628] mb-2">Your Relationship Graph is empty</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Add the people in your network who could help you access your target roles. The AI will score each relationship and recommend the best next action.
            </p>
            <Button onClick={openAdd} className="bg-[#C9A84C] hover:bg-[#b8963e] text-white gap-2">
              <Plus className="w-4 h-4" /> Add Your First Contact
            </Button>
          </div>
        ) : (
          <>
            <ContactGroup title="Key Connectors" contacts={keyConnectors} icon={Star} color="text-[#C9A84C]" />
            <ContactGroup title="High Value Relationships (Score 70+)" contacts={highValue} icon={TrendingUp} color="text-emerald-600" />
            <ContactGroup title="Other Contacts" contacts={others} icon={Users} color="text-gray-500" />
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">No contacts match your search.</div>
            )}
          </>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showForm} onOpenChange={v => { if (!v) { setShowForm(false); setEditContact(null); setForm(emptyForm); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editContact ? "Edit Contact" : "Add Contact to Relationship Graph"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name *</label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Priya Sharma" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Relationship Type *</label>
                  <Select value={form.relationshipType} onValueChange={v => setForm(f => ({ ...f, relationshipType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Current Title</label>
                  <Input value={form.currentTitle} onChange={e => setForm(f => ({ ...f, currentTitle: e.target.value }))} placeholder="e.g. VP Engineering" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Current Company</label>
                  <Input value={form.currentCompany} onChange={e => setForm(f => ({ ...f, currentCompany: e.target.value }))} placeholder="e.g. Infosys" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Industry</label>
                  <Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} placeholder="e.g. Technology" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Geography</label>
                  <Input value={form.geography} onChange={e => setForm(f => ({ ...f, geography: e.target.value }))} placeholder="e.g. Bangalore" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">LinkedIn URL</label>
                  <Input value={form.linkedinUrl} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} placeholder="linkedin.com/in/..." />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
                  <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@company.com" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">How do you know each other?</label>
                <Textarea value={form.howWeKnowEachOther} onChange={e => setForm(f => ({ ...f, howWeKnowEachOther: e.target.value }))} placeholder="e.g. Worked together at Wipro 2018-2020, she was my skip-level manager..." rows={2} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Shared history / context</label>
                <Textarea value={form.sharedHistory} onChange={e => setForm(f => ({ ...f, sharedHistory: e.target.value }))} placeholder="e.g. We collaborated on the APAC expansion project, she championed my promotion..." rows={2} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any other context..." rows={2} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="keyConnector" checked={form.isKeyConnector} onChange={e => setForm(f => ({ ...f, isKeyConnector: e.target.checked }))} className="w-4 h-4 accent-[#C9A84C]" />
                <label htmlFor="keyConnector" className="text-sm text-gray-700 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-[#C9A84C]" /> Mark as Key Connector
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSubmit} disabled={addMutation.isPending || updateMutation.isPending} className="flex-1 bg-[#C9A84C] hover:bg-[#b8963e] text-white">
                  {(addMutation.isPending || updateMutation.isPending) ? "Saving & Scoring..." : editContact ? "Update Contact" : "Add & Score Contact"}
                </Button>
                <Button variant="outline" onClick={() => { setShowForm(false); setEditContact(null); setForm(emptyForm); }}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Contact Detail Panel */}
        <Dialog open={!!selectedContact} onOpenChange={v => { if (!v) setSelectedContact(null); }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            {selectedContact && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <DialogTitle className="text-xl flex items-center gap-2">
                        {selectedContact.name}
                        {selectedContact.isKeyConnector && <Star className="w-4 h-4 text-[#C9A84C] fill-[#C9A84C]" />}
                      </DialogTitle>
                      {selectedContact.currentTitle && <p className="text-sm text-gray-500">{selectedContact.currentTitle}</p>}
                      {selectedContact.currentCompany && (
                        <div className="flex items-center gap-1 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">{selectedContact.currentCompany}</span>
                        </div>
                      )}
                    </div>
                    {selectedContact.compositeScore != null && (
                      <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-sm font-bold shrink-0 ${
                        selectedContact.compositeScore >= 70 ? "bg-emerald-100 text-emerald-700" :
                        selectedContact.compositeScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        <span className="text-xl">{selectedContact.compositeScore}</span>
                        <span className="text-xs font-normal">score</span>
                      </div>
                    )}
                  </div>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  {/* Contact Links */}
                  <div className="flex gap-2 flex-wrap">
                    {selectedContact.linkedinUrl && (
                      <a href={selectedContact.linkedinUrl.startsWith("http") ? selectedContact.linkedinUrl : `https://${selectedContact.linkedinUrl}`} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Linkedin className="w-3.5 h-3.5" /> LinkedIn</Button>
                      </a>
                    )}
                    {selectedContact.email && (
                      <a href={`mailto:${selectedContact.email}`}>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Mail className="w-3.5 h-3.5" /> Email</Button>
                      </a>
                    )}
                    {selectedContact.phone && (
                      <a href={`tel:${selectedContact.phone}`}>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Phone className="w-3.5 h-3.5" /> Call</Button>
                      </a>
                    )}
                  </div>

                  {/* Recommended Action */}
                  {selectedContact.recommendedAction && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-800">Recommended Next Action</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_LABELS[selectedContact.recommendedAction]?.color ?? ""}`}>
                          {ACTION_LABELS[selectedContact.recommendedAction]?.label ?? selectedContact.recommendedAction}
                        </span>
                      </div>
                      {selectedContact.recommendedActionReason && (
                        <p className="text-xs text-amber-700">{selectedContact.recommendedActionReason}</p>
                      )}
                    </div>
                  )}

                  {/* Relationship Scores */}
                  {selectedContact.scoreTrust != null && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Relationship Scores</p>
                      <div className="space-y-2">
                        {SCORE_DIMENSIONS.map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
                            <ScoreBar value={(selectedContact as unknown as Record<string, number | null>)[key]} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Context */}
                  {selectedContact.howWeKnowEachOther && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">How You Know Each Other</p>
                      <p className="text-sm text-gray-700">{selectedContact.howWeKnowEachOther}</p>
                    </div>
                  )}
                  {selectedContact.sharedHistory && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Shared History</p>
                      <p className="text-sm text-gray-700">{selectedContact.sharedHistory}</p>
                    </div>
                  )}
                  {selectedContact.notes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{selectedContact.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Button
                      variant="outline" size="sm" className="gap-1.5 text-xs"
                      onClick={() => { setSelectedContact(null); openEdit(selectedContact); }}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline" size="sm" className="gap-1.5 text-xs"
                      disabled={scoringId === selectedContact.id}
                      onClick={() => { setScoringId(selectedContact.id); scoreMutation.mutate({ id: selectedContact.id }); }}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${scoringId === selectedContact.id ? "animate-spin" : ""}`} />
                      Re-score
                    </Button>
                    <Button
                      variant="outline" size="sm" className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 ml-auto"
                      onClick={() => { if (confirm("Remove this contact?")) deleteMutation.mutate({ id: selectedContact.id }); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  );
}
