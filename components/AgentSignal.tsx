'use client';

import { useEffect, useRef } from 'react';
import type { AgentSignalSnapshot } from '@/lib/agent-signal';
import { smoothAudioLevel } from '@/lib/agent-signal';

type Cell = { x: number; y: number; alpha: number; px: number; py: number };

export function AgentSignal({
  activity,
  paused,
}: {
  activity: AgentSignalSnapshot;
  paused: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const current = useRef({ activity, paused });
  const wake = useRef<() => void>(() => {});
  useEffect(() => {
    current.current = { activity, paused };
    wake.current();
  }, [activity, paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const cells: Cell[] = [];
    for (let x = -24; x <= 24; x++)
      for (let y = -9; y <= 9; y++)
        cells.push({ x, y, px: x, py: y, alpha: 0 });
    let frame = 0,
      last = 0,
      clock = 0,
      level = 0,
      transition = 1;
    let visible = true,
      width = 0,
      height = 0;
    let previousState = current.current.activity.state;
    let colors = { ink: '#fcf9f8', blue: '#57b5ef', cyan: '#00c9b1' };

    function draw(now: number, staticFrame = false) {
      frame = 0;
      const elapsed = last ? Math.min(0.07, (now - last) / 1000) : 1 / 30;
      last = now;
      const { activity: snapshot, paused: isPaused } = current.current;
      const still = staticFrame || isPaused || reduced.matches;
      if (!still) clock += elapsed;
      if (snapshot.state !== previousState) {
        transition = 0;
        previousState = snapshot.state;
      }
      transition = Math.min(1, transition + elapsed * 4);
      let measured = 0;
      if (
        !still &&
        (snapshot.state === 'speaking' ||
          (snapshot.state === 'listening' && snapshot.micEnabled))
      ) {
        try {
          measured = snapshot.levelSource?.getVolumeLevel() ?? 0;
        } catch {
          /* A track can disappear during teardown. */
        }
      }
      level = still ? 0 : smoothAudioLevel(measured, level, elapsed);
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      context!.clearRect(0, 0, width, height);
      const gap = Math.min(6.5, (width - 28) / 58);
      const cx = width / 2,
        cy = height / 2;
      context!.strokeStyle = colors.ink;
      context!.lineWidth = 1.5;
      context!.beginPath();
      for (const side of [-1, 1]) {
        context!.moveTo(cx + side * (gap * 28 - 7), cy - gap * 8);
        context!.lineTo(cx + side * gap * 28, cy - gap * 8);
        context!.lineTo(cx + side * gap * 28, cy + gap * 8);
        context!.lineTo(cx + side * (gap * 28 - 7), cy + gap * 8);
      }
      context!.stroke();
      const blend = still ? 1 : 1 - Math.exp(-elapsed * 14);
      for (const p of cells) {
        const { x, y } = p;
        let target = 0;
        if (snapshot.state === 'idle' || snapshot.state === 'ended') {
          const blink = snapshot.state === 'idle' && !still && clock % 6 > 5.8;
          target =
            ((Math.abs(x + 5) <= 1 || Math.abs(x - 5) <= 1) &&
              Math.abs(y + 1) <= (blink ? 0 : 1)) ||
            (Math.abs(x) <= 3 && y === 4)
              ? 0.9
              : 0;
        } else if (snapshot.state === 'connecting') {
          if (Math.abs(y) <= 1 && x % 5 === 0 && Math.abs(x) <= 15)
            target =
              0.2 +
              0.8 * Math.pow(Math.max(0, Math.cos(x * 0.23 - clock * 3)), 5);
        } else if (snapshot.state === 'thinking') {
          if (
            Math.abs(y) <= 1 &&
            (Math.abs(x + 8) <= 1 || Math.abs(x) <= 1 || Math.abs(x - 8) <= 1)
          )
            target =
              0.25 +
              0.75 * Math.pow(Math.max(0, Math.cos(x * 0.2 - clock * 3)), 3);
        } else if (snapshot.state === 'error') {
          target = (x === y || x === -y) && Math.abs(x) <= 4 ? 0.7 : 0;
        } else if (x % 2 === 0) {
          const envelope = Math.exp(-Math.pow(x / 14, 2));
          const texture = 0.45 + 0.55 * Math.sin(x * 0.71 - clock * 4) ** 2;
          const amplitude = still
            ? envelope * 3
            : 0.4 + level * 9 * envelope * texture;
          target =
            Math.max(0, Math.min(1, amplitude - Math.abs(y) + 0.6)) *
            (0.65 + 0.35 * envelope);
        }
        p.alpha += (target - p.alpha) * blend;
        const reach = still ? 0 : Math.sin(transition * Math.PI) * 0.25;
        p.px += (x * (1 + reach) - p.px) * blend;
        p.py += (y * (1 - reach) - p.py) * blend;
        if (p.alpha < 0.015) continue;
        context!.globalAlpha = p.alpha;
        context!.fillStyle = Math.abs(x) <= 2 ? colors.cyan : colors.blue;
        const size = Math.max(1.8, gap * 0.48);
        context!.fillRect(
          Math.round(cx + p.px * gap - size / 2),
          Math.round(cy + p.py * gap - size / 2),
          size,
          size,
        );
      }
      context!.globalAlpha = 1;
      if (
        visible &&
        !document.hidden &&
        !still &&
        (transition < 1 ||
          (snapshot.state !== 'error' && snapshot.state !== 'ended'))
      )
        frame = requestAnimationFrame(draw);
    }
    function schedule() {
      if (!visible) {
        draw(performance.now(), true);
        return;
      }
      if (!frame && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(draw);
      }
    }
    function refresh() {
      const styles = getComputedStyle(canvas!);
      colors = {
        ink: styles.getPropertyValue('--foreground').trim(),
        blue: styles.getPropertyValue('--signal-blue').trim(),
        cyan: styles.getPropertyValue('--signal-cyan').trim(),
      };
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      schedule();
    }
    const resize = new ResizeObserver(refresh);
    resize.observe(canvas);
    const appearance = new MutationObserver(refresh);
    appearance.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
        draw(performance.now(), true);
      }
    });
    intersection.observe(canvas);
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', schedule);
    wake.current = schedule;
    refresh();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      appearance.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      reduced.removeEventListener('change', schedule);
      wake.current = () => {};
    };
  }, []);
  return (
    <canvas ref={canvasRef} className="demo-signal-canvas" aria-hidden="true" />
  );
}
