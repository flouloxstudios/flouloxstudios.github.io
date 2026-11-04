// Shared behaviour for every page: scroll reveals, nav and tab highlighting, hero parallax, the redacted
// project title, copy-address buttons and the screenshot viewer. Each part only runs where its markup
// exists, and every page works without it.
(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");

  // Scroll reveals. Without IntersectionObserver everything is simply shown.
  const revealed = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduced) {
    const watcher = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          watcher.unobserve(entry.target);
        }
      }
    }, { rootMargin: "0px 0px -6% 0px" });
    revealed.forEach((element) => watcher.observe(element));
  } else {
    revealed.forEach((element) => element.classList.add("in"));
  }

  // Highlight the nav link or tab for the section currently in view.
  const spies = [...document.querySelectorAll("[data-spy]")];
  if (spies.length && "IntersectionObserver" in window) {
    const groups = new Map();
    for (const link of spies) {
      const section = document.getElementById(link.dataset.spy);
      if (section) groups.set(section, link);
    }
    const mark = (link) => {
      const siblings = link.parentElement.querySelectorAll("[data-spy]");
      siblings.forEach((other) => other.removeAttribute("aria-current"));
      link.setAttribute("aria-current", link.closest(".tabs") ? "true" : "page");
    };
    const spy = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) mark(groups.get(entry.target));
    }, { rootMargin: "-45% 0px -50% 0px" });
    groups.forEach((_, section) => spy.observe(section));
  }

  // Hero art drifts a little with the pointer.
  if (!reduced && matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".hero, .game-hero").forEach((hero) => {
      const layers = hero.querySelectorAll("[data-depth]");
      if (!layers.length) return;
      let raf = 0;
      hero.addEventListener("pointermove", (event) => {
        const box = hero.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          layers.forEach((layer) => {
            const depth = Number(layer.dataset.depth);
            layer.style.translate = `${(x * depth).toFixed(1)}px ${(y * depth).toFixed(1)}px`;
          });
        });
      }, { passive: true });
      hero.addEventListener("pointerleave", () => layers.forEach((layer) => { layer.style.translate = ""; }));
    });
  }

  // The next project's title keeps trying to decode itself and never quite makes it.
  const redacted = document.querySelector("[data-scramble]");
  if (redacted && !reduced) {
    const glyphs = "ABCDEFGHKLMNPRSTVXZ0123456789#/";
    const blank = redacted.textContent;
    const scramble = () => {
      let steps = 12;
      const timer = setInterval(() => {
        steps -= 1;
        redacted.textContent = steps <= 0 ? blank : [...blank].map((c) => (Math.random() < 0.45 ? glyphs[Math.floor(Math.random() * glyphs.length)] : c)).join("");
        if (steps <= 0) clearInterval(timer);
      }, 70);
    };
    setInterval(scramble, 5200);
    setTimeout(scramble, 1200);
  }

  document.querySelectorAll("[data-copy]").forEach((button) => {
    const label = button.querySelector("small");
    const original = label.textContent;
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        label.textContent = "Copied";
      } catch {
        label.textContent = button.dataset.copy;
      }
      setTimeout(() => { label.textContent = original; }, 2200);
    });
  });

  const viewer = document.querySelector("dialog.lightbox");
  if (viewer) {
    const shots = [...document.querySelectorAll(".shot")];
    const image = viewer.querySelector("img");
    const caption = viewer.querySelector("p");
    let current = 0;
    const show = (index) => {
      current = (index + shots.length) % shots.length;
      const source = shots[current].querySelector("img");
      image.src = source.src;
      image.alt = source.alt;
      caption.textContent = shots[current].querySelector("span").textContent;
    };
    shots.forEach((shot, index) => shot.addEventListener("click", () => {
      show(index);
      viewer.showModal();
    }));
    viewer.querySelector("[data-prev]").addEventListener("click", () => show(current - 1));
    viewer.querySelector("[data-next]").addEventListener("click", () => show(current + 1));
    viewer.querySelector("[data-close]").addEventListener("click", () => viewer.close());
    viewer.addEventListener("click", (event) => { if (event.target === viewer) viewer.close(); });
    viewer.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") show(current - 1);
      if (event.key === "ArrowRight") show(current + 1);
    });
  }
})();
