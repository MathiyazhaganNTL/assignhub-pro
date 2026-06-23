import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Admin Login — Professional Dashboard Animation                     */
/*  Floating dashboard widgets with subtle micro-animations            */
/* ------------------------------------------------------------------ */

const BRAND = "#4b8bec";
const BRAND_LIGHT = "#e8f0fe";
const BRAND_MID = "#a4c4f4";
const SUCCESS = "#22c55e";
const WHITE = "#ffffff";

/* Animated bar heights — cycle smoothly */
const barSets = [
  [22, 36, 28, 44, 32, 40],
  [30, 44, 36, 28, 42, 34],
  [38, 28, 42, 36, 30, 46],
];

export function AdminLoginIllustration() {
  const [barIdx, setBarIdx] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifShown = useRef(false);

  // Cycle bar chart data
  useEffect(() => {
    const id = setInterval(() => setBarIdx((p) => (p + 1) % barSets.length), 2200);
    return () => clearInterval(id);
  }, []);

  // One-time notification after 2.5s
  useEffect(() => {
    if (notifShown.current) return;
    const show = setTimeout(() => {
      notifShown.current = true;
      setShowNotif(true);
    }, 2500);
    const hide = setTimeout(() => setShowNotif(false), 6000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  const bars = barSets[barIdx];

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-brand/15 bg-gradient-to-br from-[#f0f5ff] to-[#f8fafc]">
      <svg
        viewBox="0 0 400 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        aria-label="Administrator dashboard overview"
      >
        {/* ── Subtle grid dots ── */}
        {Array.from({ length: 5 }).map((_, r) =>
          Array.from({ length: 10 }).map((_, c) => (
            <circle key={`d${r}${c}`} cx={20 + c * 40} cy={16 + r * 38} r={0.8} fill="#cbd5e1" opacity={0.35} />
          ))
        )}

        {/* ── Main dashboard card (center) ── */}
        <motion.g
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <rect x="90" y="20" width="220" height="140" rx="10" fill={WHITE} stroke="#e2e8f0" strokeWidth="0.8" />
          {/* Title bar */}
          <rect x="90" y="20" width="220" height="28" rx="10" fill="#f8fafc" />
          <rect x="90" y="38" width="220" height="2" fill="#f1f5f9" />
          {/* Browser dots */}
          <circle cx="104" cy="34" r="3" fill="#fca5a5" />
          <circle cx="114" cy="34" r="3" fill="#fde047" />
          <circle cx="124" cy="34" r="3" fill="#86efac" />
          {/* URL bar */}
          <rect x="136" y="30" width="90" height="8" rx="4" fill="#f1f5f9" />
          <text x="146" y="37" fontSize="5" fill="#94a3b8" fontFamily="system-ui">assignhub/admin</text>

          {/* ── Sidebar inside the card ── */}
          <rect x="92" y="50" width="52" height="108" rx="0" fill="#f8fafc" />
          <line x1="144" y1="50" x2="144" y2="158" stroke="#e2e8f0" strokeWidth="0.5" />
          {/* Sidebar items */}
          {["Overview", "Students", "Reports", "Settings"].map((label, i) => (
            <g key={label}>
              <rect
                x="96"
                y={55 + i * 22}
                width="44"
                height="16"
                rx="4"
                fill={i === 0 ? BRAND : "transparent"}
              />
              <text
                x="100"
                y={66 + i * 22}
                fontSize="5.5"
                fill={i === 0 ? WHITE : "#94a3b8"}
                fontFamily="system-ui"
                fontWeight={i === 0 ? 600 : 400}
              >
                {label}
              </text>
            </g>
          ))}

          {/* ── Stat cards row ── */}
          {[
            { label: "Students", value: "248", color: BRAND },
            { label: "Active", value: "186", color: SUCCESS },
            { label: "Pending", value: "12", color: "#f59e0b" },
          ].map((s, i) => (
            <motion.g
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
            >
              <rect x={150 + i * 52} y="52" width="48" height="30" rx="5" fill={WHITE} stroke="#e2e8f0" strokeWidth="0.5" />
              <text x={155 + i * 52} y="63" fontSize="4.5" fill="#94a3b8" fontFamily="system-ui">{s.label}</text>
              <text x={155 + i * 52} y="76" fontSize="10" fill={s.color} fontFamily="system-ui" fontWeight="700">{s.value}</text>
            </motion.g>
          ))}

          {/* ── Bar chart area ── */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <rect x="150" y="88" width="100" height="66" rx="5" fill={WHITE} stroke="#e2e8f0" strokeWidth="0.5" />
            <text x="155" y="100" fontSize="5" fill="#64748b" fontFamily="system-ui" fontWeight="600">Analytics</text>
            {/* Chart baseline */}
            <line x1="158" y1="148" x2="242" y2="148" stroke="#e2e8f0" strokeWidth="0.5" />
            {/* Animated bars */}
            {bars.map((h, i) => (
              <motion.rect
                key={`b${i}`}
                x={162 + i * 13}
                width="9"
                rx="2"
                animate={{ y: 148 - h, height: h }}
                transition={{ duration: 1, ease: "easeInOut" }}
                fill={i % 2 === 0 ? BRAND : BRAND_MID}
                opacity={0.85}
              />
            ))}
          </motion.g>

          {/* ── Donut chart ── */}
          <motion.g
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <rect x="256" y="88" width="50" height="66" rx="5" fill={WHITE} stroke="#e2e8f0" strokeWidth="0.5" />
            <text x="261" y="100" fontSize="5" fill="#64748b" fontFamily="system-ui" fontWeight="600">Status</text>
            <circle cx="281" cy="130" r="16" fill="none" stroke="#f1f5f9" strokeWidth="5" />
            <motion.circle
              cx="281" cy="130" r="16"
              fill="none"
              stroke={BRAND}
              strokeWidth="5"
              strokeDasharray="70 100"
              strokeLinecap="round"
              initial={{ strokeDashoffset: 70 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ delay: 1.1, duration: 1.2, ease: "easeOut" }}
              transform="rotate(-90 281 130)"
            />
            <motion.circle
              cx="281" cy="130" r="16"
              fill="none"
              stroke={SUCCESS}
              strokeWidth="5"
              strokeDasharray="20 100"
              strokeDashoffset="-70"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              transform="rotate(-90 281 130)"
            />
            <text x="275" y="133" fontSize="7" fill="#1e293b" fontFamily="system-ui" fontWeight="700">75%</text>
          </motion.g>
        </motion.g>

        {/* ── Floating security shield (top-left) ── */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <rect x="18" y="30" width="52" height="48" rx="8" fill={WHITE} stroke="#e2e8f0" strokeWidth="0.8" />
          <motion.g
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "44px 48px" }}
          >
            <path
              d="M44 38 l12 4 v10 c0 8-6 13-12 15 c-6-2-12-7-12-15 v-10 z"
              fill={BRAND_LIGHT}
              stroke={BRAND}
              strokeWidth="1"
            />
            <polyline
              points="38,50 42,54 50,46"
              fill="none"
              stroke={BRAND}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.g>
          <text x="26" y="72" fontSize="4.5" fill="#64748b" fontFamily="system-ui">Secured</text>
        </motion.g>

        {/* ── Floating clock (bottom-left) ── */}
        <motion.g
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <rect x="18" y="90" width="52" height="40" rx="8" fill={WHITE} stroke="#e2e8f0" strokeWidth="0.8" />
          <circle cx="44" cy="106" r="11" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
          <circle cx="44" cy="106" r="1" fill="#1e293b" />
          {/* Hour */}
          <line x1="44" y1="106" x2="44" y2="99" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" />
          {/* Minute — slow tick */}
          <motion.line
            x1="44" y1="106" x2="51" y2="103"
            stroke="#94a3b8"
            strokeWidth="0.8"
            strokeLinecap="round"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "44px 106px" }}
          />
          <text x="27" y="125" fontSize="4.5" fill="#64748b" fontFamily="system-ui">Real-time</text>
        </motion.g>

        {/* ── Floating notification bell (top-right) ── */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <rect x="330" y="30" width="52" height="40" rx="8" fill={WHITE} stroke="#e2e8f0" strokeWidth="0.8" />
          {/* Bell icon */}
          <path
            d="M356 42 c0-4-3-7-7-7s-7 3-7 7c0 5-2 8-3 9h20c-1-1-3-4-3-9z"
            fill={BRAND_LIGHT}
            stroke={BRAND}
            strokeWidth="0.8"
          />
          <line x1="347" y1="52" x2="351" y2="52" stroke={BRAND} strokeWidth="0.8" strokeLinecap="round" />
          {/* Badge */}
          <motion.circle
            cx="355" cy="38"
            r="3"
            fill="#ef4444"
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <text x="353" y="40" fontSize="3.5" fill={WHITE} fontFamily="system-ui" fontWeight="700" textAnchor="middle">3</text>
          <text x="335" y="64" fontSize="4.5" fill="#64748b" fontFamily="system-ui">Alerts</text>
        </motion.g>

        {/* ── Floating activity feed (bottom-right) ── */}
        <motion.g
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <rect x="330" y="80" width="52" height="56" rx="8" fill={WHITE} stroke="#e2e8f0" strokeWidth="0.8" />
          <text x="335" y="93" fontSize="4.5" fill="#64748b" fontFamily="system-ui" fontWeight="600">Activity</text>
          {[0, 1, 2].map((i) => (
            <g key={`act${i}`}>
              <circle
                cx="340"
                cy={103 + i * 12}
                r="2.5"
                fill={i === 0 ? SUCCESS : i === 1 ? BRAND : "#e2e8f0"}
              />
              <rect
                x="345"
                y={101 + i * 12}
                width={22 + i * 4}
                height="3"
                rx="1.5"
                fill="#f1f5f9"
              />
            </g>
          ))}
        </motion.g>
      </svg>

      {/* ── One-time welcome notification ── */}
      <AnimatePresence>
        {showNotif && (
          <motion.div
            initial={{ opacity: 0, x: 30, y: 6 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute right-2.5 top-2.5 sm:right-3.5 sm:top-3.5 z-10"
          >
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-white/95 backdrop-blur-sm px-3 py-2.5 shadow-lg shadow-green-500/10">
              <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green-50">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" fill={SUCCESS} />
                  <polyline points="5,8 7,10.5 11,5.5" stroke={WHITE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 leading-tight">Welcome to Admin Page</p>
                <p className="mt-0.5 text-[10px] text-gray-500 leading-snug">Dashboard successfully loaded.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
