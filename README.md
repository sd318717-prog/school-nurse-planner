# המתכננת שלי — אב טיפוס

Next.js + Supabase starter for a Hebrew, RTL school-nursing work planner.

## Included in this first scaffold
- Responsive Hebrew interface for desktop and mobile.
- Supabase email/password sign-in and sign-up.
- Schools directory.
- Activities list and create/complete actions.
- Personal notes/reminders/tasks.
- Editable school-opening checklist stored per school and school year.
- SQL schema with Row Level Security policies scoped to the signed-in user.

## Not yet implemented
- Automatic preparation-task chains when activities are created/rescheduled.
- Class/parallel-class structure and annual coverage calculations.
- Complete goal dashboard (the opening coverage number is a placeholder).
- Monthly calendar grid and Excel/PDF export.
- Automated Google Drive backups and tested restore flow.
- Production-grade account recovery, email templates, and detailed error handling.

## 1. Create Supabase project
1. Create a project at https://supabase.com.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Project Settings > API, copy the Project URL and the publishable/anon key.
4. Copy `.env.example` to `.env.local` and fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Never put the `service_role` key in browser code or in a `NEXT_PUBLIC_` variable.

## 2. Run locally
Install Node.js LTS, then in this folder run:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## 3. Deploy to Vercel
1. Push this folder to a private GitHub repository.
2. In Vercel choose Add New > Project and import the repository.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under Project Settings > Environment Variables.
4. Deploy.
5. In Supabase Authentication settings, configure the Site URL and allowed redirect URLs for your Vercel domain.

## Important notes
- This is a starter scaffold, not a finished production system.
- The opening checklist currently saves one checklist per school/year; edits affect that saved checklist. Before using it operationally, we should add template versioning so future checklist changes do not overwrite historical records.
- No student names or medical information should be entered. Use dummy data during testing.
- Supabase Free projects may pause when inactive and do not include automatic database backups. Set up an independent backup and test restoration before relying on the system for daily work.
- Google Drive backup is not configured in this scaffold yet.
