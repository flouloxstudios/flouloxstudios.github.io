"""Copy the shared header and footer into every page.

The site has no build step: each page is a plain HTML file that GitHub Pages serves as is. The header and
footer live once in tools/partials/. Edit them there, then run `python tools/sync.py` from the repository root
and commit the updated pages.

In a page, the shared blocks sit between marker comments:
    <!-- header current=games -->  ...  <!-- /header -->
    <!-- footer -->  ...  <!-- /footer -->
`current` (home, games, about, contact or none) marks the matching nav link as the current page.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PARTS = ROOT / "tools" / "partials"
PAGES = ["index.html", "scrap-surge/index.html", "scrap-surge/privacy.html", "privacy/index.html", "404.html"]

header = (PARTS / "header.html").read_text(encoding="utf-8").strip()
footer = (PARTS / "footer.html").read_text(encoding="utf-8").strip()


def render_header(current):
    html = header
    if current and current != "none":
        html = html.replace(f'data-nav="{current}"', f'data-nav="{current}" aria-current="page"', 1)
    return html


for name in PAGES:
    path = ROOT / name
    text = path.read_text(encoding="utf-8")
    new, n1 = re.subn(r"<!-- header(?: current=(\w+))? -->.*?<!-- /header -->",
                      lambda m: f"<!-- header current={m.group(1) or 'none'} -->\n{render_header(m.group(1))}\n<!-- /header -->",
                      text, flags=re.S)
    new, n2 = re.subn(r"<!-- footer -->.*?<!-- /footer -->", lambda m: f"<!-- footer -->\n{footer}\n<!-- /footer -->", new, flags=re.S)
    if n1 != 1 or n2 != 1:
        raise SystemExit(f"{name}: expected one header and one footer marker, found {n1} and {n2}")
    if new != text:
        path.write_text(new, encoding="utf-8", newline="\n")
        print("updated", name)
    else:
        print("unchanged", name)
