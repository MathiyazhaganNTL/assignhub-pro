import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useOnboarding } from "@/lib/onboarding-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Compass, X, ChevronRight, ChevronLeft, Award, Trophy,
  CheckCircle2, Sparkles, AlertCircle
} from "lucide-react";

export function OnboardingTour() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const {
    activeTour,
    isActive,
    currentStep,
    steps,
    showWelcome,
    showCompletion,
    setShowCompletion,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    closeWelcome,
  } = useOnboarding();

  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  // 1. Detect device size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. Track target element's coordinates and handles scroll positioning
  useEffect(() => {
    if (!isActive || !step) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const bounds = el.getBoundingClientRect();
        setRect(bounds);
        
        // If elements are out of viewport view, scroll smoothly to center
        const isOutOfView =
          bounds.top < 0 ||
          bounds.bottom > window.innerHeight ||
          bounds.left < 0 ||
          bounds.right > window.innerWidth;
          
        if (isOutOfView) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        setRect(null);
      }
    };

    updateRect();

    // Event listeners to handle scrolling & sizing dynamically
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);
    const interval = setInterval(updateRect, 100);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
      clearInterval(interval);
    };
  }, [isActive, currentStep, step?.targetSelector]);

  // 3. Keyboard navigation handlers
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skipTour(false);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, currentStep]);

  // 4. Focus trapping for accessibility inside modals
  const welcomeRef = useRef<HTMLDivElement>(null);
  const completionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const focusTrap = (e: KeyboardEvent, container: HTMLDivElement | null) => {
      if (!container || e.key !== "Tab") return;
      const focusable = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex="0"]'
      );
      if (focusable.length === 0) return;
      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;
      
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    const handleWelcomeKey = (e: KeyboardEvent) => focusTrap(e, welcomeRef.current);
    const handleCompletionKey = (e: KeyboardEvent) => focusTrap(e, completionRef.current);

    if (showWelcome) window.addEventListener("keydown", handleWelcomeKey);
    if (showCompletion) window.addEventListener("keydown", handleCompletionKey);

    return () => {
      window.removeEventListener("keydown", handleWelcomeKey);
      window.removeEventListener("keydown", handleCompletionKey);
    };
  }, [showWelcome, showCompletion]);

  // Initial focus placement
  useEffect(() => {
    if (showWelcome && welcomeRef.current) {
      const primaryBtn = welcomeRef.current.querySelector("button") as HTMLElement;
      primaryBtn?.focus();
    }
  }, [showWelcome]);

  if (!showWelcome && !showCompletion && (!isActive || !step)) return null;

  // 5. Calculate Tooltip coordinates relative to highlighted element (for desktop)
  const getTooltipStyle = () => {
    if (isMobile || !rect) return {};
    const margin = 16;
    const placement = step.placement || "bottom";

    // Default fallbacks
    let top = 0;
    let left = 0;
    let transform = "";

    switch (placement) {
      case "bottom":
        top = rect.bottom + margin;
        left = rect.left + rect.width / 2;
        transform = "translateX(-50%)";
        break;
      case "top":
        top = rect.top - margin;
        left = rect.left + rect.width / 2;
        transform = "translate(-50%, -100%)";
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - margin;
        transform = "translate(-100%, -50%)";
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + margin;
        transform = "translate(0, -50%)";
        break;
      default:
        // Center of page fallback
        top = window.innerHeight / 2;
        left = window.innerWidth / 2;
        transform = "translate(-50%, -50%)";
    }

    return {
      position: "fixed" as const,
      top: `${top}px`,
      left: `${left}px`,
      transform,
      zIndex: 9995,
    };
  };

  return (
    <>
      {/* Dimmed backdrop background when tour is active */}
      {isActive && (
        <div 
          className="fixed inset-0 bg-transparent z-[9980] pointer-events-auto"
          onClick={() => skipTour(false)}
        />
      )}

      {/* Spotlight highlight cut-out around active element */}
      {isActive && rect && (
        <div
          className="tour-spotlight tour-spotlight-pulse"
          style={{
            top: `${rect.top - 8}px`,
            left: `${rect.left - 8}px`,
            width: `${rect.width + 16}px`,
            height: `${rect.height + 16}px`,
          }}
        />
      )}

      {/* A. Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 tour-backdrop">
          <div
            ref={welcomeRef}
            className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-7 text-center tour-fade-in relative"
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-5">
              <Compass className="h-6 w-6" />
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome to AssignHub</h2>
            
            <p className="text-sm font-medium text-brand mt-1.5">
              Your smart assignment management platform.
            </p>
            
            <p className="text-xs text-muted-foreground leading-relaxed mt-4">
              AssignHub helps students request approvals, submit coursework, track calendars, and unlock rewards, while administrators manage users, approvals, submissions, and metrics effortlessly.
            </p>

            <div className="flex items-center justify-center gap-2 mt-6">
              <Checkbox
                id="dont-show"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(!!checked)}
              />
              <label htmlFor="dont-show" className="text-xs text-muted-foreground cursor-pointer select-none font-medium">
                Don't show this automatically again
              </label>
            </div>

            <div className="flex items-center justify-center gap-3 mt-7">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  closeWelcome(dontShowAgain);
                  skipTour(dontShowAgain);
                }}
              >
                Skip Tour
              </Button>
              <Button
                size="sm"
                className="bg-brand text-brand-foreground"
                onClick={() => {
                  closeWelcome(dontShowAgain);
                  startTour("landing");
                }}
              >
                Explore Platform <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* B. Tour Tooltip Card / Bottom Sheet */}
      {isActive && step && (
        isMobile ? (
          /* Mobile Slide-Up Bottom Sheet */
          <div className="fixed bottom-0 left-0 right-0 w-full rounded-t-2xl bg-card border-t border-border shadow-2xl p-6 z-[9995] animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 rounded-full bg-muted/60 mx-auto mb-4" />
            
            <h3 className="font-bold text-base text-foreground leading-tight">{step.title}</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{step.description}</p>
            
            <div className="flex items-center justify-between border-t border-border mt-5 pt-4 text-xs">
              <span className="text-muted-foreground font-semibold">
                Step {currentStep + 1} of {steps.length}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => skipTour(false)}>
                  Skip
                </Button>
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={prevStep}>
                    <ChevronLeft className="h-3 w-3 mr-1" /> Prev
                  </Button>
                )}
                <Button size="sm" className="h-8 text-xs bg-brand text-brand-foreground font-semibold" onClick={nextStep}>
                  {currentStep === steps.length - 1 ? "Finish" : "Next"} <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Tablet/Desktop absolute Floating Card */
          <div
            ref={tooltipRef}
            style={getTooltipStyle()}
            className="w-80 rounded-xl border border-border bg-card shadow-2xl p-5 tour-fade-in text-left pointer-events-auto"
            role="tooltip"
          >
            <h3 className="font-bold text-sm text-foreground leading-tight">{step.title}</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{step.description}</p>

            <div className="flex items-center justify-between border-t border-border mt-5 pt-3.5 text-[11px]">
              <span className="text-muted-foreground font-bold">
                Step {currentStep + 1} of {steps.length}
              </span>
              <div className="flex gap-1.5">
                <button
                  className="text-muted-foreground hover:text-foreground font-semibold px-2 py-1 outline-none rounded"
                  onClick={() => skipTour(false)}
                >
                  Skip
                </button>
                {currentStep > 0 && (
                  <button
                    className="border border-border hover:bg-muted/40 rounded px-2.5 py-1 flex items-center font-semibold text-foreground outline-none transition-colors"
                    onClick={prevStep}
                  >
                    <ChevronLeft className="h-3 w-3 mr-0.5" /> Prev
                  </button>
                )}
                <button
                  className="bg-brand hover:bg-brand/90 text-brand-foreground rounded px-3 py-1 flex items-center font-semibold outline-none transition-colors"
                  onClick={nextStep}
                >
                  {currentStep === steps.length - 1 ? "Finish" : "Next"} <ChevronRight className="h-3 w-3 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* C. Tour Completion Modal */}
      {showCompletion && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 tour-backdrop">
          <div
            ref={completionRef}
            className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-8 text-center tour-fade-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center mb-5 animate-bounce">
              <Sparkles className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-foreground">You're all set!</h2>
            
            <p className="text-sm font-medium text-success mt-1.5">
              Tour completed successfully
            </p>

            <p className="text-xs text-muted-foreground leading-relaxed mt-4">
              You now know how to navigate the platform. Start managing and tracking your assignments with confidence!
            </p>

            <div className="flex items-center justify-center gap-3 mt-7">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCompletion(false);
                  const type = activeTour || "landing";
                  startTour(type);
                }}
              >
                Replay Tour
              </Button>
              <Button
                size="sm"
                className="bg-brand text-brand-foreground"
                onClick={() => {
                  setShowCompletion(false);
                  if (role === "student") {
                    navigate({ to: "/dashboard" });
                  } else if (role === "admin") {
                    navigate({ to: "/admin" });
                  }
                }}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
