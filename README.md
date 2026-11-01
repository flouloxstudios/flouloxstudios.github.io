# FlouLox Studios website

Static site served by GitHub Pages at https://flouloxstudios.github.io/ (repository
`flouloxstudios/flouloxstudios.github.io`). No build step: edit the files and push to `main`.

- `index.html`: studio home page, with a card for every game.
- `scrap-surge/index.html`: the Scrap Surge page (with a small playable demo, `assets/js/surge-demo.js`).
- `scrap-surge/privacy.html`: Scrap Surge privacy policy.
- `privacy/index.html`: list of game policies, plus the website's own privacy note.
- `404.html`: shown by GitHub Pages for any unknown address.
- `assets/`: shared styles, scripts, self-hosted fonts (SIL Open Font License) and studio images.
- `app-ads.txt`: to be added at the root once the AdMob publisher ID is known.

**Do not move `scrap-surge/privacy.html`.** The game's Settings and the store listings link to this exact address.

## Adding a game

1. Create a folder named after the game with its own `index.html` (copy `scrap-surge/index.html`) and `privacy.html`.
2. Add a card to the Games section of `index.html` (copy the `game-feature` article).
3. Add its policy to `privacy/index.html`, its pages to `sitemap.xml` and a link to the footers.

## When Scrap Surge goes live

Replace the "Coming soon" status lines on the home page and in `scrap-surge/index.html` with a link to
https://play.google.com/store/apps/details?id=com.flouloxstudios.scrapsurge

Commits here use the studio identity (`git config user.name "FlouLox Studios"`), set locally in this repository.
