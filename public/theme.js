// خلفية الثيم المتحركة: نجوم تلمع، شهب، مدارات برتقالية، والأرض
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // المدارات: خطوط متوازية تنحني من أعلى اليسار إلى اليمين مثل التصميم
  let lines = '';
  for (let i = 0; i < 8; i++) {
    const y = 70 + i * 15;
    const d = `M -120 ${y} C 260 ${y - 70}, 620 ${y + 150}, 1120 ${y + 330}`;
    lines += `<path class="base" d="${d}"/>`;
    if (i % 2 === 0) lines += `<path class="flow" d="${d}" style="animation-delay:-${i * 1.3}s;animation-duration:${8 + i}s"/>`;
  }

  const bg = document.createElement('div');
  bg.className = 'space';
  bg.setAttribute('aria-hidden', 'true');
  bg.innerHTML = `
    <canvas class="stars"></canvas>
    <svg class="orbits" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="orbitGrad" x1="0" x2="1">
          <stop offset="0" stop-color="#ff9a2e" stop-opacity="0"/>
          <stop offset=".3" stop-color="#ff9a2e" stop-opacity=".75"/>
          <stop offset=".75" stop-color="#ff9a2e" stop-opacity=".45"/>
          <stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${lines}
      <path id="dotTrail" class="dots" d="M 230 205 C 380 175, 520 185, 640 228"/>
      <g class="sparkle">
        <path d="M0 -15 L3 -3 L15 0 L3 3 L0 15 L-3 3 L-15 0 L-3 -3 Z"/>
        ${reduce ? '' : '<animateMotion dur="7s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear"><mpath href="#dotTrail"/></animateMotion>'}
      </g>
    </svg>
    <div class="earth"></div>`;
  document.body.prepend(bg);

  // النجوم والشهب
  const c = bg.querySelector('canvas');
  const x = c.getContext('2d');
  let W, H, dpr, stars = [], shoot = null;

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = c.width = innerWidth * dpr;
    H = c.height = innerHeight * dpr;
    const n = Math.round((innerWidth * innerHeight) / 4200);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.8,
      r: (Math.random() * 1.1 + 0.25) * dpr,
      p: Math.random() * Math.PI * 2,
      s: Math.random() * 1.4 + 0.4,
      warm: Math.random() < 0.18,
    }));
  }

  function frame(t) {
    x.clearRect(0, 0, W, H);
    for (const s of stars) {
      x.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(s.p + (t / 1000) * s.s * 0.7));
      x.fillStyle = s.warm ? '#ffd29a' : '#e3ebff';
      x.beginPath();
      x.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      x.fill();
    }
    x.globalAlpha = 1;

    if (!reduce) {
      if (!shoot && Math.random() < 0.006) {
        shoot = { x: W * (0.45 + Math.random() * 0.55), y: H * Math.random() * 0.35, vx: -(7 + Math.random() * 5) * dpr, vy: (2.5 + Math.random() * 2) * dpr, life: 1 };
      }
      if (shoot) {
        const tx = shoot.x - shoot.vx * 16, ty = shoot.y - shoot.vy * 16;
        const g = x.createLinearGradient(shoot.x, shoot.y, tx, ty);
        g.addColorStop(0, `rgba(255,236,205,${shoot.life})`);
        g.addColorStop(1, 'rgba(255,154,46,0)');
        x.strokeStyle = g;
        x.lineWidth = 1.8 * dpr;
        x.beginPath(); x.moveTo(shoot.x, shoot.y); x.lineTo(tx, ty); x.stroke();
        shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life -= 0.013;
        if (shoot.life <= 0 || shoot.x < -50) shoot = null;
      }
      requestAnimationFrame(frame);
    }
  }

  size();
  addEventListener('resize', size);
  requestAnimationFrame(frame);
})();
