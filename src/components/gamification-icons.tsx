import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, Flame, Trophy, Target, Rocket } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Gamification Dashboard — Professional Animated Icons               */
/*  Replaces all emojis with SVG + Framer Motion micro-animations      */
/* ------------------------------------------------------------------ */

/* ── Overall Coins — Coin Vault with Coin Rain ── */

export function CoinVaultIcon({ className = "" }: { className?: string }) {
  const [coins, setCoins] = useState<{ id: number; x: number; delay: number }[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    const spawn = () => {
      const batch = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => {
        counter.current += 1;
        return { id: counter.current, x: -8 + Math.random() * 16, delay: Math.random() * 0.4 };
      });
      setCoins(batch);
      setTimeout(() => setCoins([]), 2200);
    };
    spawn();
    const id = setInterval(spawn, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Falling coins */}
      <AnimatePresence>
        {coins.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: -14, x: c.x }}
            animate={{ opacity: [0, 1, 1, 0], y: [- 14, -4, 6, 14] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, delay: c.delay, ease: "easeIn" }}
            className="absolute top-0 pointer-events-none"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="4.5" fill="#F0C060" stroke="#D4A030" strokeWidth="0.8" />
              <text x="5" y="7" fontSize="5" fill="#B8860B" textAnchor="middle" fontWeight="bold">$</text>
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
      {/* Coin bag */}
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#E8A838]">
          <ellipse cx="12" cy="8" rx="7" ry="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 8v4c0 1.66 3.13 3 7 3s7-1.34 7-3V8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 12v4c0 1.66 3.13 3 7 3s7-1.34 7-3v-4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </motion.div>
    </div>
  );
}

/* ── Assignments Completed — Clipboard Check (draw-in) ── */

export function ClipboardCheckIcon({ size = 24 }: { size?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <ClipboardCheck size={size} className="text-brand" strokeWidth={1.8} />
    </motion.div>
  );
}

/* ── Streak — Flame with soft pulse ── */

export function FlameIcon({ size = 24 }: { size?: number }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <Flame size={size} className="text-orange-500" strokeWidth={1.8} />
    </motion.div>
  );
}

/* ── Coins Earned Today — Coin Stack with drop ── */

export function CoinStackIcon({ size = 24 }: { size?: number }) {
  const [showDrop, setShowDrop] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setShowDrop(true);
      setTimeout(() => setShowDrop(false), 1200);
    };
    cycle();
    const id = setInterval(cycle, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative inline-flex items-center justify-center">
      <AnimatePresence>
        {showDrop && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute -top-1"
          >
            <svg width="8" height="8" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3.5" fill="#F0C060" stroke="#D4A030" strokeWidth="0.6" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-amber-500">
        <ellipse cx="12" cy="16" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="12" cy="12" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="12" cy="8" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M6 8v4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M18 8v4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 12v4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M18 12v4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/* ── Achievement: Early Bird — Rocket ── */

export function EarlyBirdIcon({ earned = false }: { earned?: boolean }) {
  return (
    <motion.div
      whileHover={earned ? { y: -3, scale: 1.05 } : {}}
      transition={{ duration: 0.25 }}
      className="inline-flex items-center justify-center"
    >
      <Rocket
        size={22}
        className={earned ? "text-brand" : "text-muted-foreground/50"}
        strokeWidth={1.8}
      />
    </motion.div>
  );
}

/* ── Achievement: Streak 3 — Target Flame Badge ── */

export function StreakBadgeIcon({ earned = false }: { earned?: boolean }) {
  return (
    <motion.div
      animate={earned ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="inline-flex items-center justify-center"
    >
      <Flame
        size={22}
        className={earned ? "text-orange-500" : "text-muted-foreground/50"}
        strokeWidth={1.8}
      />
    </motion.div>
  );
}

/* ── Achievement: On Track — Target ── */

export function OnTrackIcon({ earned = false }: { earned?: boolean }) {
  return (
    <motion.div
      className="inline-flex items-center justify-center"
      whileHover={earned ? { scale: 1.05 } : {}}
    >
      <motion.div
        animate={earned ? { scale: [1, 1.06, 1] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Target
          size={22}
          className={earned ? "text-emerald-500" : "text-muted-foreground/50"}
          strokeWidth={1.8}
        />
      </motion.div>
    </motion.div>
  );
}

/* ── Achievement: Top Performer — Trophy with shine ── */

export function TrophyIcon({ earned = false, size = 22 }: { earned?: boolean; size?: number }) {
  const [shine, setShine] = useState(false);

  useEffect(() => {
    if (!earned) return;
    const cycle = () => {
      setShine(true);
      setTimeout(() => setShine(false), 600);
    };
    cycle();
    const id = setInterval(cycle, 8000);
    return () => clearInterval(id);
  }, [earned]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <Trophy
        size={size}
        className={earned ? "text-amber-500" : "text-muted-foreground/50"}
        strokeWidth={1.8}
      />
      {/* Shine sweep */}
      <AnimatePresence>
        {shine && earned && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: [0, 0.7, 0], x: 10 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-full"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/60 to-transparent skew-x-12" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Gift / Reward Icon (replaces 🎁) ── */

export function GiftIcon({ size = 24 }: { size?: number }) {
  return (
    <motion.div
      animate={{ rotate: [0, -5, 5, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 4 }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-brand">
        <rect x="3" y="12" width="18" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="8" width="20" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="12" y1="8" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8c-1-2-4-4-5-3s0 3 5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 8c1-2 4-4 5-3s0 3-5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}

/* ── Rank Trophy (replaces 🏆 in profile overview) ── */

export function RankTrophyIcon() {
  return (
    <motion.div
      initial={{ opacity: 0.15 }}
      animate={{ opacity: [0.15, 0.25, 0.15] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <Trophy size={48} className="text-amber-500" strokeWidth={1.2} />
    </motion.div>
  );
}

/* ── Achievement icon resolver ── */

export function getAnimatedAchievementIcon(icon: string, earned: boolean) {
  switch (icon) {
    case "sunrise":
      return <EarlyBirdIcon earned={earned} />;
    case "flame":
      return <StreakBadgeIcon earned={earned} />;
    case "target":
      return <OnTrackIcon earned={earned} />;
    case "trophy":
      return <TrophyIcon earned={earned} />;
    case "star":
      return (
        <motion.div
          animate={earned ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={earned ? "text-amber-400" : "text-muted-foreground/50"}>
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill={earned ? "currentColor" : "none"}
              opacity={earned ? 0.3 : 1}
            />
          </svg>
        </motion.div>
      );
    default:
      return <Target size={22} className={earned ? "text-brand" : "text-muted-foreground/50"} strokeWidth={1.8} />;
  }
}
