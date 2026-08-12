import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function EarlyCareerGrowth() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const home = trpc.earlyCareer.getHome.useQuery(undefined, { enabled: isAuthenticated });
  if (authLoading) return <div className="mx-auto max-w-7xl px-4 py-20 text-sm md:px-8" style={{ color: "#56616D" }}>Preparing your growth space…</div>;
  if (!isAuthenticated) return <div className="mx-auto max-w-2xl px-4 py-20 text-center md:px-8"><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A47618" }}>LevelNext Early Career Intelligence</p><h1 className="mt-3 text-2xl font-semibold" style={{ color: "#0A1A2F" }}>Sign in to see your growth map.</h1><Link href="/login" className="mt-6 inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: "#0A1A2F", color: "#F8F5F0" }}>Sign in to continue</Link></div>;
  if (home.isLoading) return <div className="mx-auto max-w-7xl px-4 py-20 text-sm md:px-8" style={{ color: "#56616D" }}>Loading your growth architecture…</div>;
  if (home.isError) return <div className="mx-auto max-w-2xl px-4 py-20 text-center md:px-8"><p className="text-sm" style={{ color: "#56616D" }}>We could not load your growth architecture.</p><button className="mt-4 text-sm font-semibold" onClick={() => home.refetch()} style={{ color: "#0A1A2F" }}>Try again</button></div>;
  const data = home.data;
  const nextMove = data?.nextMove;
  return (
    <div className="mx-auto max-w-7xl px-4 py-7 md:px-8 md:py-10">
      <section className="rounded-3xl p-7 md:p-9" style={{ background: "#0A1A2F" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "#D4AF37" }}>My Growth</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-4xl">Eight capabilities that make work feel more navigable—and your contribution more trusted.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6" style={{ color: "#C9D0D8" }}>This is not a performance rating. It is a development map that helps you decide where a small, real-world action could make the biggest difference next.</p>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data?.capabilities.map((capability, index) => {
          const focus = capability.id === nextMove?.capabilityId;
          return <div key={capability.id} className="rounded-3xl border bg-white p-5" style={{ borderColor: focus ? "#D4AF37" : "#E1D9CE", boxShadow: focus ? "0 10px 30px rgba(10,26,47,.08)" : undefined }}>
            <div className="flex items-start justify-between gap-3"><span className="text-xs font-semibold" style={{ color: "#A47618" }}>0{index + 1}</span>{focus && <span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide" style={{ background: "#EDE3CC", color: "#0A1A2F" }}>Current growth edge</span>}</div>
            <h2 className="mt-8 text-lg font-semibold" style={{ color: "#0A1A2F" }}>{capability.name}</h2>
            <p className="mt-2 text-sm leading-5" style={{ color: "#56616D" }}>{capability.question}</p>
            <p className="mt-6 text-xs leading-5" style={{ color: "#6B6258" }}>{focus ? `Your current next move: ${nextMove?.title}` : "This capability will surface when a relevant workplace moment makes it useful."}</p>
          </div>;
        })}
      </section>
      <section className="mt-6 flex flex-col justify-between gap-5 rounded-3xl p-6 md:flex-row md:items-center" style={{ background: "#EDE3CC" }}>
        <div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white" style={{ color: "#A47618" }}><Compass size={20} /></div><div><h2 className="font-semibold" style={{ color: "#0A1A2F" }}>Growth becomes credible when it is evidenced.</h2><p className="mt-1 max-w-2xl text-sm leading-5" style={{ color: "#56616D" }}>Use a real conversation, a completed commitment, an applied piece of feedback, or a resolved dependency to record what changed.</p></div></div>
        <Link href="/early-career" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold" style={{ color: "#0A1A2F" }}>Return to today’s next move <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
}
