import React, { useEffect, useRef } from 'react';

interface OrbitParticle {
  angle: number;
  speed: number;
  rxScale: number;
  ryScale: number;
  tilt: number;
  size: number;
  color: string;
  phase: number;
}

interface ArcParticle {
  t: number;
  speed: number;
  size: number;
  color: string;
}

export const GlowingBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;

    // Orbiting light particles along the central tilted orbital rings
    const orbitParticles: OrbitParticle[] = [
      { angle: 0.2, speed: 0.0045, rxScale: 0.156, ryScale: 0.049, tilt: -0.06, size: 3.2, color: '192, 132, 252', phase: 0 },
      { angle: 2.3, speed: 0.0045, rxScale: 0.156, ryScale: 0.049, tilt: -0.06, size: 2.8, color: '56, 189, 248', phase: 1.4 },
      { angle: 4.4, speed: 0.0045, rxScale: 0.156, ryScale: 0.049, tilt: -0.06, size: 2.6, color: '244, 114, 182', phase: 2.8 },
      { angle: 1.1, speed: -0.0032, rxScale: 0.125, ryScale: 0.078, tilt: 0.24, size: 2.4, color: '147, 197, 253', phase: 0.7 },
      { angle: 4.2, speed: -0.0032, rxScale: 0.125, ryScale: 0.078, tilt: 0.24, size: 2.5, color: '217, 70, 239', phase: 3.5 },
    ];

    // Outer orbital arc particles moving gently around the connecting ring
    const outerArcParticles: ArcParticle[] = [
      { t: 0.08, speed: 0.00055, size: 3.4, color: '192, 132, 252' },
      { t: 0.34, speed: 0.00055, size: 3.0, color: '56, 189, 248' },
      { t: 0.62, speed: 0.00055, size: 3.2, color: '244, 114, 182' },
      { t: 0.86, speed: 0.00055, size: 2.8, color: '168, 85, 247' },
    ];

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();
    let elapsed = 0;

    const render = (now: number) => {
      if (document.hidden) {
        lastTime = now;
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const dt = Math.min((now - lastTime) / 16.67, 2.5);
      lastTime = now;
      elapsed += dt * 0.01667;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'screen';

      const orbCx = width * 0.5;
      const orbCy = height * 0.415;
      const orbR = width * 0.112;

      // 1. Flowing neon energy waves inside the central glowing orb (circular clip)
      ctx.save();
      ctx.beginPath();
      ctx.arc(orbCx, orbCy, orbR * 0.96, 0, Math.PI * 2);
      ctx.clip();

      // Subtle rotating inner plasma waves (blue, purple, pink)
      for (let w = 0; w < 3; w++) {
        const waveAngle = elapsed * (0.28 + w * 0.09) * (w % 2 === 0 ? 1 : -1);
        const waveColors = ['56, 189, 248', '168, 85, 247', '244, 114, 182'];
        const col = waveColors[w];

        ctx.save();
        ctx.translate(orbCx, orbCy);
        ctx.rotate(waveAngle);

        ctx.beginPath();
        for (let x = -orbR; x <= orbR; x += 6) {
          const normX = x / orbR;
          const amp = orbR * 0.32 * (1 - normX * normX * 0.45);
          const y = Math.sin(normX * Math.PI * 1.6 + elapsed * 1.4 + w * 2.1) * amp;
          if (x === -orbR) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${col}, 0.24)`;
        ctx.lineWidth = Math.max(4, orbR * 0.14);
        ctx.lineCap = 'round';
        ctx.shadowColor = `rgba(${col}, 0.7)`;
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // 2. Subtle audio waveform equalizer glow over the mid-left holographic panel
      // Coordinates mapped directly to the waveform bars in the 16:9 image
      const barCount = 24;
      const wfStartX = width * 0.163;
      const wfEndX = width * 0.303;
      const wfSpan = wfEndX - wfStartX;

      for (let i = 0; i < barCount; i++) {
        const t = i / (barCount - 1);
        const bx = wfStartX + t * wfSpan;
        // Slight perspective slope down-right matching the panel angle in the image
        const by = height * (0.48 + t * 0.014);

        const envelope = Math.sin(t * Math.PI);
        const waveVal =
          0.45 +
          0.55 *
            Math.abs(
              Math.sin(elapsed * 2.4 + i * 0.55) * Math.cos(elapsed * 1.3 - i * 0.3)
            );
        const barH = height * (0.018 + 0.048 * envelope * waveVal);

        // Cyan on left -> purple/pink on right matching original waveform palette
        const r = Math.round(56 + t * 188);
        const g = Math.round(189 - t * 95);
        const b = Math.round(248 - t * 35);
        const alpha = 0.22 + 0.28 * waveVal;

        const barGrad = ctx.createLinearGradient(bx, by - barH, bx, by + barH);
        barGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
        barGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        barGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = barGrad;
        const barW = Math.max(2, wfSpan / (barCount * 1.8));
        ctx.fillRect(bx - barW / 2, by - barH, barW, barH * 2);
      }

      // 3. Flowchart glowing energy pulse moving gently along the 4 bottom-center nodes
      const flowNodes = [
        { x: width * 0.391, y: height * 0.725 },
        { x: width * 0.436, y: height * 0.778 },
        { x: width * 0.478, y: height * 0.708 },
        { x: width * 0.541, y: height * 0.742 },
        { x: width * 0.589, y: height * 0.805 },
      ];
      const flowProgress = (elapsed * 0.22) % 1;
      const segTotal = flowNodes.length - 1;
      const scaled = flowProgress * segTotal;
      const idx = Math.min(Math.max(0, Math.floor(scaled)), segTotal - 1);
      const frac = scaled - idx;
      const n1 = flowNodes[idx] || flowNodes[0];
      const n2 = flowNodes[idx + 1] || flowNodes[flowNodes.length - 1];
      const px = n1.x + (n2.x - n1.x) * frac;
      const py = n1.y + (n2.y - n1.y) * frac;

      const pulseR = Math.max(10, width * 0.015);
      const nodePulse = ctx.createRadialGradient(px, py, 0, px, py, pulseR);
      nodePulse.addColorStop(0, 'rgba(192, 132, 252, 0.75)');
      nodePulse.addColorStop(0.45, 'rgba(56, 189, 248, 0.32)');
      nodePulse.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = nodePulse;
      ctx.beginPath();
      ctx.arc(px, py, pulseR, 0, Math.PI * 2);
      ctx.fill();

      // 4. Slowly orbiting light particles on the central elliptical rings
      for (const p of orbitParticles) {
        p.angle = (p.angle + p.speed * dt + Math.PI * 2) % (Math.PI * 2);
        const lx = Math.cos(p.angle) * (width * p.rxScale);
        const ly = Math.sin(p.angle) * (width * p.ryScale);
        const rx = lx * Math.cos(p.tilt) - ly * Math.sin(p.tilt) + orbCx;
        const ry = lx * Math.sin(p.tilt) + ly * Math.cos(p.tilt) + orbCy;

        const twinkle = 0.55 + 0.45 * Math.sin(elapsed * 2.1 + p.phase);
        const glowR = p.size * 4.5;

        const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, glowR);
        g.addColorStop(0, `rgba(255, 255, 255, ${0.85 * twinkle})`);
        g.addColorStop(0.28, `rgba(${p.color}, ${0.7 * twinkle})`);
        g.addColorStop(1, `rgba(${p.color}, 0)`);

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(rx, ry, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Outer elliptical orbit connecting the holographic panels
      const outerRx = width * 0.35;
      const outerRy = height * 0.33;
      const outerCy = height * 0.44;
      for (const op of outerArcParticles) {
        op.t = (op.t + op.speed * dt) % 1;
        const a = op.t * Math.PI * 2;
        const ox = orbCx + Math.cos(a) * outerRx;
        const oy = outerCy + Math.sin(a) * outerRy;
        const glowR = op.size * 4.2;

        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, glowR);
        g.addColorStop(0, 'rgba(255, 255, 255, 0.72)');
        g.addColorStop(0.3, `rgba(${op.color}, 0.55)`);
        g.addColorStop(1, `rgba(${op.color}, 0)`);

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(ox, oy, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#06020d]" aria-hidden="true">
      {/* Aspect-locked 16:9 stage matching exact object-cover geometry with zero distortion */}
      <div
        ref={stageRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 'max(100vw, calc(100vh * 16 / 9))',
          height: 'max(100vh, calc(100vw * 9 / 16))',
        }}
      >
        {/* Exact original reference image — locked composition, camera angle, and colors */}
        <img
          src="/assets/aistudio/1795422569339_444d86d2.jpg"
          alt=""
          className="w-full h-full object-fill select-none"
          referrerPolicy="no-referrer"
        />

        {/* Central Orb: soft pulsing purple, blue & pink radial aura */}
        <div
          className="absolute left-[50%] top-[41.5%] w-[28%] aspect-square rounded-full mix-blend-screen animate-orb-pulse-color"
          style={{
            background:
              'radial-gradient(circle, rgba(147,197,253,0.45) 0%, rgba(168,85,247,0.34) 38%, rgba(236,72,153,0.2) 64%, rgba(0,0,0,0) 80%)',
          }}
        />

        {/* Central Orb: smooth rotating neon energy halo inside the sphere boundary */}
        <div
          className="absolute left-[50%] top-[41.5%] w-[21.5%] aspect-square rounded-full mix-blend-screen animate-orb-rotate-slow opacity-55"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(56,189,248,0) 0deg, rgba(56,189,248,0.5) 65deg, rgba(168,85,247,0.45) 140deg, rgba(244,114,182,0.48) 220deg, rgba(96,165,250,0.42) 300deg, rgba(56,189,248,0) 360deg)',
            maskImage: 'radial-gradient(circle, black 42%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(circle, black 42%, transparent 72%)',
          }}
        />

        {/* Central Orb: counter-rotating secondary harmonic energy ring */}
        <div
          className="absolute left-[50%] top-[41.5%] w-[19%] aspect-square rounded-full mix-blend-screen animate-orb-rotate-reverse opacity-40"
          style={{
            background:
              'conic-gradient(from 120deg, rgba(236,72,153,0) 0deg, rgba(236,72,153,0.45) 85deg, rgba(56,189,248,0.4) 190deg, rgba(168,85,247,0.38) 280deg, rgba(236,72,153,0) 360deg)',
            maskImage: 'radial-gradient(circle, transparent 24%, black 50%, transparent 74%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 24%, black 50%, transparent 74%)',
          }}
        />

        {/* Orb pedestal subtle purple/blue light pulse */}
        <div
          className="absolute left-[50%] top-[60%] -translate-x-1/2 -translate-y-1/2 w-[20%] h-[7%] rounded-full mix-blend-screen animate-panel-float-b"
          style={{
            background:
              'radial-gradient(ellipse, rgba(192,132,252,0.5) 0%, rgba(96,165,250,0.28) 50%, rgba(0,0,0,0) 78%)',
          }}
        />

        {/* Top-left gallery panel: gentle floating holographic glow */}
        <div
          className="absolute left-[22.5%] top-[7.5%] w-[20%] h-[27.5%] rounded-2xl mix-blend-screen animate-panel-float-a"
          style={{
            background:
              'radial-gradient(circle at 70% 35%, rgba(244,114,182,0.26) 0%, rgba(168,85,247,0.18) 45%, rgba(56,189,248,0.08) 75%, transparent 100%)',
          }}
        />

        {/* Mid-left audio waveform panel: gentle floating glow */}
        <div
          className="absolute left-[13.5%] top-[36.5%] w-[19.5%] h-[27.5%] rounded-2xl mix-blend-screen animate-panel-float-b"
          style={{
            background:
              'radial-gradient(circle at 45% 48%, rgba(56,189,248,0.22) 0%, rgba(168,85,247,0.2) 50%, rgba(236,72,153,0.14) 75%, transparent 100%)',
          }}
        />

        {/* Top-right video editor panel: gentle floating glow & subtle timeline scrubber sweep */}
        <div
          className="absolute left-[56.5%] top-[4.5%] w-[24.2%] h-[29.5%] rounded-2xl mix-blend-screen animate-panel-float-c overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 55% 40%, rgba(168,85,247,0.24) 0%, rgba(56,189,248,0.16) 52%, transparent 82%)',
          }}
        >
          <div
            className="absolute top-[62%] left-[12%] w-[24%] h-[22%] rounded-full blur-md animate-timeline-scrub"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.55), rgba(244,114,182,0.55), transparent)',
            }}
          />
        </div>

        {/* Bottom-right UI chat panel: gentle floating glow */}
        <div
          className="absolute left-[68.2%] top-[36.8%] w-[20.2%] h-[28.2%] rounded-2xl mix-blend-screen animate-panel-float-a"
          style={{
            background:
              'radial-gradient(circle at 45% 45%, rgba(168,85,247,0.22) 0%, rgba(96,165,250,0.16) 52%, transparent 85%)',
          }}
        />

        {/* Bottom-center flowchart panel: gentle floating glow */}
        <div
          className="absolute left-[35.4%] top-[62.8%] w-[26.8%] h-[24.5%] rounded-2xl mix-blend-screen animate-panel-float-c"
          style={{
            background:
              'radial-gradient(circle at 50% 45%, rgba(56,189,248,0.2) 0%, rgba(192,132,252,0.22) 50%, rgba(236,72,153,0.12) 78%, transparent 100%)',
          }}
        />

        {/* Synchronized Canvas layer for orbital particles, flowing orb waves, equalizer & node pulses */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      </div>

      {/* Subtle readability scrim preserving original colors & glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(9, 5, 20, 0.30) 0%, rgba(9, 5, 18, 0.56) 68%, rgba(6, 3, 12, 0.80) 100%)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/58 via-transparent to-[#09090b]/78 pointer-events-none" />
    </div>
  );
};
