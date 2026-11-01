// Home page hero: streams of light that follow a slowly changing current and swirl around the pointer.
(() => {
  const canvas = document.getElementById("flow");
  if (!canvas) return;
  const hero = canvas.parentElement;
  const context = canvas.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TEAL = [77, 232, 208];
  const EMBER = [255, 122, 69];
  const BUCKETS = 8;
  const palette = Array.from({ length: BUCKETS }, (_, i) => {
    const t = i / (BUCKETS - 1);
    return `rgba(${TEAL.map((c, n) => Math.round(c + (EMBER[n] - c) * t)).join(",")},0.5)`;
  });
  const paths = Array.from({ length: BUCKETS }, () => []);
  const pointer = { x: -9999, y: -9999, strength: 0 };
  let width = 0;
  let height = 0;
  let particles = [];
  let time = Math.random() * 100;
  let frame = 0;
  let visible = true;

  const spawn = (particle) => {
    particle.x = Math.random() * width;
    particle.y = Math.random() * height;
    particle.life = 60 + Math.random() * 180;
    return particle;
  };

  const resize = () => {
    const box = hero.getBoundingClientRect();
    if (Math.abs(box.width - width) < 2 && Math.abs(box.height - height) < 80 && particles.length) return;
    width = box.width;
    height = box.height;
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.lineWidth = 1;
    particles = Array.from({ length: Math.min(1400, Math.round((width * height) / 1100)) }, () => spawn({}));
  };

  const step = () => {
    time += 0.006;
    pointer.strength *= 0.97;
    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "rgba(0,0,0,0.045)";
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = "lighter";
    paths.forEach((path) => { path.length = 0; });
    for (const p of particles) {
      const angle = Math.sin(p.x * 0.0021 + time) * 1.5 + Math.cos(p.y * 0.0028 - time * 0.8) * 1.3 + Math.sin((p.x + p.y) * 0.0011 + time * 0.5) * 1.6;
      let vx = Math.cos(angle) * 1.5;
      let vy = Math.sin(angle) * 1.5;
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const near = dx * dx + dy * dy;
      if (near < 62500 && pointer.strength > 0.02) {
        const pull = (1 - near / 62500) * pointer.strength * 4.5;
        const distance = Math.sqrt(near) || 1;
        vx += (-dy / distance + (dx / distance) * 0.3) * pull;
        vy += (dx / distance + (dy / distance) * 0.3) * pull;
      }
      const bucket = Math.max(0, Math.min(BUCKETS - 1, Math.floor(((p.x + p.y * 0.6) / (width + height * 0.6) + Math.sin(time * 0.7) * 0.18) * BUCKETS)));
      paths[bucket].push(p.x, p.y, p.x + vx, p.y + vy);
      p.x += vx;
      p.y += vy;
      p.life -= 1;
      if (p.life <= 0 || p.x < -5 || p.x > width + 5 || p.y < -5 || p.y > height + 5) spawn(p);
    }
    paths.forEach((path, bucket) => {
      context.strokeStyle = palette[bucket];
      context.beginPath();
      for (let i = 0; i < path.length; i += 4) {
        context.moveTo(path[i], path[i + 1]);
        context.lineTo(path[i + 2], path[i + 3]);
      }
      context.stroke();
    });
  };

  const run = () => {
    step();
    frame = visible && !document.hidden ? requestAnimationFrame(run) : 0;
  };
  const wake = () => { if (!frame && !reduced && visible && !document.hidden) frame = requestAnimationFrame(run); };

  resize();
  if (reduced) {
    for (let i = 0; i < 160; i += 1) step();
    return;
  }
  hero.addEventListener("pointermove", (event) => {
    const box = hero.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
    pointer.strength = 1;
  }, { passive: true });
  addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", wake);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    wake();
  }).observe(hero);
  // Start with the current already flowing instead of a blank sky.
  for (let i = 0; i < 90; i += 1) step();
  wake();
})();
