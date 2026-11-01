// Shared behaviour for every page: scroll reveals, the redacted project title, copy-address buttons
// and the screenshot viewer. Each part only runs where its markup exists, and every page works without it.
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const revealed = document.querySelectorAll(".reveal");
  if (!reduced && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js");
    const watcher = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          watcher.unobserve(entry.target);
        }
      }
    }, { rootMargin: "0px 0px -6% 0px" });
    revealed.forEach((element) => watcher.observe(element));
  }

  // The next project's title keeps trying to decode itself and never quite makes it.
  const redacted = document.querySelector("[data-scramble]");
  if (redacted && !reduced) {
    const glyphs = "ABCDEFGHKLMNPRSTVXZ0123456789#/";
    const blank = redacted.textContent;
    let timer = 0;
    const scramble = () => {
      let steps = 12;
      timer = setInterval(() => {
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
