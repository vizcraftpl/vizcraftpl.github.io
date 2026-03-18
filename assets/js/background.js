// ============================================================
// BACKGROUND
// Depends on: nothing
// ============================================================

function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const ACCENT_1 = { r: 173, g: 20,  b: 87  };  // --accent
  const ACCENT_2 = { r: 0,   g: 188, b: 212 };  // --accent-2
  const ACCENT_3 = { r: 63,  g: 185, b: 80  };  // --accent-3
  const ACCENT_4 = { r: 210, g: 153, b: 34  };  // --accent-4
  const ACCENTS  = [ACCENT_1, ACCENT_2, ACCENT_3, ACCENT_4];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeShape() {
    const a   = ACCENTS[Math.floor(rand(0, ACCENTS.length))];
    const op  = rand(0.04, 0.12);
    const filled = Math.random() > 0.45;
    return {
      x:        rand(0, canvas.width),
      y:        rand(0, canvas.height),
      radius:   rand(0.04, 0.14) * Math.min(canvas.width, canvas.height),
      sides:    Math.floor(rand(3, 8)),
      rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(0.0003, 0.001) * (Math.random() > 0.5 ? 1 : -1),
      vx:       rand(0.1, 0.3)  * (Math.random() > 0.5 ? 1 : -1),
      vy:       rand(0.1, 0.3)  * (Math.random() > 0.5 ? 1 : -1),
      filled,
      fill:   `rgba(${a.r},${a.g},${a.b},${op})`,
      stroke: `rgba(${a.r},${a.g},${a.b},${op * 3})`,
    };
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  let shapes = [];

  function spawnShapes(n = 48) {
    shapes = Array.from({ length: n }, makeShape);
  }

  function drawShape(s) {
    ctx.beginPath();
    for (let i = 0; i < s.sides; i++) {
      const angle = s.rotation + (i / s.sides) * Math.PI * 2;
      const px = s.x + s.radius * Math.cos(angle);
      const py = s.y + s.radius * Math.sin(angle);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (s.filled) { ctx.fillStyle = s.fill; ctx.fill(); }
    ctx.strokeStyle = s.stroke;
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of shapes) {
      s.x        += s.vx;
      s.y        += s.vy;
      s.rotation += s.rotSpeed;
      if (s.x < -s.radius)              s.x = canvas.width  + s.radius;
      if (s.x >  canvas.width + s.radius)  s.x = -s.radius;
      if (s.y < -s.radius)              s.y = canvas.height + s.radius;
      if (s.y >  canvas.height + s.radius) s.y = -s.radius;
      drawShape(s);
    }
    requestAnimationFrame(tick);
  }

  resize();
  spawnShapes();
  tick();
  window.addEventListener('resize', () => { resize(); spawnShapes(); });
}