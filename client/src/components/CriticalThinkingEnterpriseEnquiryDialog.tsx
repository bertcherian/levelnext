import React, { useState } from "react";
import { Building2, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EnterpriseEnquiryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CriticalThinkingEnterpriseEnquiryDialog({ open, onOpenChange }: EnterpriseEnquiryDialogProps) {
  const [submitted, setSubmitted] = useState(false);
  const captureLead = trpc.leads.captureEmail.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (error) => toast.error(error.message || "We could not send your enquiry. Please try again."),
  });

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) setSubmitted(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    captureLead.mutate({
      name: String(form.get("name") ?? "").trim() || undefined,
      email: String(form.get("email") ?? "").trim(),
      company: String(form.get("company") ?? "").trim() || undefined,
      jobTitle: String(form.get("jobTitle") ?? "").trim() || undefined,
      enquiry: String(form.get("enquiry") ?? "").trim() || undefined,
      source: "ctdm_enterprise_enquiry",
      moduleCode: "ctdm",
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg border-[#12345A]/15 bg-[#FFFEFA] p-0 shadow-2xl">
        {submitted ? (
          <div className="p-8 text-center sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F0F4] text-[#12345A]"><CheckCircle2 className="h-7 w-7" /></div>
            <DialogTitle className="mt-5 text-2xl text-[#0A1A2F]">Enquiry received</DialogTitle>
            <DialogDescription className="mx-auto mt-3 max-w-sm text-base leading-7 text-slate-600">Thank you. A LevelNext team member will follow up to understand your pilot cohort, decision context, and intended development outcome.</DialogDescription>
            <Button className="mt-7 bg-[#0A1A2F] text-white hover:bg-[#12345A]" onClick={() => handleOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader className="border-b border-[#12345A]/10 bg-[#0A1A2F] px-6 py-6 text-white sm:px-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2B705] text-[#0A1A2F]"><Building2 className="h-5 w-5" /></div>
              <DialogTitle className="text-2xl text-white">Explore an enterprise pilot</DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-6 text-slate-300">Tell us a little about the decision environment you want to strengthen. We will use these details only to respond to your enquiry.</DialogDescription>
            </DialogHeader>
            <form className="space-y-5 px-6 py-6 sm:px-8" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="ctdm-enquiry-name">Name</Label><Input id="ctdm-enquiry-name" name="name" autoComplete="name" placeholder="Your name" /></div>
                <div className="space-y-2"><Label htmlFor="ctdm-enquiry-email">Work email <span className="text-[#C89616]">*</span></Label><Input id="ctdm-enquiry-email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" /></div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="ctdm-enquiry-company">Organisation</Label><Input id="ctdm-enquiry-company" name="company" autoComplete="organization" placeholder="Company name" /></div>
                <div className="space-y-2"><Label htmlFor="ctdm-enquiry-role">Role</Label><Input id="ctdm-enquiry-role" name="jobTitle" autoComplete="organization-title" placeholder="e.g. L&D Director" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="ctdm-enquiry-detail">What decision challenge are you looking to strengthen?</Label><Textarea id="ctdm-enquiry-detail" name="enquiry" className="min-h-24 resize-y" maxLength={2000} placeholder="For example: helping managers challenge assumptions earlier in high-stakes operational decisions." /></div>
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">By submitting, you agree that LevelNext may contact you about this enquiry.</p><Button type="submit" disabled={captureLead.isPending} className="bg-[#F2B705] text-[#0A1A2F] hover:bg-[#ffd44b]">{captureLead.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : <>Send enquiry <Send className="ml-2 h-4 w-4" /></>}</Button></div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
