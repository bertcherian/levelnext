import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Building2, Users, Mail, Phone, Briefcase, MessageSquare } from "lucide-react";

interface OutplacementContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COHORT_SIZES = [
  "1–10 employees",
  "11–25 employees",
  "26–50 employees",
  "51–100 employees",
  "101–250 employees",
  "250+ employees",
];

export function OutplacementContactModal({ open, onOpenChange }: OutplacementContactModalProps) {
  const [form, setForm] = useState({
    name: "",
    title: "",
    organisation: "",
    email: "",
    phone: "",
    cohortSize: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const submitMutation = trpc.outplacementEnquiry.submitEnquiry.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Please enter your full name";
    if (!form.title.trim() || form.title.trim().length < 2) e.title = "Please enter your job title";
    if (!form.organisation.trim() || form.organisation.trim().length < 2) e.organisation = "Please enter your organisation name";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    submitMutation.mutate({
      name: form.name.trim(),
      title: form.title.trim(),
      organisation: form.organisation.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      cohortSize: form.cohortSize || undefined,
      message: form.message.trim() || undefined,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: "", title: "", organisation: "", email: "", phone: "", cohortSize: "", message: "" });
      setErrors({});
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 shadow-2xl">
        {/* Header */}
        <div className="bg-[#0A1A2F] px-8 py-6 rounded-t-lg">
          <div className="flex items-center gap-3 mb-1">
            <Building2 className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-sm font-semibold tracking-wide uppercase">Outplacement Partnership</span>
          </div>
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold text-left">
              Career Intelligence for Your Employees
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/60 text-sm mt-2 leading-relaxed">
            Help your departing employees land stronger. We'll be in touch within one business day.
          </p>
        </div>

        {submitted ? (
          /* Success state */
          <div className="px-8 py-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-[#0A1A2F] mb-2">Thank you, {form.name.split(" ")[0]}.</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-sm">
              We've received your enquiry for <strong>{form.organisation}</strong>. Bert Cherian will be in touch within one business day to discuss how we can support your employees.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4 mb-6 text-left w-full">
              <p className="text-amber-800 text-sm">
                <strong>Check your inbox</strong> — we've sent a confirmation to <span className="font-medium">{form.email}</span>
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="bg-[#0A1A2F] hover:bg-[#0A1A2F]/90 text-white px-8"
            >
              Close
            </Button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            {/* Name + Title row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Full Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Priya Sharma"
                  className={errors.name ? "border-red-400 focus-visible:ring-red-400" : ""}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" /> Job Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="CHRO / HR Director"
                  className={errors.title ? "border-red-400 focus-visible:ring-red-400" : ""}
                />
                {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
              </div>
            </div>

            {/* Organisation */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                <Building2 className="w-3 h-3" /> Organisation <span className="text-red-400">*</span>
              </Label>
              <Input
                value={form.organisation}
                onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))}
                placeholder="Acme Corporation"
                className={errors.organisation ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              {errors.organisation && <p className="text-red-500 text-xs">{errors.organisation}</p>}
            </div>

            {/* Email + Phone row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Work Email <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="priya@company.com"
                  className={errors.email ? "border-red-400 focus-visible:ring-red-400" : ""}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Phone <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Cohort size */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Estimated Cohort Size <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </Label>
              <Select value={form.cohortSize} onValueChange={v => setForm(f => ({ ...f, cohortSize: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="How many employees?" />
                </SelectTrigger>
                <SelectContent>
                  {COHORT_SIZES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Message <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </Label>
              <Textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Tell us about your situation — timeline, the roles being affected, any specific support needs…"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full bg-[#D4AF37] hover:bg-[#C09B2A] text-[#0A1A2F] font-bold text-base py-3 h-auto"
              >
                {submitMutation.isPending ? "Sending…" : "Send Enquiry →"}
              </Button>
              {submitMutation.isError && (
                <p className="text-red-500 text-sm text-center mt-2">
                  Something went wrong. Please try again or email bert@metaresults.in
                </p>
              )}
              <p className="text-gray-400 text-xs text-center mt-3">
                We respond within one business day. No spam, ever.
              </p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
