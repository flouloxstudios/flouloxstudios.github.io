// FlouLox Studios: shared behaviour for every page. Each part only runs when its markup is on the page,
// and every page still works (and shows all its content) without JavaScript.
(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const hasIO = "IntersectionObserver" in window;
  root.classList.add("js");
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  // Run fn once when an element first scrolls into view.
  const onceVisible = (elements, fn, margin = "0px 0px -8% 0px") => {
    if (!hasIO || reduced) { elements.forEach(fn); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        fn(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: margin });
    elements.forEach((el) => io.observe(el));
  };

  // Pause CSS loops (clouds, floating phones...) while their section is off screen.
  const pauseOffscreen = (elements) => {
    if (!hasIO) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("paused", !entry.isIntersecting));
    });
    elements.forEach((el) => io.observe(el));
  };

  /* ---------- Header ---------- */
  const header = $("[data-header]");
  if (header) {
    const update = () => header.classList.toggle("scrolled", scrollY > 24);
    update();
    addEventListener("scroll", update, { passive: true });

    const toggle = $(".nav-toggle", header);
    const nav = $(".main-nav", header);
    const setOpen = (open) => {
      root.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      $("use", toggle).setAttribute("href", `/assets/img/icons.svg#${open ? "close" : "menu"}`);
    };
    toggle.addEventListener("click", () => setOpen(!root.classList.contains("nav-open")));
    nav.addEventListener("click", (event) => { if (event.target.closest("a")) setOpen(false); });
    addEventListener("keydown", (event) => {
      if (event.key === "Escape" && root.classList.contains("nav-open")) { setOpen(false); toggle.focus(); }
    });
    matchMedia("(min-width: 821px)").addEventListener("change", () => setOpen(false));

    // On the home page, highlight the link for the section in view.
    if (document.body.classList.contains("home") && hasIO) {
      const links = $$("[data-spy]", nav);
      const targets = new Map();
      links.forEach((link) => {
        const section = link.dataset.spy === "top" ? $("[data-hero]") : document.getElementById(link.dataset.spy);
        if (section) targets.set(section, link);
      });
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => link.removeAttribute("aria-current"));
          targets.get(entry.target).setAttribute("aria-current", "page");
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      targets.forEach((_, section) => spy.observe(section));
    }
  }

  /* ---------- Scroll reveals ---------- */
  onceVisible($$(".reveal"), (el) => el.classList.add("in"));

  /* ---------- Pointer parallax (Scrap Surge hero phones) ---------- */
  if (!reduced && finePointer) {
    $$("[data-parallax]").forEach((scene) => {
      const layers = $$("[data-depth]", scene);
      if (!layers.length) return;
      let frame = 0;
      scene.addEventListener("pointermove", (event) => {
        const box = scene.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => layers.forEach((layer) => {
          const depth = Number(layer.dataset.depth);
          layer.style.translate = `${(x * depth).toFixed(1)}px ${(y * depth).toFixed(1)}px`;
        }));
      }, { passive: true });
      scene.addEventListener("pointerleave", () => layers.forEach((layer) => { layer.style.translate = ""; }));
    });
  }

  /* ---------- Home hero: scroll fade into the next section ---------- */
  const hero = $("[data-hero]");
  if (hero) {
    pauseOffscreen([hero]);
    if (!reduced) {
      let ticking = false;
      const update = () => {
        ticking = false;
        const p = Math.min(Math.max(scrollY / (hero.offsetHeight * 0.9), 0), 1);
        hero.style.setProperty("--p", p.toFixed(3));
      };
      addEventListener("scroll", () => {
        if (!ticking && scrollY < hero.offsetHeight * 1.2) { ticking = true; requestAnimationFrame(update); }
      }, { passive: true });
      update();
    }
  }

  /* ---------- Games showcase ---------- */
  $$("[data-showcase]").forEach((showcase) => {
    const track = $(".show-track", showcase);
    const slides = $$(".slide", track);
    const section = showcase.closest("section");
    const controls = $("[data-show-controls]", section);
    const prev = controls && $("[data-prev]", controls);
    const next = controls && $("[data-next]", controls);
    const dotsBox = $("[data-show-dots]", showcase);
    let active = 0;
    let dots = [];

    const startOf = (slide) => slide.offsetLeft - parseFloat(getComputedStyle(track).scrollPaddingLeft || 0);
    const goTo = (index) => {
      const i = Math.max(0, Math.min(slides.length - 1, index));
      track.scrollTo({ left: startOf(slides[i]), behavior: reduced ? "auto" : "smooth" });
    };
    const scrollable = () => track.scrollWidth > track.clientWidth + 4;
    const setActive = (index) => {
      active = index;
      slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
      dots.forEach((dot, i) => dot.setAttribute("aria-current", String(i === index)));
      if (prev) {
        prev.disabled = track.scrollLeft <= 4;
        next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
      }
    };
    const nearest = () => {
      let best = 0;
      let bestDistance = Infinity;
      slides.forEach((slide, i) => {
        const distance = Math.abs(startOf(slide) - track.scrollLeft);
        if (distance < bestDistance) { best = i; bestDistance = distance; }
      });
      // At the very end, the last slide counts as active even if it can't reach the start position.
      if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 4) best = slides.length - 1;
      return best;
    };
    const layout = () => {
      const multi = scrollable();
      showcase.classList.toggle("multi", multi);
      if (controls) controls.hidden = !multi;
      if (dotsBox) {
        dotsBox.hidden = !multi;
        if (multi && dots.length !== slides.length) {
          dotsBox.replaceChildren();
          dots = slides.map((slide, i) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.setAttribute("aria-label", `Show item ${i + 1} of ${slides.length}`);
            dot.addEventListener("click", () => goTo(i));
            dotsBox.append(dot);
            return dot;
          });
        }
      }
      setActive(multi ? nearest() : 0);
    };

    let scrollFrame = 0;
    track.addEventListener("scroll", () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => setActive(nearest()));
    }, { passive: true });
    if (prev) {
      prev.addEventListener("click", () => goTo(active - 1));
      next.addEventListener("click", () => goTo(active + 1));
    }
    track.addEventListener("keydown", (event) => {
      if (event.target !== track && !event.target.closest(".slide")) return;
      if (event.key === "ArrowRight") { event.preventDefault(); goTo(active + 1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); goTo(active - 1); }
    });
    // A click on a partly visible slide brings it forward instead of following its link.
    slides.forEach((slide, i) => slide.addEventListener("click", (event) => {
      if (showcase.classList.contains("multi") && i !== active) { event.preventDefault(); goTo(i); }
    }));

    // Mouse dragging (touch already scrolls natively).
    let drag = null;
    track.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0 || !scrollable()) return;
      drag = { x: event.clientX, left: track.scrollLeft, moved: false };
    });
    addEventListener("pointermove", (event) => {
      if (!drag) return;
      const dx = event.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; track.classList.add("dragging"); }
      if (drag.moved) track.scrollLeft = drag.left - dx;
    });
    addEventListener("pointerup", () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      track.classList.remove("dragging");
      if (moved) {
        goTo(nearest());
        track.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); }, { capture: true, once: true });
      }
    });
    track.addEventListener("dragstart", (event) => event.preventDefault());

    // Gentle art parallax on hover.
    if (finePointer && !reduced) {
      $$(".game-card", track).forEach((card) => {
        card.addEventListener("pointermove", (event) => {
          const box = card.getBoundingClientRect();
          card.style.setProperty("--mx", ((event.clientX - box.left) / box.width - 0.5).toFixed(3));
          card.style.setProperty("--my", ((event.clientY - box.top) / box.height - 0.5).toFixed(3));
        });
        card.addEventListener("pointerleave", () => { card.style.setProperty("--mx", 0); card.style.setProperty("--my", 0); });
      });
    }

    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(track);
    layout();
  });

  /* ---------- About: studio lights come up, journey line fills in ---------- */
  const studio = $("[data-studio]");
  if (studio) { onceVisible([studio], (el) => el.classList.add("lit"), "0px 0px -20% 0px"); pauseOffscreen([studio]); }
  $$("[data-timeline]").forEach((timeline) => {
    onceVisible([timeline], (el) => el.classList.add("in"), "0px 0px -15% 0px");
    const buttons = $$(".milestone button", timeline);
    buttons.forEach((button) => button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      buttons.forEach((other) => other.setAttribute("aria-expanded", "false"));
      button.setAttribute("aria-expanded", String(open));
    }));
    addEventListener("keydown", (event) => {
      if (event.key === "Escape") buttons.forEach((b) => b.setAttribute("aria-expanded", "false"));
    });
  });

  /* ---------- Copy buttons ---------- */
  $$("[data-copy]").forEach((button) => {
    const label = $("span", button);
    const original = label.textContent;
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        label.textContent = "Copied";
      } catch {
        label.textContent = "Press Ctrl+C";
        getSelection().selectAllChildren(button.previousElementSibling || button);
      }
      setTimeout(() => { label.textContent = original; }, 2200);
    });
  });

  /* ---------- Contact form ---------- */
  $$("[data-contact]").forEach((form) => {
    // Web3Forms needs only an access key; any other service (e.g. Formspree) is configured by its URL.
    const keyOf = () => (form.dataset.accessKey || "").trim();
    const endpointOf = () => (form.dataset.endpoint || "").trim() || (keyOf() ? "https://api.web3forms.com/submit" : "");
    const to = form.dataset.to;
    const submit = $("button[type=submit]", form);
    const label = $("[data-label]", submit);
    const status = $(".form-status", form);
    const statusText = $("p", status);
    const note = $("[data-form-note]", form);
    if (endpointOf() && note) note.textContent = "You can check your message before it goes. We usually reply within a few days.";
    const review = form.parentElement.querySelector("dialog.review");
    const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    const rules = {
      name: (v) => (v ? "" : "Please enter your name."),
      email: (v) => (!v ? "Please enter your email address." : emailOk(v) ? "" : "That email address doesn't look right. Check it and try again."),
      topic: (v) => (v ? "" : "Please choose a subject."),
      message: (v) => (!v ? "Please write a message." : v.length < 10 ? "Please write a little more (at least 10 characters)." : ""),
    };
    let tried = false;
    const check = (input) => {
      const message = rules[input.name](input.value.trim());
      const field = input.closest(".field");
      field.classList.toggle("invalid", Boolean(message));
      input.setAttribute("aria-invalid", String(Boolean(message)));
      $(".error", field).textContent = message;
      return !message;
    };
    const inputs = Object.keys(rules).map((name) => form.elements[name]);
    inputs.forEach((input) => {
      input.addEventListener("blur", () => { if (tried || input.value) check(input); });
      input.addEventListener("input", () => { if (tried || input.closest(".field").classList.contains("invalid")) check(input); });
    });
    const show = (kind, html) => {
      status.className = `form-status show ${kind}`;
      statusText.hidden = false;
      statusText.innerHTML = html;
    };
    const busy = (on, text) => {
      submit.setAttribute("aria-busy", String(on));
      submit.disabled = on;
      label.textContent = text;
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      tried = true;
      const results = inputs.map(check);
      if (results.includes(false)) {
        inputs[results.indexOf(false)].focus();
        show("err", "Please fix the highlighted fields and try again.");
        return;
      }
      if (form.elements.company.value) return; // honeypot: only bots fill this in
      const data = Object.fromEntries(inputs.map((input) => [input.name, input.value.trim()]));
      if (review && typeof review.showModal === "function") {
        $("[data-rv=from]", review).textContent = `${data.name} <${data.email}>`;
        $("[data-rv=topic]", review).textContent = data.topic;
        $("[data-rv=message]", review).textContent = data.message;
        $("[data-rv-note]", review).textContent = endpointOf()
          ? "This goes straight to the FlouLox team. We'll reply to the address above."
          : "Your email app will open with this message filled in. Press send there to deliver it.";
        $("[data-rv-send] span", review).textContent = endpointOf() ? "Send now" : "Open email app";
        status.className = "form-status";
        review.returnValue = "";
        review.showModal();
        $("[data-rv-send]", review).focus();
        document.documentElement.style.overflow = "hidden";
        review.pending = data;
      } else {
        deliver(data);
      }
    });
    if (review) {
      // Clicking the dimmed backdrop counts as "keep editing".
      review.addEventListener("click", (event) => { if (event.target === review) review.close("cancel"); });
      review.addEventListener("close", () => {
        document.documentElement.style.overflow = "";
        const data = review.pending;
        review.pending = null;
        if (review.returnValue === "send" && data) deliver(data);
        else submit.focus();
      });
    }

    async function deliver(data) {
      const endpoint = endpointOf();
      const subject = `[${data.topic}] Message from ${data.name}`;

      if (endpoint) {
        busy(true, "Sending…");
        const key = keyOf();
        const payload = key
          ? { access_key: key, subject, from_name: `${data.name} via flouloxstudios.com`, ...data }
          : { _subject: subject, ...data };
        try {
          const response = await fetch(endpoint, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json", Accept: "application/json" } });
          const result = await response.json().catch(() => ({}));
          if (!response.ok || result.success === false) throw new Error(String(response.status));
          form.reset();
          tried = false;
          show("ok", `<b>Thanks, ${escapeHtml(data.name)}. Your message was sent.</b> We'll reply to ${escapeHtml(data.email)}.`);
        } catch {
          show("err", `Your message couldn't be sent just now. Your text is still here, so please try again, or email us at <a href="mailto:${to}">${to}</a>.`);
        } finally {
          busy(false, "Send Message");
        }
        return;
      }

      // No form service configured: hand the message to the visitor's email app.
      const body = `${data.message}

— ${data.name} (${data.email})`;
      busy(true, "Opening email…");
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setTimeout(() => {
        busy(false, "Send Message");
        show("info", `<b>Your email app should now be open with your message filled in.</b> Press send there to deliver it. Nothing opened? Email us at <a href="mailto:${to}">${to}</a>; your text is still here.`);
      }, 700);
    }
  });
  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Swipe helper (touch and pen) ---------- */
  const onSwipe = (element, fn) => {
    let start = null;
    element.addEventListener("pointerdown", (event) => { if (event.pointerType !== "mouse") start = { x: event.clientX, y: event.clientY }; });
    element.addEventListener("pointerup", (event) => {
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) fn(dx < 0 ? 1 : -1);
    });
    element.addEventListener("pointercancel", () => { start = null; });
  };

  /* ---------- Game page: Mission Control ---------- */
  $$("[data-mc]").forEach((mc) => {
    const images = $$(".mc-screen img", mc);
    const tabs = $$("[role=tab]", mc);
    const caption = $(".mc-caption", mc);
    const dotsBox = $(".mc-dots", mc);
    const panel = $("[role=tabpanel]", mc);
    const dots = images.map(() => dotsBox.appendChild(document.createElement("i")));
    let current = 0;
    const show = (index, focusTab = false) => {
      current = (index + images.length) % images.length;
      const image = images[current];
      images.forEach((img, i) => img.classList.toggle("on", i === current));
      dots.forEach((dot, i) => dot.classList.toggle("on", i === current));
      caption.textContent = image.dataset.caption;
      tabs.forEach((tab) => {
        const selected = tab.dataset.cat === image.dataset.cat;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (selected) {
          panel.setAttribute("aria-labelledby", tab.id);
          if (focusTab) tab.focus();
        }
      });
    };
    const firstOf = (cat) => images.findIndex((img) => img.dataset.cat === cat);
    tabs.forEach((tab, t) => {
      tab.addEventListener("click", () => show(firstOf(tab.dataset.cat)));
      tab.addEventListener("keydown", (event) => {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          show(firstOf(tabs[event.key === "Home" ? 0 : tabs.length - 1].dataset.cat), true);
        } else if (step) {
          event.preventDefault();
          show(firstOf(tabs[(t + step + tabs.length) % tabs.length].dataset.cat), true);
        }
      });
    });
    $("[data-prev]", mc).addEventListener("click", () => show(current - 1));
    $("[data-next]", mc).addEventListener("click", () => show(current + 1));
    onSwipe($(".mc-screen", mc), (direction) => show(current + direction));
    show(0);
  });

  /* ---------- Game page: decorative loops pause off screen ---------- */
  pauseOffscreen($$("[data-anim]"));

  /* ---------- Screenshot gallery + lightbox ---------- */
  const viewer = $("dialog.lightbox");
  if (viewer && typeof viewer.showModal === "function") {
    const shots = $$(".shot");
    const frame = $(".phone", viewer);
    const image = $("img", viewer);
    const caption = $(".bar p", viewer);
    const count = $(".count", viewer);
    let current = 0;
    let timer = 0;
    const render = () => {
      const source = $("img", shots[current]);
      image.src = source.currentSrc || source.src;
      image.alt = source.alt;
      caption.textContent = $("span", shots[current]).textContent;
      count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(shots.length).padStart(2, "0")}`;
    };
    const show = (index, direction = 0) => {
      current = (index + shots.length) % shots.length;
      if (!direction || reduced) { render(); return; }
      clearTimeout(timer);
      frame.classList.add(direction > 0 ? "out-l" : "out-r");
      timer = setTimeout(() => {
        render();
        frame.classList.remove("out-l", "out-r");
      }, 180);
    };
    shots.forEach((shot, index) => shot.addEventListener("click", () => {
      show(index);
      viewer.showModal();
      root.style.overflow = "hidden";
    }));
    viewer.addEventListener("close", () => { root.style.overflow = ""; });
    $("[data-prev]", viewer).addEventListener("click", () => show(current - 1, -1));
    $("[data-next]", viewer).addEventListener("click", () => show(current + 1, 1));
    $("[data-close]", viewer).addEventListener("click", () => viewer.close());
    viewer.addEventListener("click", (event) => { if (event.target === viewer) viewer.close(); });
    viewer.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); show(current - 1, -1); }
      if (event.key === "ArrowRight") { event.preventDefault(); show(current + 1, 1); }
    });
    onSwipe($(".viewer", viewer), (direction) => show(current + direction, direction));
  }
})();
