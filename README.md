# JasaQ

JasaQ connects people who have skills and spare time (students, freelancers) with UMKM that need affordable, flexible services.

Static front-end (plain HTML, CSS and JavaScript, no build step) backed by **Supabase** (Postgres, Auth, Realtime, Storage). Brand color `#3C8FFA`.

**Setup & privacy guide (Bahasa Indonesia): [docs/DATABASE.md](docs/DATABASE.md)**

## Features
- Accounts: sign up / sign in / password reset, with a role (Penyedia Jasa or UMKM)
- Customizable profiles: photo, theme color, banner style (waves / bubbles / plain), headline, bio, skills, links; private phone number visible only to the owner; delete account
- Post services and UMKM requests (stored in the database, editable only by their owner)
- Real-time 1-to-1 chat with unread badges, notifications and read receipts; "Pesan Jasa" and "Ajukan Penawaran" send a chat message
- Animated home page: intro splash, flowing sea hero (waves, bubbles, light rays, fish), scroll reveal and live counters

## Pages
| File | Page |
| --- | --- |
| `index.html` | Home page |
| `jasa.html` / `permintaan.html` | Browse services / UMKM requests with search, filters and sorting |
| `detail.html` | Service or request detail (`?type=jasa\|permintaan&id=…`) |
| `pasang.html` | Post a request or offer a service (login required) |
| `profil.html` | Own profile + editor, or someone else's (`?id=…` or `?u=username`) |
| `pesan.html` | Chat |
| `masuk.html` | Sign in / sign up / reset password |

## Structure
- `supabase/schema.sql`: tables, Row Level Security policies, functions, realtime, storage (run once)
- `supabase/seed.sql`: optional sample listings
- `assets/js/config.js`: Supabase URL + public anon key
- `assets/js/db.js`: data layer; `assets/js/app.js`: UI

## Run locally
Fill in `assets/js/config.js`, then serve the folder (`python3 -m http.server 8000`) and open http://localhost:8000. Add `http://localhost:8000/**` to the Redirect URLs in Supabase if you test email links locally.
