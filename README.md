# Pagebrief: Website Speed Check

**Live site: https://pagebrief-iota.vercel.app**

Paste any website address and get a plain-English report on **speed, mobile, search (SEO) and accessibility**. A business owner checks their site, sees the problems ranked by how much they cost, and can request a free fix plan.

A **JVA** project, designed and built by [Jian Vaile Aguilos](https://jianaguilos.vercel.app).

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run deploy    # optional: publish to GitHub Pages instead of Vercel
```

## Setup

Copy `.env.example` to `.env` and fill it in:

```bash
# Required for live checks
VITE_PSI_KEY=your-google-api-key

# Where "Send me a fix plan" requests go (pick one; leave both empty for demo mode)
VITE_FORM_ENDPOINT=https://formsubmit.co/ajax/you@example.com
VITE_CONTACT_EMAIL=you@example.com
```

On Vercel, add the same values under **Settings > Environment Variables** and redeploy. They are built into the site, so a redeploy is needed after any change.

### Fix-plan requests (FormSubmit)
Requests are delivered by [FormSubmit](https://formsubmit.co), which needs no account. The first request sends an activation email to the address in `VITE_FORM_ENDPOINT`; click the link once and every request after that arrives as a formatted email. FormSubmit then offers a random alias you can use in place of the email address.

### Getting the free API key
1. Go to https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com and click **Enable**.
2. Go to **APIs & Services > Credentials > Create credentials > API key**.
3. Edit the key: under **Application restrictions** choose **Websites** and add your site (for example `https://jianvaileaguilos-gif.github.io/*` and `http://localhost:*`). Under **API restrictions**, limit it to **PageSpeed Insights API**.

The key is visible in the site's code, which is normal for this API. The website restriction stops other sites from using it. The free quota is 25,000 checks a day.

Without a key, checks use Google's shared public quota. It is often used up, in which case visitors see a friendly message and a link to the sample report.

## How it works

- `src/psi.js` calls the Google PageSpeed Insights API (Lighthouse) for the address.
- `src/report.js` turns the result into plain language: scores, a one-line verdict, timings against Google's targets, and issues ranked by likely cost, each marked "You can usually fix this" or "Needs a developer". It has no browser code, so it also runs in Node.
- `src/render.js` draws the report: score rings, a real loading filmstrip on a time axis, the final screenshot in a device frame, the fix list, and the lead form.
- The **Mobile** score is Pagebrief's own: a weighted mix of four phone checks from Lighthouse (viewport, tap target size, layout shift, image sharpness).
- The sample report is a real Lighthouse run on fufld.com, stored slimmed in `public/sample/`.

Other features: phone and computer views, "Save as PDF" (print layout), shareable links (`?url=...`), light and dark themes, reduced-motion support, and full keyboard access.

## Credits

- Design and development: Jian Vaile Aguilos, [JVA](https://jianaguilos.vercel.app)
- Data: Google PageSpeed Insights / Lighthouse. Pagebrief is not affiliated with Google.
- Photography (Unsplash License):
  - Shop owner with tablet, Vitaly Gariev: https://unsplash.com/photos/sh6bfHZeaNY
  - Café owner with open sign, Vitaly Gariev: https://unsplash.com/photos/bG2ZJAe-AbU
  - Hands typing on a phone, freestocks: https://unsplash.com/photos/mw6Onwg4frY
  - Woman with laptop in garden, Centre for Ageing Better: https://unsplash.com/photos/pm5V4RP2zN4
- Fonts: Bricolage Grotesque, Geist, Geist Mono (SIL Open Font License) via Fontsource
- Icons: Phosphor Icons (MIT)
- Statistics: [Google, mobile page speed benchmarks](https://www.thinkwithgoogle.com/marketing-strategies/app-and-mobile/mobile-page-speed-new-industry-benchmarks/), [WHO disability fact sheet](https://www.who.int/news-room/fact-sheets/detail/disability-and-health), [Google mobile-first indexing](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing)
