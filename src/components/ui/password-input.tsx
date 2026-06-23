import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/* ------------------------------------------------------------------ */
/*  PasswordInput                                                      */
/*  A drop-in replacement for <Input type="password"> that adds a      */
/*  premium animated eye-toggle with micro-interactions.                */
/* ------------------------------------------------------------------ */

interface PasswordInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const [hovered, setHovered] = React.useState(false);

    /* ---- pupil cursor tracking ---- */
    const btnRef = React.useRef<HTMLButtonElement>(null);
    const [pupilOffset, setPupilOffset] = React.useState({ x: 0, y: 0 });
    const isCoarse = React.useRef(false);

    React.useEffect(() => {
      isCoarse.current = window.matchMedia("(pointer: coarse)").matches;
    }, []);

    React.useEffect(() => {
      if (!visible || isCoarse.current) {
        setPupilOffset({ x: 0, y: 0 });
        return;
      }

      let rafId = 0;
      const handleMove = (e: MouseEvent) => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const btn = btnRef.current;
          if (!btn) return;
          const rect = btn.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = (e.clientX - cx) / (window.innerWidth / 2);
          const dy = (e.clientY - cy) / (window.innerHeight / 2);
          // Clamp to ±2px
          setPupilOffset({
            x: Math.max(-2, Math.min(2, dx * 2)),
            y: Math.max(-2, Math.min(2, dy * 2)),
          });
        });
      };

      document.addEventListener("mousemove", handleMove, { passive: true });
      return () => {
        cancelAnimationFrame(rafId);
        document.removeEventListener("mousemove", handleMove);
      };
    }, [visible]);

    return (
      <div className="password-input-wrapper">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          ref={btnRef}
          type="button"
          tabIndex={0}
          aria-label={visible ? "Hide password" : "Show password"}
          className={cn(
            "password-toggle-btn",
            hovered && "password-toggle-btn--hover",
            visible && "password-toggle-btn--active",
          )}
          onClick={() => setVisible((v) => !v)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="password-eye-svg"
            aria-hidden="true"
          >
            {/* Upper eyelid */}
            <path
              className="password-eye-lid"
              d={
                visible
                  ? "M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12"
                  : "M2 12C2 12 5.5 7 12 7C18.5 7 22 12 22 12"
              }
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Lower eyelid */}
            <path
              className="password-eye-lid"
              d={
                visible
                  ? "M2 12C2 12 5.5 19 12 19C18.5 19 22 12 22 12"
                  : "M2 12C2 12 5.5 17 12 17C18.5 17 22 12 22 12"
              }
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Pupil (outer ring) */}
            <circle
              className="password-eye-pupil"
              cx={12 + pupilOffset.x}
              cy={12 + pupilOffset.y}
              r="3.5"
              stroke="currentColor"
              strokeWidth="1.8"
              fill="none"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.4)",
                transformOrigin: "center",
              }}
            />
            {/* Inner dot of the pupil */}
            <circle
              className="password-eye-dot"
              cx={12 + pupilOffset.x}
              cy={12 + pupilOffset.y}
              r="1.5"
              fill="currentColor"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0)",
                transformOrigin: "center",
              }}
            />
            {/* Slash line (visible when hidden) */}
            <line
              className="password-eye-slash"
              x1="4"
              y1="4"
              x2="20"
              y2="20"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              style={{
                opacity: visible ? 0 : 1,
              }}
            />
          </svg>
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
