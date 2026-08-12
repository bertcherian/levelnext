import React from "react";
import { Zap } from "lucide-react";

interface LaunchXpBurstProps {
  earned: number;
  bonusXp?: number;
}

export default function LaunchXpBurst({ earned, bonusXp = 0 }: LaunchXpBurstProps) {
  if (earned <= 0) return null;

  return (
    <div className="ld-xp-burst" role="status" aria-live="polite" aria-label={`${earned} XP earned`}>
      <span className="ld-xp-burst-ring ld-xp-burst-ring-one" aria-hidden="true" />
      <span className="ld-xp-burst-ring ld-xp-burst-ring-two" aria-hidden="true" />
      <div className="ld-xp-burst-content">
        <span className="ld-xp-spark" aria-hidden="true">✦</span>
        <Zap size={18} aria-hidden="true" />
        <span>+{earned} XP</span>
        {bonusXp > 0 && <small>+{bonusXp} challenge bonus</small>}
      </div>
    </div>
  );
}
