import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "./auth-context";

export type TourType = "landing" | "student" | "admin";

export interface TourStep {
  title: string;
  description: string;
  targetSelector: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  onEnter?: (navigate: any) => void | Promise<void>;
}

interface OnboardingContextProps {
  activeTour: TourType | null;
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  showWelcome: boolean;
  showCompletion: boolean;
  setShowCompletion: (show: boolean) => void;
  startTour: (type: TourType) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: (dontShowAgain?: boolean) => void;
  finishTour: () => void;
  closeWelcome: (dontShowAgain?: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextProps | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { user, role, profile } = useAuth();

  const [activeTour, setActiveTour] = useState<TourType | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  // 1. Tour steps definitions
  const landingSteps: TourStep[] = [
    {
      title: "Website Header",
      description: "This is the main navigation area where you can access different sections of AssignHub.",
      targetSelector: '[data-tour="landing-header"]',
      placement: "bottom",
    },
    {
      title: "Hero Section",
      description: "This introduces AssignHub and describes the controlled-access assignment process.",
      targetSelector: '[data-tour="landing-hero"]',
      placement: "bottom",
    },
    {
      title: "Student Login",
      description: "Students can sign in here. Access is blocked until registrations are approved by an admin.",
      targetSelector: '[data-tour="landing-student-login"]',
      placement: "bottom",
    },
    {
      title: "Admin Login",
      description: "Administrators access their private control dashboard here to manage the system.",
      targetSelector: '[data-tour="landing-admin-login"]',
      placement: "bottom",
    },
    {
      title: "Student Registration",
      description: "New students create access requests here, joining the pending queue for admin review.",
      targetSelector: '[data-tour="landing-student-register"]',
      placement: "bottom",
    },
    {
      title: "Platform Features Section",
      description: "Explore the core features: cohorts, gamification rewards, and review trackers.",
      targetSelector: '[data-tour="landing-features"]',
      placement: "top",
    },
  ];

  const studentSteps: TourStep[] = [
    {
      title: "Dashboard Header",
      description: "This is your main dashboard workspace where assignments, logs, and menus are hosted.",
      targetSelector: '[data-tour="dashboard-header"]',
      placement: "bottom",
      onEnter: async (nav) => {
        if (window.location.pathname !== "/dashboard") {
          await nav({ to: "/dashboard" });
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      },
    },
    {
      title: "Points & Leveling",
      description: "Earn points by submitting work. Points automatically increase your level.",
      targetSelector: '[data-tour="rewards-points"]',
      placement: "bottom",
      onEnter: async (nav) => {
        if (window.location.pathname !== "/student/rewards") {
          await nav({ to: "/student/rewards" });
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      },
    },
    {
      title: "Coins Vault",
      description: "Earn coins upon admin approvals. Speed matters: earlier submissions yield more coins!",
      targetSelector: '[data-tour="rewards-coins"]',
      placement: "bottom",
    },
    {
      title: "Achievements & Badges",
      description: "Unlock special badges like 'Early Bird' or 'Streak 3' for completing work consistently.",
      targetSelector: '[data-tour="rewards-achievements"]',
      placement: "top",
    },
    {
      title: "Student Leaderboard",
      description: "Compare your standing and progress points with other classmates on the active board.",
      targetSelector: '[data-tour="rewards-leaderboard"]',
      placement: "left",
    },
    {
      title: "Assignment Calendar",
      description: "Monitor critical upcoming start dates and release deadlines for all classes.",
      targetSelector: '[data-tour="rewards-calendar"]',
      placement: "left",
    },
    {
      title: "Your Assignments",
      description: "Track assignment cards displaying status: Assigned, Under Review, Approved, or Rejected.",
      targetSelector: '[data-tour="rewards-assignments"]',
      placement: "top",
    },
    {
      title: "Notifications Feed",
      description: "Access details on grade releases, assignment publications, and review comments.",
      targetSelector: '[data-tour="dashboard-notifications"]',
      placement: "bottom",
    },
    {
      title: "User Profile Menu",
      description: "View your personal academic records, settings, and reload the product tour at any time.",
      targetSelector: '[data-tour="dashboard-profile"]',
      placement: "bottom",
    },
  ];

  const adminSteps: TourStep[] = [
    {
      title: "Dashboard Overview",
      description: "View high-level platform status, registered students count, and action backlogs.",
      targetSelector: '[data-tour="admin-overview"]',
      placement: "bottom",
      onEnter: async () => {
        const btn = document.querySelector('button[data-tour-tab="students"]');
        if (btn) (btn as HTMLButtonElement).click();
      },
    },
    {
      title: "Pending Student Approvals",
      description: "Review registrations and approve/reject users to grant them platform credentials.",
      targetSelector: '[data-tour="admin-students"]',
      placement: "top",
      onEnter: async () => {
        const btn = document.querySelector('button[data-tour-tab="students"]');
        if (btn) (btn as HTMLButtonElement).click();
      },
    },
    {
      title: "Assignments Tab",
      description: "Draft, release, modify, and delete course work materials with coins and subjects.",
      targetSelector: '[data-tour="admin-assignments"]',
      placement: "top",
      onEnter: async () => {
        const btn = document.querySelector('button[data-tour-tab="assignments"]');
        if (btn) (btn as HTMLButtonElement).click();
      },
    },
    {
      title: "Submission Tracker",
      description: "Track all student files and answers, organized by status and resubmission counters.",
      targetSelector: '[data-tour="admin-submissions"]',
      placement: "top",
      onEnter: async () => {
        const btn = document.querySelector('button[data-tour-tab="submissions"]');
        if (btn) (btn as HTMLButtonElement).click();
      },
    },
    {
      title: "Review Actions",
      description: "Evaluate work. Grant rewards upon approval, or require revisions with text feedback.",
      targetSelector: '[data-tour="admin-actions"]',
      placement: "top",
      onEnter: async () => {
        const btn = document.querySelector('button[data-tour-tab="submissions"]');
        if (btn) (btn as HTMLButtonElement).click();
      },
    },
    {
      title: "Analytics",
      description: "Inspect completion indices, score metrics, and visual success summaries.",
      targetSelector: '[data-tour="admin-analytics"]',
      placement: "top",
      onEnter: async () => {
        const btn = document.querySelector('button[data-tour-tab="analytics"]');
        if (btn) (btn as HTMLButtonElement).click();
      },
    },
    {
      title: "Admin Settings Menu",
      description: "Manage credentials, system profiles, and reset this administrator walk-through.",
      targetSelector: '[data-tour="admin-profile-trigger"]',
      placement: "bottom",
    },
  ];

  const steps =
    activeTour === "landing"
      ? landingSteps
      : activeTour === "student"
        ? studentSteps
        : activeTour === "admin"
          ? adminSteps
          : [];

  // 2. Trigger active step transition hooks
  useEffect(() => {
    if (isActive && steps[currentStep]) {
      const step = steps[currentStep];
      if (step.onEnter) {
        // Allow transitions to execute
        Promise.resolve(step.onEnter(navigate)).catch(console.error);
      }
    }
  }, [currentStep, isActive, activeTour]);

  // 3. Detect and trigger tours on load
  useEffect(() => {
    // Only proceed once router path changes
    const path = routerState.location.pathname;

    if (path === "/") {
      const skipped = localStorage.getItem("assignhub_onboarding_completed");
      if (!skipped) {
        setShowWelcome(true);
      }
    } else if (path.startsWith("/dashboard") || path.startsWith("/student")) {
      if (user && role === "student" && profile?.status === "approved") {
        const studentSkipped = localStorage.getItem("assignhub_student_tour_completed");
        if (!studentSkipped && !isActive && !showWelcome && !showCompletion) {
          // Auto start student dashboard tour
          setActiveTour("student");
          setCurrentStep(0);
          setIsActive(true);
        }
      }
    } else if (path.startsWith("/admin")) {
      if (user && role === "admin") {
        const adminSkipped = localStorage.getItem("assignhub_admin_tour_completed");
        if (!adminSkipped && !isActive && !showWelcome && !showCompletion) {
          // Auto start admin dashboard tour
          setActiveTour("admin");
          setCurrentStep(0);
          setIsActive(true);
        }
      }
    }
  }, [routerState.location.pathname, user, role, profile]);

  const startTour = (type: TourType) => {
    setActiveTour(type);
    setCurrentStep(0);
    setIsActive(true);
    setShowWelcome(false);
    setShowCompletion(false);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Completed last step
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const skipTour = (dontShowAgain = false) => {
    setIsActive(false);
    setActiveTour(null);
    setCurrentStep(0);
    setShowWelcome(false);

    if (dontShowAgain || activeTour) {
      const key =
        activeTour === "landing"
          ? "assignhub_onboarding_completed"
          : activeTour === "student"
            ? "assignhub_student_tour_completed"
            : "assignhub_admin_tour_completed";
      localStorage.setItem(key, "true");
    }
  };

  const finishTour = () => {
    setIsActive(false);
    setShowCompletion(true);

    const key =
      activeTour === "landing"
        ? "assignhub_onboarding_completed"
        : activeTour === "student"
          ? "assignhub_student_tour_completed"
          : "assignhub_admin_tour_completed";
    localStorage.setItem(key, "true");
  };

  const closeWelcome = (dontShowAgain = false) => {
    setShowWelcome(false);
    if (dontShowAgain) {
      localStorage.setItem("assignhub_onboarding_completed", "true");
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
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
        finishTour,
        closeWelcome,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used within OnboardingProvider");
  return context;
}
