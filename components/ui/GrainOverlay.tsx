'use client';

import { useEffect, useRef } from 'react';

/**
 * Global film grain / noise overlay.
 * Renders a 512×512 canvas of random grayscale pixels and tiles it across
 * the viewport. Refreshes every 3 frames for a subtle analog flicker.
 * Sits fixed over everything with pointer-events-none.
 */
export function GrainOverlay({
  opacity = 0.045,
  refreshInterval = 3,
}: {
  opacity?: number;
  refreshInterval?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const size = 512;
    canvas.width = size;
    canvas.height = size;

    let frame = 0;
    let rafId = 0;

    const draw = () => {
      const imageData = ctx.createImageData(size, size);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 25; // low alpha per pixel; overall opacity controlled by CSS
      }
      ctx.putImageData(imageData, 0, 0);
    };

    const loop = () => {
      if (frame % refreshInterval === 0) draw();
      frame++;
      rafId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(rafId);
  }, [refreshInterval]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{
        width: '100vw',
        height: '100vh',
        imageRendering: 'pixelated',
        opacity,
        mixBlendMode: 'multiply',
      }}
      aria-hidden="true"
    />
  );
}
