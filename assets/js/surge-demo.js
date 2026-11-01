// Scrap Surge page: a tiny taste of the game, using its real art. Debris drifts down, you tap it,
// your drone helps. Nothing here is saved or sent anywhere.
(() => {
  const root = document.getElementById("demo");
  if (!root) return;
  const canvas = root.querySelector("canvas");
  const context = canvas.getContext("2d");
  const scrapLabel = root.querySelector("[data-scrap]");
  const comboLabel = root.querySelector("[data-combo]");
  const hint = root.querySelector(".demo-hint");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const load = (name) => {
    const image = new Image();
    image.src = `/scrap-surge/img/${name}`;
    return image;
  };
  const sheet = load("debris-sheet.webp");
  const ship = load("ship-demo.webp");
  const droneArt = load("drone-1.webp");
  const CELL = 128;
  // Rows of the debris sheet: taps to break, scrap paid, chance of appearing.
  const KINDS = [
    { row: 0, hp: 3, pay: 3, weight: 34 },
    { row: 1, hp: 2, pay: 2, weight: 34 },
    { row: 2, hp: 7, pay: 9, weight: 10 },
    { row: 3, hp: 3, pay: 18, weight: 7 },
    { row: 4, hp: 4, pay: 10, weight: 8 },
    { row: 5, hp: 3, pay: 7, weight: 7 },
  ];
  const TOTAL_WEIGHT = KINDS.reduce((sum, kind) => sum + kind.weight, 0);

  let width = 0;
  let height = 0;
  let debris = [];
  let chips = [];
  let numbers = [];
  let beams = [];
  let scrap = 0;
  let combo = 0;
  let comboTime = 0;
  let spawnTime = 0;
  let droneTime = 1.2;
  let flightTime = 0;
  let running = false;
  let started = !reduced;
  let visible = true;
  let last = 0;

  const resize = () => {
    width = root.clientWidth;
    height = root.clientHeight;
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
  };

  const spawn = () => {
    let roll = Math.random() * TOTAL_WEIGHT;
    const kind = KINDS.find((candidate) => (roll -= candidate.weight) < 0) || KINDS[0];
    const size = (kind.hp >= 7 ? 92 : 62 + Math.random() * 26) * Math.min(1.1, width / 340);
    debris.push({
      kind, size, hp: kind.hp, flash: 0,
      x: size * 0.6 + Math.random() * (width - size * 1.2),
      y: -size,
      vx: (Math.random() - 0.5) * 12,
      vy: 34 + Math.random() * 22,
      angle: Math.random() * 6.28,
      spin: (Math.random() - 0.5) * 1.1,
    });
  };

  const burst = (x, y, count, colour) => {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * 6.28;
      const speed = 50 + Math.random() * 190;
      chips.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.3 + Math.random() * 0.45, size: 2 + Math.random() * 4, colour });
    }
  };

  const hit = (rock, damage, crit) => {
    rock.hp -= damage;
    rock.flash = 0.1;
    burst(rock.x, rock.y, crit ? 10 : 5, crit ? "#ffc34d" : "#b9c4df");
    if (crit) numbers.push({ x: rock.x, y: rock.y - 16, text: "CRIT", colour: "#ffc34d", life: 0.7 });
    if (rock.hp > 0) return;
    debris.splice(debris.indexOf(rock), 1);
    combo = comboTime > 0 ? combo + 1 : 1;
    comboTime = 2.2;
    const pay = Math.round(rock.kind.pay * (1 + Math.min(combo, 25) * 0.026));
    scrap += pay;
    scrapLabel.textContent = scrap.toLocaleString("en-US");
    comboLabel.textContent = `x${combo} COMBO`;
    comboLabel.classList.toggle("on", combo >= 3);
    burst(rock.x, rock.y, 22, rock.kind.row === 3 ? "#ffc34d" : "#4de8d0");
    numbers.push({ x: rock.x, y: rock.y, text: `+${pay}`, colour: "#eef2ff", life: 0.85 });
  };

  const onTap = (event) => {
    if (reduced && !started) {
      started = true;
      wake();
    }
    hint.classList.add("off");
    const box = canvas.getBoundingClientRect();
    const x = (event.clientX - box.left) * (width / box.width);
    const y = (event.clientY - box.top) * (height / box.height);
    for (let i = debris.length - 1; i >= 0; i -= 1) {
      const rock = debris[i];
      const reach = rock.size * 0.62;
      if ((rock.x - x) ** 2 + (rock.y - y) ** 2 < reach * reach) {
        const crit = Math.random() < 0.12;
        hit(rock, crit ? 3 : 1, crit);
        return;
      }
    }
  };

  const update = (dt) => {
    flightTime += dt;
    spawnTime -= dt;
    if (spawnTime <= 0 && debris.length < 9) {
      spawn();
      spawnTime = 0.75 + Math.random() * 0.6;
    }
    if (comboTime > 0) {
      comboTime -= dt;
      if (comboTime <= 0) comboLabel.classList.remove("on");
    }
    for (let i = debris.length - 1; i >= 0; i -= 1) {
      const rock = debris[i];
      rock.x += rock.vx * dt;
      rock.y += rock.vy * dt;
      rock.angle += rock.spin * dt;
      rock.flash = Math.max(0, rock.flash - dt);
      if (rock.y > height + rock.size) debris.splice(i, 1);
    }
    // The drone fires on its own, like in the game, at whatever has come furthest.
    droneTime -= dt;
    if (droneTime <= 0) {
      droneTime = 1.1;
      const target = debris.filter((rock) => rock.y > 30).sort((a, b) => b.y - a.y)[0];
      if (target) {
        beams.push({ x: droneX(), y: droneY(), tx: target.x, ty: target.y, life: 0.14 });
        hit(target, 1, false);
      }
    }
    chips = chips.filter((chip) => (chip.life -= dt) > 0);
    numbers = numbers.filter((number) => (number.life -= dt) > 0);
    beams = beams.filter((beam) => (beam.life -= dt) > 0);
    for (const chip of chips) {
      chip.x += chip.vx * dt;
      chip.y += chip.vy * dt;
      chip.vx *= 0.97;
      chip.vy *= 0.97;
    }
    for (const number of numbers) number.y -= 42 * dt;
  };

  const shipSize = () => Math.min(width * 0.42, 150);
  const droneX = () => width / 2 + shipSize() * 0.82 + Math.cos(flightTime * 0.7) * 8;
  const droneY = () => height - shipSize() * 0.95 + Math.sin(flightTime * 1.8) * 9;
  const ready = (image) => image.complete && image.naturalWidth > 0;

  const draw = () => {
    context.clearRect(0, 0, width, height);
    for (const rock of debris) {
      if (!ready(sheet)) break;
      const stage = Math.min(3, Math.floor((1 - rock.hp / rock.kind.hp) * 4));
      const size = rock.size * (rock.flash > 0 ? 1.1 : 1);
      context.save();
      context.translate(rock.x, rock.y);
      context.rotate(rock.angle);
      context.drawImage(sheet, stage * CELL, rock.kind.row * CELL, CELL, CELL, -size / 2, -size / 2, size, size);
      context.restore();
    }
    // Ship, twin engines and drone.
    if (ready(ship)) {
      const size = shipSize();
      const tall = size * (ship.naturalHeight / ship.naturalWidth);
      const shipY = height - tall - 30 + Math.sin(flightTime * 1.4) * 3;
      const flicker = 1 + Math.sin(flightTime * 31) * 0.18;
      const base = shipY + tall * 0.74;
      const flame = context.createLinearGradient(0, base, 0, base + 30);
      flame.addColorStop(0, "rgba(150,245,255,0.95)");
      flame.addColorStop(1, "rgba(77,232,208,0)");
      context.fillStyle = flame;
      for (const side of [-1, 1]) {
        const nozzle = width / 2 + side * size * 0.062;
        context.beginPath();
        context.moveTo(nozzle - size * 0.035, base);
        context.lineTo(nozzle + size * 0.035, base);
        context.lineTo(nozzle, base + 26 * flicker);
        context.fill();
      }
      context.drawImage(ship, width / 2 - size / 2, shipY, size, tall);
    }
    if (ready(droneArt)) context.drawImage(droneArt, droneX() - 19, droneY() - 19, 38, 38);
    context.lineCap = "round";
    for (const beam of beams) {
      context.strokeStyle = `rgba(120,245,255,${beam.life / 0.14})`;
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(beam.x, beam.y);
      context.lineTo(beam.tx, beam.ty);
      context.stroke();
    }
    for (const chip of chips) {
      context.globalAlpha = Math.min(1, chip.life * 3);
      context.fillStyle = chip.colour;
      context.fillRect(chip.x, chip.y, chip.size, chip.size);
    }
    context.textAlign = "center";
    context.font = '700 21px "Chakra Petch", sans-serif';
    for (const number of numbers) {
      context.globalAlpha = Math.min(1, number.life * 2.4);
      context.fillStyle = number.colour;
      context.fillText(number.text, number.x, number.y);
    }
    context.globalAlpha = 1;
  };

  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    running = visible && !document.hidden;
    if (running) requestAnimationFrame(tick);
  };
  const wake = () => {
    if (running || !started || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(tick);
  };

  resize();
  canvas.addEventListener("pointerdown", onTap);
  new ResizeObserver(resize).observe(root);
  document.addEventListener("visibilitychange", wake);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    wake();
  }).observe(root);
  if (reduced) {
    hint.textContent = "Tap to play";
    Promise.all([ship.decode(), droneArt.decode()]).then(draw, () => {});
  }
  wake();
})();
