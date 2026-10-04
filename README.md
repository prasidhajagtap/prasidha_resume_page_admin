# Prasidha Jagtap — site stats (admin page)

Designed & developed by **Prasidha Jagtap**. © 2026 Prasidha Jagtap — all rights reserved (see [`LICENSE`](LICENSE)).

**Admin page:** https://prasidhajagtap.github.io/prasidha_resume_page_admin/
**The website it reports on:** https://prasidhajagtap.github.io/prasidha_jagtap/ (repository `prasidhajagtap/prasidha_jagtap`)

This is the private stats dashboard for Prasidha Jagtap's personal website. It is for the owner's use only. It shows visits, unique visitors, 👍/👎 votes, feedback answers and clicks on *“Want a website of your own?”*.

The repository is public only because free GitHub Pages needs it. That is safe: the page holds **no secrets and no data**. Everything is read live from the database after sign-in, and the database lets **only the admin email** read anything. Anyone else who finds the page sees just a sign-in box that will never let them in. Search engines are told not to index it (`noindex, nofollow, noarchive`).

---

## Contents

1. [What the page shows](#1-what-the-page-shows)
2. [How to use it](#2-how-to-use-it)
3. [How the whole system fits together](#3-how-the-whole-system-fits-together)
4. [Files in this repository](#4-files-in-this-repository)
5. [What each number means](#5-what-each-number-means)
6. [The database it reads (Supabase)](#6-the-database-it-reads-supabase)
7. [Sign-in and security](#7-sign-in-and-security)
8. [How to make changes and publish](#8-how-to-make-changes-and-publish)
9. [Setting everything up from zero](#9-setting-everything-up-from-zero)
10. [Troubleshooting](#10-troubleshooting)
11. [Licence](#11-licence)

---

## 1. What the page shows

The page has three screens:

| Screen | When |
|---|---|
| **Almost there** | `site-config.js` on the main site has no Supabase URL/key yet. |
| **Admin sign-in** | Not signed in. Enter the admin email and you get a one-time sign-in link. |
| **Site stats** | Signed in as the admin. |

On **Site stats**:

- **Tiles:**
  - **Page views**: every page open
  - **Visits**: browser sessions
  - **Unique visitors**: different browsers, all time, plus how many *came back more than once*
  - **Liked 👍**: with *% of votes* that were 👍
  - **Not liked 👎**
  - **Today**: today's views and visitors (India time)
  - **Website interest ✨**: *Want a website?* page opened
  - **Enquiries sent ✉️**: *Send enquiry / Gmail / Outlook* tapped, with *% of those who opened it*
- **Page views per day, last 30 days:** a bar chart. Hover or focus a bar for views, visits and visitors. **Show as a table** gives the day-by-day numbers: Views, Visits, Visitors, 👍, 👎, ✨ Opened, ✉️ Sent, Yours.
- **Feedback:**
  - A summary card per question with counts: *Who visits*, *What stood out (👍)*, *Want to connect (👍)*, *What would make it better (👎)*, *Where to start (👎)*
  - The latest 50 answers, each with its vote, time, answers and optional note
- **Include my own visits:** a switch, remembered on this browser.
- **Buttons:** **Refresh**, **Sign out**, and the light/dark switch.

---

## 2. How to use it

1. Open https://prasidhajagtap.github.io/prasidha_resume_page_admin/
2. Enter the admin email and click **Send sign-in link**. The button then rests for 60 seconds.
3. Open the email and tap the link **on the same device and browser**.
4. The stats appear. Use **Refresh** for the latest numbers.
5. **Sign out** when you are done on a shared device.

**Your own visits are recognised automatically.** Any browser where you open this page is marked as yours (`localStorage pj_owner = 1`, on the shared `prasidhajagtap.github.io` address). From then on, your visits to the main site on that browser are kept out of the numbers. Your enquiry clicks there are not counted at all. Open this page once on each phone or laptop you use, and nothing else is needed.

---

## 3. How the whole system fits together

```
Visitors ──► Main website  https://prasidhajagtap.github.io/prasidha_jagtap/
               (repo prasidhajagtap/prasidha_jagtap, GitHub Pages)
               │ calls only: record_visit · record_vote · submit_feedback · record_build · ping
               ▼
           Supabase database (project vibbknwnszoescejukud, free plan)
               ▲ reads totals (admin email only, row-level security)
               │
Owner ────► This admin page  https://prasidhajagtap.github.io/prasidha_resume_page_admin/
               (this repo, GitHub Pages) — one-time email link sign-in

GitHub Actions in the main repo pings Supabase every 3 days so the free project never pauses.
```

| Part | Where it lives | Cost |
|---|---|---|
| Public website | `prasidhajagtap/prasidha_jagtap` → GitHub Pages | Free |
| This admin page | `prasidhajagtap/prasidha_resume_page_admin` → GitHub Pages | Free |
| Database + sign-in | Supabase free plan | Free |
| Keep-awake job | GitHub Actions in the main repo (`.github/workflows/supabase-keepalive.yml`) | Free |

### Files this page borrows from the main site
To keep one look and one set of settings, `index.html` loads these from the main website (same address, so they are allowed by the security policy):

| File | Why |
|---|---|
| `/prasidha_jagtap/style.css` | Same fonts, colours, light/dark, depth shadows |
| `/prasidha_jagtap/theme-init.js` | Light/dark without a flash, and frame (clickjacking) protection |
| `/prasidha_jagtap/site-config.js` | Public Supabase URL and anon key |

If the main site's repository or folder name ever changes, update these three paths in `index.html`.
They carry the same `?v=` number as the main site (currently `v=37`). Whenever the main site raises its number, raise it here too, so this page never shows an old copy of the shared look.

---

## 4. Files in this repository

| File | What it is |
|---|---|
| `index.html` | The three screens (setup, sign-in, stats), strict Content-Security-Policy, `noindex` robots tag, `no-referrer` policy. |
| `admin.js` | Sign-in (one-time email link), session handling and token refresh, reading the data, tiles, chart, table, feedback summary/list, own-visit marking, light/dark switch. |
| `admin.css` | Dashboard layout: tiles (4 columns wide, 2 on phones), chart, tooltip, table (scrolls sideways on phones), feedback cards. |
| `.nojekyll` | Tells GitHub Pages to serve files as they are. |
| `LICENSE` | All rights reserved. |

**Cache version:** `admin.css?v=4` and `admin.js?v=5`. Raise the number whenever those files change.

---

## 5. What each number means

| Number | Meaning |
|---|---|
| Page view | One page open of the main website. |
| Visit | A browser session. A new one starts in a new tab session or after 30 minutes idle. |
| Unique visitor | One different browser. Each browser makes a random ID; only a one-way hash of it is stored. No sign-in or personal data is involved. |
| Came back | Browsers with more than one visit. |
| 👍 / 👎 | Votes on *“Enjoying the profile?”*. Each browser is asked only once. |
| Feedback answers | Short answer codes from fixed lists, plus an optional note of up to 300 characters. |
| Website interest ✨ | The *Want a website of your own?* page was opened. Counted at most once per page load. |
| Enquiries sent ✉️ | *Send enquiry*, *Gmail* or *Outlook* was tapped. This means the button was tapped, not that the email was really sent; your inbox shows the real enquiries. |
| Yours | Your own page opens, from browsers where you opened this admin page. |

- **Days** are counted in India time (Asia/Kolkata).
- **Never counted:** your own browsers (except in *Yours*) and automated browsers.

**Spam limits** (per network, enforced in the database; over a limit, the call quietly does nothing). The network is taken from `cf-connecting-ip`, set by Supabase's Cloudflare edge, which a visitor cannot fake:

| Action | Limit |
|---|---|
| Page views | 60 per 10 minutes |
| New browser IDs | 20 per day |
| Votes | 3 per day |
| Feedback forms | 3 per day |
| Enquiry opens / sends | 5 each per day |

---

## 6. The database it reads (Supabase)

- **Project:** `vibbknwnszoescejukud` (`https://vibbknwnszoescejukud.supabase.co`)
- **Full setup file:** `supabase/setup.sql` in the main repository, `prasidhajagtap/prasidha_jagtap`. Run it in **Supabase → SQL Editor → New query → Run**, after replacing `YOUR_ADMIN_EMAIL`. It is safe to run again (it upgrades in place).

### Tables
| Table | Holds | This page reads it? |
|---|---|---|
| `site_daily` | One row per day: `views`, `visits`, `visitors`, `new_visitors`, `likes`, `dislikes`, `own_views`, `build_opens`, `build_sends` | Yes (`select=*`, so an older database without newer columns still loads) |
| `site_feedback` | Vote, answer codes (JSON), note, time | Yes (latest 200) |
| `site_visitors` | One row per hashed browser ID (first/last seen, views, visits, own) | Only through `site_summary()` |
| `site_visitor_days` | Which browsers came on which day | No |
| `site_hits` | Short-lived anti-spam log (hashed network), deleted after 2 days | No |
| `site_admins` | Admin email(s) allowed to read | No |

### Functions
| Function | Who may call | Does |
|---|---|---|
| `site_summary()` | admin only | All-time unique, returning and own browsers (used by this page) |
| `is_site_admin()` | signed-in users | Checks the signed-in email against `site_admins` |
| `record_visit(vid, new_visit, own)` | visitors (main site) | Counts a page open / visit / unique browser |
| `record_vote(vote)` | visitors | Adds 👍 or 👎 |
| `submit_feedback(vote, answers, note)` | visitors | Saves cleaned feedback (unknown answers dropped) |
| `record_build(step)` | visitors | Counts enquiry `open` / `send` |
| `ping()` | visitors | Returns 1, used by the keep-awake job |
| `ip_key_check()` | visitors | Harmless self-test: shows the caller fingerprints of their own address headers only |

### Supabase settings that must stay this way
- **Authentication → Sign In / Providers:** “Allow new users to sign up” is **off**.
- **Authentication → URL Configuration:**
  - **Site URL:** `https://prasidhajagtap.github.io/prasidha_jagtap/`
  - **Redirect URLs** must include `https://prasidhajagtap.github.io/prasidha_resume_page_admin/`. Without it, the sign-in link will not come back to this page.
- **Authentication → Users:** only the admin user.

---

## 7. Sign-in and security

- **No password.** Sign-in is a one-time email link (`/auth/v1/otp` with `create_user: false`), so there is nothing to guess or brute-force.
  - The same message is shown whether or not the email exists, so the page never reveals who the admin is.
  - The send button rests 60 seconds between requests, and Supabase limits sign-in emails too.
- **Where the session lives.** Tokens are kept in `sessionStorage` only, so they are gone when the browser tab session ends. They are removed from the address bar right after sign-in, refreshed automatically, and cleared on **Sign out** or when they expire.
- **Who can read data.** The database checks the signed-in email against `site_admins` (row-level security). Visitors and other signed-in users get nothing.
- **Strict Content-Security-Policy:**
  - only this site's own files and the Supabase API may load
  - no inline scripts and no third-party code
  - `form-action 'none'`, `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`
- **Other protections:**
  - **Frame protection** via the main site's `theme-init.js`.
  - **`no-referrer`:** the address of this page is not leaked to other sites.
  - **Feedback notes are shown as plain text** (`textContent`), so a note that contains code can never run.
- **Keys:**
  - The Supabase **anon key** (in the main site's `site-config.js`) is public by design.
  - **Never** put the `service_role` / secret key in this repository or the main one.
- **Accounts:** keep **two-factor authentication** on GitHub and Supabase.
- **The admin URL:** keep it to yourself. Even if someone finds it, they cannot sign in.

---

## 8. How to make changes and publish

1. Edit `index.html`, `admin.js` or `admin.css`.
2. Raise `?v=` on `admin.css` / `admin.js` in `index.html` when they change.
3. **Test locally** by serving a folder that contains both repositories side by side, so the shared `/prasidha_jagtap/...` files resolve:
   ```
   pagesroot/
     prasidha_jagtap/              → the main site repo
     prasidha_resume_page_admin/   → this repo
   ```
   Run `python3 -m http.server 8000` inside `pagesroot`, then open `http://localhost:8000/prasidha_resume_page_admin/`.
   Signing in locally needs `http://localhost:8000/prasidha_resume_page_admin/` added to Supabase Redirect URLs. Remove it afterwards.
4. Commit and push to `main`. GitHub Pages publishes in about 1–2 minutes (**Settings → Pages → Deploy from a branch → `main` / root**).
5. If a new number is added on the main site, three places change together:
   - add the column or function in `supabase/setup.sql` (main repo) and run it in Supabase
   - make the main site send it
   - show it here (tile in `index.html`, logic in `admin.js`)

---

## 9. Setting everything up from zero

1. **Main website:** publish `prasidhajagtap/prasidha_jagtap` with GitHub Pages (`main` / root).
2. **Supabase:**
   - create a free project
   - **SQL Editor:** run the main repo's `supabase/setup.sql`, with your admin email filled in
   - **Authentication → Users → Add user:** add the admin email
   - turn **off** sign-ups
   - set the **Site URL** and **Redirect URLs** as in [section 6](#6-the-database-it-reads-supabase)
3. **Connect:** put the project URL and **anon/public** key into the main site's `site-config.js`.
4. **This page:** create this repository (public), add these files, and enable **Settings → Pages → Deploy from a branch → `main` / root**.
5. Open the admin URL on each of your devices once, so your own visits are recognised.
6. Turn on **two-factor authentication** for GitHub and Supabase.

---

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| “Almost there” screen | The main site's `site-config.js` is empty or not reachable. Check that the main site is live. |
| No email arrives | Check spam. Wait 60 s and try again. Make sure the email is the admin user in Supabase. |
| “That sign-in link has expired or was already used” | Links work once and for a short time. Ask for a new one and open it on the same device. |
| Link opens the main site instead of this page | Add this page's address to **Supabase → Authentication → URL Configuration → Redirect URLs**. |
| “Could not load the numbers” | Press **Refresh**. If it continues, check the Supabase project isn't paused, and that `setup.sql` was run. |
| Numbers are all 0 | Normal before the first real visit. Your own visits are hidden unless *Include my own visits* is on. |
| Enquiry tiles stay 0 | Clicks from your own browsers aren't counted. Check that `record_build` exists (run `setup.sql`). |
| Supabase paused | Restore it in the Supabase dashboard. Check the main repo's *Keep Supabase awake* job in Actions. |
| Change not showing | Wait 2 minutes, raise `?v=`, hard-refresh. |

---

## 11. Licence

All rights reserved. No reuse without written permission (see [`LICENSE`](LICENSE)).
