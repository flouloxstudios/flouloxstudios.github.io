# FlouLox Studios website

Static site served by GitHub Pages at https://flouloxstudios.com/ (repository
`flouloxstudios/flouloxstudios.github.io`; the old https://flouloxstudios.github.io/ address redirects there).
The domain is registered and its DNS managed at Cloudflare; `CNAME` holds the custom domain for GitHub Pages.
No build step: edit the files and push to `main`.

- `index.html`: studio home page (hero, games showcase, about + journey timeline, contact form).
- `scrap-surge/index.html`: the Scrap Surge page (hero phones, Mission Control, gameplay stories, a small playable demo in `assets/js/surge-demo.js`, screenshots, support).
- `scrap-surge/privacy.html`: Scrap Surge privacy policy.
- `privacy/index.html`: list of game policies, plus the website's own privacy note.
- `404.html`: shown by GitHub Pages for any unknown address.
- `assets/css/site.css`: every style. Colours, gradients, type, spacing, radii and motion timings are tokens at the top.
- `assets/js/site.js`: all shared behaviour. Each part only runs when its markup is on the page.
- `assets/img/`: logo (`emblem.webp`, `emblem-sm.webp`, `wordmark.webp`, cut from the fox logo), favicon and app icons, the hero art (`hero.webp`), share image (`og.jpg`) and `icons.svg` (the icon sprite, used as `<use href="/assets/img/icons.svg#name">`). To swap the logo or hero art, replace those files keeping their names.
- `assets/fonts/`: self-hosted fonts (SIL Open Font License): Newsreader (headlines), Hanken Grotesk (text), Chakra Petch (labels, game pages).
- `app-ads.txt`: AdMob's authorised seller line. It must stay at the root of the site listed as the app's website.

**Do not move `scrap-surge/privacy.html`.** The game's Settings and the store listings link to this exact address.

## Shared header and footer

The header and footer live once in `tools/partials/`. After editing them, run `python tools/sync.py` from the
repository root; it copies them into every page between the `<!-- header -->` / `<!-- footer -->` markers.

## Contact form

The site is static, so by default the form opens the visitor's email app with the message filled in. To send
messages directly, create a form with a service such as Formspree, put its URL in the form's `data-endpoint`
attribute in `index.html`, and mention that service in `privacy/index.html`.

## Adding a game

1. Create a folder named after the game with its own `index.html` (copy `scrap-surge/index.html`) and `privacy.html`.
2. Add a slide to the games showcase in `index.html` (copy the Scrap Surge `<li class="slide game">`, newest first). Arrows and dots appear by themselves once there is more than fits.
3. Add its policy to `privacy/index.html`, its pages to `sitemap.xml`, a link in `tools/partials/footer.html` (then run the sync), and a milestone to the journey timeline.

## When Scrap Surge goes live

Replace the "Coming soon" status pills on the home page and in `scrap-surge/index.html` with a "Get it on Google Play" link to
https://play.google.com/store/apps/details?id=com.flouloxstudios.scrapsurge

Commits here use the studio identity (`git config user.name "FlouLox Studios"`), set locally in this repository.
