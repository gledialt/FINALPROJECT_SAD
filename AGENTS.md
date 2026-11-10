<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Ordinary signup always receives the baseline role; admin-created account roles are atomically assigned through a service-role-only function after an active-admin server check, so old email reservations cannot elevate new signups.
- Residential fields are collected and displayed only for resident accounts, with server-side omission for staff invitations.
- Each account has one effective role; admin role changes use an atomic database function to replace role rows because the existing table's unique key includes both user and role.

- Role helpers and database policies permit officer CRUD only for announcements, schedules, and locations; processes, guides, and user administration remain admin-only to match the restricted officer scope.
- All authenticated roles share one shell with a bottom tab bar (tabs from bottomNavSections); other features are reached from tiles on Beranda, keeping navigation minimal.
- Location maps use client-loaded Leaflet with Esri satellite imagery and an external Google Maps link, so multiple locations share an interactive map without requiring an API key.
- Profile edits update only the current user through browser RLS, while password changes open in a dialog to keep account details uncluttered.
- Sorting guide content is stored in shared RLS-protected rows, displayed on Beranda for everyone and edited on /panduan by admins only.
- Schedules support optional calendar dates alongside legacy weekly recurrence; shared date helpers drive sorting and labels consistently.
- Location editing uses a separate client-loaded Leaflet point picker with click and draggable-marker selection, so unsaved coordinates remain in the form until saved.
- Avatars are stored as small resized JPEG data URLs on profiles because the workspace blocks public storage buckets.
- Editable free-text blocks (e.g. location info banner) live in the app_info key/value table, writable by admin and petugas.
- "Ingat saya" is enforced client-side: unchecked logins set a session-only marker and the auth gate signs out when it is missing.
- Schema changes are applied as drizzle/migrations files (the migration tool replays them), so always write deltas, never full schema.

- Admins create accounts with supplied passwords through an active-admin server function; plaintext credentials are never persisted or returned. Profile deletion triggers clean reserved roles and activation history to prevent email reuse inheriting privilege.
- The public /lupa-password flow uses Cloud Auth recovery OTP then updateUser without current_password; /reset-password retains legacy link compatibility. Code-only auth email templates require a configured sender domain and managed scaffolding.
- The authenticated shell shows a 'Kembali ke Beranda' link on every non-tab page and, for admin/petugas on desktop, a sidebar replacing the bottom nav.