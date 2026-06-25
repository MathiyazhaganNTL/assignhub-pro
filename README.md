# 🎓 AssignHub — Controlled-Access EdTech Platform

AssignHub is a modern, gamified, and access-controlled assignment management platform designed for colleges, coaching centers, training institutes, and hiring programs. 

Unlike generic Learning Management Systems (LMS), AssignHub operates on an **access-first** model: students register to request access, and their dashboards only unlock once an administrator has manually approved their profile.

---

## 🚀 Key Features

### 🔒 Controlled Access & Security
*   **Approval Queue**: New student registrations are directed to a pending queue. Administrators review and approve/reject profiles before any platform content is exposed.
*   **Role-Based Security**: Complete separation of concerns between `student` and `admin` roles, secured natively at the database level via Supabase Row Level Security (RLS) policies.
*   **Controlled Storage**: Safe storage for assignment files and student submissions with custom role-based bucket access.

### 📝 Assignment Lifecycle & Review
*   **Multi-Format Publishing**: Admins can publish assignments with descriptions, deadlines, and contents as PDFs, links, or rich-text format.
*   **Submission Workflow**: 
    *   `submitted` ➔ `under_review` ➔ `approved` or `rejected` (requires revision).
    *   **Resubmission Limits**: Enforced cap of **2 resubmission attempts** for rejected assignments, managed at the database level.
    *   **Revision Feedback**: Admins can leave specific review comments to guide students through revisions.

### 🎮 Gamification & Engagement Engine
*   **Points & Coins Rewards**: Student submissions are graded and awarded EXP (Points) and Coins.
*   **Leveling System**: Students level up automatically as they accumulate points and coins.
*   **Leaderboard**: Dynamic, real-time leaderboard ranking approved students based on their total earned points.
*   **Achievements (Badges)**: Automated unlocking of achievements such as:
    *   🌅 **Early Bird**: Submitted before the deadline.
    *   🔥 **Streak 3**: Handed in 3 assignments in a row.
    *   🎯 **On Track**: Maintained assignment consistency.
    *   🏆 **Top Performer**: Reached the top 10 on the leaderboard.
*   **Activity Logs**: Audit trail showing all submissions, grades, and achievement awards.

### 🔔 Real-Time Notifications
*   Driven by Supabase Realtime, users receive instant in-app notifications for critical status changes:
    *   Account approvals and rejections.
    *   New assignments uploaded.
    *   Submissions transitioning to review, approval, or revision.
    *   Warnings when reaching resubmission limits.

---

## 🛠️ Technology Stack

| Layer | Technology |
| --- | --- |
| **Frontend Framework** | React 19 & TypeScript |
| **Meta-Framework & Routing** | [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) (Server-side rendering, file-based routing) |
| **State Management** | [TanStack Query](https://tanstack.com/query/latest) (React Query) |
| **Styling** | Tailwind CSS |
| **Database & Realtime** | [Supabase](https://supabase.com) (PostgreSQL) |
| **Authentication** | Supabase Auth (Email/Password) |
| **Storage** | Supabase Storage (S3-compatible) |
| **UI Components** | Shadcn UI & Lucide Icons |

---

## 📁 Database Schema Overview

AssignHub runs on a highly structured PostgreSQL database schema managed through Supabase migrations:

*   **`profiles`**: User metadata, status (`pending`, `approved`, `rejected`), roll number, and department.
*   **`user_roles`**: Links users to their roles (`admin` or `student`).
*   **`assignments`**: Holds assignment metadata, deadlines, subject relationships, and reward configurations (`max_coins`, `daily_reduction`).
*   **`submissions`**: Tracks student responses, file attachments, and grading statuses (`submitted`, `under_review`, `approved`, `rejected`, `resubmitted`), review comments, and attempt counts.
*   **`subjects`**: Subject registry (e.g., *Database Management Systems*, *Operating Systems*, etc.).
*   **`user_points` / `user_coins`**: Stores current levels and cumulative totals for gamification.
*   **`achievements` / `user_achievements`**: Defines badges and maps earned achievements to students.
*   **`notifications`**: Realtime in-app notification records.
*   **`activity_logs`**: Detailed logs of user actions.

---

## 💻 Getting Started

### Prerequisites
*   Node.js (v18+) or [Bun](https://bun.sh/)
*   A Supabase Project (Database, Auth, and Storage buckets)

### Local Configuration
1.  Clone the repository and install dependencies:
    ```bash
    bun install
    # or
    npm install
    ```
2.  Set up your local environment file: Create a `.env` file in the root directory and configure the following variables:
    ```env
    VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key-here
    ```

3.  Apply Database Migrations:
    You can run the SQL migration scripts located in [supabase/migrations](file:///g:/assignhub-pro/supabase/migrations) directly in your Supabase SQL editor or run them via the Supabase CLI.

### Running Locally
To launch the TanStack Start development server:
```bash
bun dev
# or
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🚀 Deployment

The project is preconfigured to build and deploy as a modern full-stack web application.

### Building for Production
To bundle the application for production:
```bash
bun run build
# or
npm run build
```
This compilation outputs a production-ready server bundle managed via Nitro.
