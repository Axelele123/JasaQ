# JasaQ

JasaQ connects people who have skills and spare time (students, freelancers) with UMKM that need affordable, flexible services.

Static website: plain HTML, CSS and JavaScript, with no build step. Brand color `#3C8FFA`.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Landing page: hero, how it works (UMKM / provider), categories, popular services, latest requests, testimonials |
| `jasa.html` | Browse services: search, category / price / available-day filters, sorting |
| `permintaan.html` | Browse UMKM requests: search, category / budget / deadline filters, sorting |
| `detail.html` | Service or request detail (`?type=jasa\|permintaan&id=...`) with order / apply / message modal |
| `pasang.html` | Post a request (UMKM) or offer a service (provider), with validation |
| `masuk.html` | Sign in / sign up with role selection (provider or UMKM) |

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Notes

- Sample data lives in `assets/js/data.js`. New posts and the signed-in user are stored in `localStorage` (front-end demo only, no backend yet).
- Logo: `assets/img/logo.svg` (vector recreation of the Figma logo).
