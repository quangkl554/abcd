# Xoso Public Web

Next.js + Supabase web app for entering, correcting, checking, and reporting lottery tickets for `nam`, `trung`, and `bac`.

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project and run `supabase/migrations/202605260001_init.sql`.
3. Fill Supabase URL, anon key, and service role key.
4. Install dependencies:

```powershell
npm.cmd install
```

5. Create the first admin:

```powershell
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="your-password"
npm.cmd run create-admin
```

6. Run locally:

```powershell
npm.cmd run dev
```

## Deploy

Deploy this folder to Vercel. Add the same env vars in Vercel project settings. Supabase stores users and data; Vercel runs the Next.js frontend and API routes.

## Notes

- n8n and Telegram are intentionally not part of this web version.
- Users cannot sign up publicly. Admin users create accounts in `/admin`.
- Each user owns their own players, tickets, parse issues, and draw results.
