import { useState } from "react";
import AcademyLayout from "../components/AcademyLayout";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import {
  Map,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  BookOpen,
  Layers,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";

export default function AcademyProductMap() {
  const { data: objects, isLoading } = trpc.academy.getProductMap.useQuery();
  const exploreMutation = trpc.academy.recordStepExploration.useMutation();

  const [selectedSlug, setSelectedSlug] = useState<string>("golden-journey-first-time-manager");

  if (isLoading || !objects) {
    return (
      <AcademyLayout stageBadge="Product Map">
        <div className="py-24 text-center">
          <div className="h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#F8F5F0]/70">Loading interactive Product Map...</p>
        </div>
      </AcademyLayout>
    );
  }

  const selectedObject = objects.find((o) => o.slug === selectedSlug) ?? objects[0];

  const handleRecordExploration = async () => {
    if (!selectedObject) return;
    try {
      await exploreMutation.mutateAsync({
        slug: selectedObject.slug,
        stepTitle: selectedObject.title,
        dimension: "navigate",
      });
      toast.success(`Explored "${selectedObject.title}". Added to Passport evidence.`);
    } catch {
      toast.error("Could not record step.");
    }
  };

  return (
    <AcademyLayout stageBadge="Product Map">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
            <Map size={14} /> Interactive Product Architecture
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            The LevelNext Product & Capability Universe
          </h1>
          <p className="text-sm text-[#F8F5F0]/70 max-w-3xl">
            LevelNext is a single interconnected intelligence architecture. Select a product, engine, or journey below to inspect its why layer, target user, and connected platform routes.
          </p>
        </div>

        {/* Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Interactive Node Navigator */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">Product Knowledge Nodes</p>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {objects.map((obj) => {
                const isSelected = obj.slug === selectedSlug;
                return (
                  <button
                    key={obj.slug}
                    type="button"
                    onClick={() => setSelectedSlug(obj.slug)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${
                      isSelected
                        ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-md"
                        : "bg-[#1C1C1C] border-white/10 text-[#F8F5F0]/80 hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                        isSelected ? "bg-[#D4AF37] text-[#0A1A2F]" : "bg-white/10 text-[#D4AF37]"
                      }`}
                    >
                      {obj.objectType === "engine" ? <Zap size={14} /> : <BookOpen size={14} />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold leading-snug">{obj.title}</p>
                      <span className="inline-block text-[10px] uppercase font-semibold text-[#D4AF37]/80">
                        {obj.objectType.replace("_", " ")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Node Deep Dive (2 columns) */}
          <div className="lg:col-span-2">
            {selectedObject && (
              <div className="bg-[#1C1C1C] border border-[#D4AF37]/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                      {selectedObject.objectType.replace("_", " ")}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5">{selectedObject.title}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleRecordExploration}
                    disabled={exploreMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D4AF37] text-[#0A1A2F] text-xs font-bold hover:bg-[#c49f2e] transition shadow"
                  >
                    <ShieldCheck size={14} />
                    <span>Record in Passport</span>
                  </button>
                </div>

                <p className="text-sm text-[#F8F5F0]/90 leading-relaxed font-medium">
                  {selectedObject.summary}
                </p>

                {/* Structured Teaching Sections */}
                <div className="space-y-4 pt-2">
                  {Object.entries((selectedObject.content as Record<string, any>) ?? {}).map(([key, val]) => {
                    if (typeof val === "object" && !Array.isArray(val)) {
                      return (
                        <div key={key} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
                          <p className="text-xs font-bold text-[#D4AF37] capitalize">
                            {key.replace(/([A-Z])/g, " $1")}
                          </p>
                          <div className="text-xs text-[#F8F5F0]/80 space-y-1">
                            {Object.entries(val).map(([subK, subV]) => (
                              <p key={subK}>
                                <strong className="text-white capitalize">{subK}:</strong> {String(subV)}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (Array.isArray(val)) {
                      return (
                        <div key={key} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
                          <p className="text-xs font-bold text-[#D4AF37] capitalize">
                            {key.replace(/([A-Z])/g, " $1")}
                          </p>
                          <ul className="text-xs text-[#F8F5F0]/80 list-disc list-inside space-y-1">
                            {val.map((item, idx) => (
                              <li key={idx}>{typeof item === "object" ? JSON.stringify(item) : String(item)}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-1">
                        <p className="text-xs font-bold text-[#D4AF37] capitalize">
                          {key.replace(/([A-Z])/g, " $1")}
                        </p>
                        <p className="text-xs text-[#F8F5F0]/80 leading-relaxed">{String(val)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Live Platform Link if available */}
                {(selectedObject.content as any)?.route && (
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Live Experience Route</p>
                      <p className="text-[11px] text-[#F8F5F0]/60">Navigate to the actual product surface to inspect real-work interaction.</p>
                    </div>
                    <Link
                      href={(selectedObject.content as any).route}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
                    >
                      <span>Open Live Route</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AcademyLayout>
  );
}
