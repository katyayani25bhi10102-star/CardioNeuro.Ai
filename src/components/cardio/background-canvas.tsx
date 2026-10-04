import { useEffect, useRef } from "react";

// Decorative only — never real patient data.
const C = { base: "#050b18", blue: "#1e90ff", cyan: "#22e5ff", violet: "#6a4cff", green: "#22e08a", red: "#ff4d5e", orange: "#ff9f1c" };

const g = (x: number, mu: number, s: number, a: number) => a * Math.exp(-((x - mu) ** 2) / (2 * s * s));
// PQRST on phase t in [0,1)
const pqrst = (t: number) => g(t, 0.2, 0.025, 0.12) + g(t, 0.36, 0.008, -0.12) + g(t, 0.4, 0.01, 1) + g(t, 0.44, 0.01, -0.25) + g(t, 0.65, 0.04, 0.25);

export function BackgroundCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, last = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const parts = Array.from({ length: 45 }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 }));
    const rings: { x: number; y: number; t0: number }[] = [];
    const ecgs = [
      { color: C.green, yf: 0.8, period: 360, amp: 60, speed: 90, alpha: 0.9, width: 2 },
      { color: C.red, yf: 0.93, period: 230, amp: 35, speed: 110, alpha: 0.45, width: 1.5 },
      { color: C.orange, yf: 0.14, period: 430, amp: 40, speed: 70, alpha: 0.35, width: 1.5 },
    ];
    let lastPhase = 0;

    const draw = (ms: number) => {
      const t = ms / 1000;
      mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
      const px = (d: number) => -mouse.x * d, py = (d: number) => -mouse.y * d;
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.base; ctx.fillRect(0, 0, w, h);

      // 1 aurora
      [[C.blue, 0.1, 0.11], [C.cyan, 0.08, 0.09], [C.violet, 0.12, 0.07]].forEach(([col, sp, op], i) => {
        const s = Number(sp), ph = i * 2.1;
        const x = w * (0.5 + 0.35 * Math.sin(t * s + ph)) + px(2), y = h * (0.5 + 0.25 * Math.sin(2 * (t * s + ph))) + py(2);
        const r = Math.max(w, h) * 0.6;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, String(col)); grd.addColorStop(1, "transparent");
        ctx.globalAlpha = Number(op); ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      });

      // 2 grid + scanline
      ctx.strokeStyle = C.cyan; ctx.lineWidth = 1;
      for (const [step, a] of [[24, 0.04], [120, 0.08]]) {
        ctx.globalAlpha = a; ctx.beginPath();
        for (let x = 0; x < w; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
        for (let y = 0; y < h; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
        ctx.stroke();
      }
      const sy = ((t % 9) / 9) * h;
      const trail = ctx.createLinearGradient(0, sy - 60, 0, sy);
      trail.addColorStop(0, "transparent"); trail.addColorStop(1, C.cyan);
      ctx.globalAlpha = 0.08; ctx.fillStyle = trail; ctx.fillRect(0, sy - 60, w, 60);
      ctx.globalAlpha = 0.35; ctx.fillStyle = C.cyan; ctx.fillRect(0, sy, w, 1);

      // 3 particles
      for (const p of parts) {
        if (!reduced) { p.x += p.vx; p.y += p.vy; }
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      ctx.strokeStyle = C.cyan;
      for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
        const d = Math.hypot(parts[i].x - parts[j].x, parts[i].y - parts[j].y);
        if (d < 150) { ctx.globalAlpha = (1 - d / 150) * 0.25; ctx.beginPath(); ctx.moveTo(parts[i].x + px(4), parts[i].y + py(4)); ctx.lineTo(parts[j].x + px(4), parts[j].y + py(4)); ctx.stroke(); }
      }
      ctx.fillStyle = C.cyan; ctx.shadowColor = C.cyan; ctx.shadowBlur = 8;
      for (const p of parts) { ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(p.x + px(4), p.y + py(4), 1.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.shadowBlur = 0;

      // 4 DNA helices
      const helix = (yc: number, amp: number, dir: number, op: number, size: number, d: number) => {
        const off = t * 0.8 * dir, k = 0.018;
        for (let x = 0; x < w; x += 26) {
          const ph = x * k + off, s = Math.sin(ph), c = Math.cos(ph);
          const y1 = yc + amp * s + py(d), y2 = yc - amp * s + py(d), xx = x + px(d);
          ctx.globalAlpha = op * Math.abs(s) * 0.6; ctx.strokeStyle = C.cyan; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(xx, y1); ctx.lineTo(xx, y2); ctx.stroke();
          ctx.globalAlpha = op * (0.5 + 0.5 * c); ctx.fillStyle = C.blue;
          ctx.beginPath(); ctx.arc(xx, y1, size * (0.6 + 0.4 * c), 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = op * (0.5 - 0.5 * c); ctx.fillStyle = C.cyan;
          ctx.beginPath(); ctx.arc(xx, y2, size * (0.6 - 0.4 * c) + 0.5, 0, Math.PI * 2); ctx.fill();
        }
        for (const [col, sign] of [[C.blue, 1], [C.cyan, -1]] as const) {
          ctx.globalAlpha = op * 0.6; ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath();
          for (let x = 0; x <= w; x += 6) { const y = yc + sign * amp * Math.sin(x * k + off) + py(d); x ? ctx.lineTo(x + px(d), y) : ctx.moveTo(x + px(d), y); }
          ctx.stroke();
        }
      };
      ctx.shadowColor = C.cyan; ctx.shadowBlur = 10;
      helix(h * 0.4, 50, 1, 0.55, 4, 6);
      helix(h * 0.66, 28, -1, 0.3, 2.5, 3);
      ctx.shadowBlur = 0;

      // 5 ECG traces
      const headX = w * 0.94;
      ecgs.forEach((e, idx) => {
        const yb = e.yf * h + py(8), shift = t * e.speed;
        const yAt = (x: number) => yb - e.amp * pqrst((((x + shift) / e.period) % 1 + 1) % 1);
        const grd = ctx.createLinearGradient(0, 0, w, 0);
        grd.addColorStop(0, "transparent"); grd.addColorStop(1, e.color);
        ctx.globalAlpha = e.alpha; ctx.strokeStyle = grd; ctx.lineWidth = e.width; ctx.shadowColor = e.color; ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let x = 0; x <= headX; x += 2) { const y = yAt(x) ; x ? ctx.lineTo(x + px(8), y) : ctx.moveTo(x + px(8), y); }
        ctx.stroke();
        const hy = yAt(headX);
        ctx.fillStyle = e.color; ctx.shadowBlur = 16; ctx.globalAlpha = Math.min(1, e.alpha + 0.2);
        ctx.beginPath(); ctx.arc(headX + px(8), hy, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        if (idx === 0) {
          const phase = (((headX + shift) / e.period) % 1 + 1) % 1;
          if (lastPhase < 0.4 && phase >= 0.4 && !reduced) rings.push({ x: headX, y: yb - e.amp, t0: t });
          lastPhase = phase;
        }
      });

      // 6 pulse rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const p = (t - rings[i].t0) / 1.2;
        if (p >= 1) { rings.splice(i, 1); continue; }
        ctx.globalAlpha = (1 - p) * 0.6; ctx.strokeStyle = i % 2 ? C.cyan : C.green; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(rings[i].x + px(8), rings[i].y, p * 120, 0, Math.PI * 2); ctx.stroke();
      }

      // vignette
      const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
      v.addColorStop(0, "transparent"); v.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.globalAlpha = 1; ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    };

    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      if (ms - last < 33) return;
      last = ms; draw(ms);
    };
    const onMove = (e: MouseEvent) => { mouse.tx = (e.clientX / w - 0.5) * 2; mouse.ty = (e.clientY / h - 0.5) * 2; };
    const onResize = () => { resize(); if (reduced) draw(0); };
    window.addEventListener("resize", onResize);
    if (reduced) draw(0); else { window.addEventListener("mousemove", onMove); raf = requestAnimationFrame(loop); }
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); window.removeEventListener("mousemove", onMove); };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 opacity-70" />;
}
