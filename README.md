# Employee Testing & Training App

A premium, modern web application for employee assessment and educational material management.

## 🚀 Features

- **Premium UI**: Advanced glassmorphism, bento grid layout, smooth animations, and mesh gradients.
- **Role-based Access**: Separate dashboards for Employees and Administrators.
- **Educational Materials**: Study articles with a built-in read-timer to ensure employees don't skip content.
- **Smart Testing**: Shuffled questions, time limits, passing scores, and instant feedback.
- **Admin Dashboard**: Create tests, manage articles, and track employee progress/results.

## 🛠 Tech Stack

- **Frontend**: React (Vite)
- **Styling**: Vanilla CSS (Modern CSS variables + glassmorphism)
- **Backend/DB**: Supabase (PostgreSQL)
- **Deployment**: Vercel ready

## 📦 Getting Started

1. **Clone the repo**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   - Rename `.env.example` to `.env`.
   - Fill in your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. **Database Setup**:
   - Run the provided SQL scripts in your Supabase SQL Editor to initialize the schema and fix deletion policies.
5. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🔒 Security

Row-level Security (RLS) is enabled via Supabase to protect data and ensure only authorized roles can manage content.
