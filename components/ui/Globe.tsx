"use client";

import createGlobe, { COBEOptions } from "cobe";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 1.4,
  mapSamples: 16000,
  mapBrightness: 7,
  baseColor: [0.90, 0.88, 0.95],   // soft violet-tinted off-white (land)
  markerColor: [0.76, 0.58, 0.42], // warm camel/coral (markers)
  glowColor: [0.36, 0.30, 0.60],   // deep violet glow
  devicePixelRatio: 2,
  markers: [
    // underserved / high-need regions — South Asia, Sub-Saharan Africa, SE Asia, Latin America
    { location: [19.076, 72.8777], size: 0.1 },   // Mumbai
    { location: [28.6139, 77.209], size: 0.09 },   // Delhi
    { location: [23.8103, 90.4125], size: 0.08 },  // Dhaka
    { location: [6.5244, 3.3792], size: 0.09 },    // Lagos
    { location: [-1.2921, 36.8219], size: 0.07 },  // Nairobi
    { location: [14.6928, -17.4467], size: 0.06 }, // Dakar
    { location: [13.5127, 2.1128], size: 0.06 },   // Niamey
    { location: [14.0583, 108.2772], size: 0.07 }, // Vietnam
    { location: [3.1390, 101.6869], size: 0.06 },  // Kuala Lumpur
    { location: [-12.0464, -77.0428], size: 0.07 },// Lima
    { location: [-23.5505, -46.6333], size: 0.08 },// São Paulo
    { location: [19.4326, -99.1332], size: 0.07 }, // Mexico City
  ],
};

export function InteractiveGlobe({
  className,
  config = GLOBE_CONFIG,
}: {
  className?: string;
  config?: COBEOptions;
}) {
  let phi = 0;
  let width = 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const [r, setR] = useState(0);

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab";
    }
  };

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      setR(delta / 200);
    }
  };

  const onResize = () => {
    if (canvasRef.current) {
      width = canvasRef.current.offsetWidth;
    }
  };

  useEffect(() => {
    window.addEventListener("resize", onResize);
    onResize();

    let currentR = r;
    const globe = createGlobe(canvasRef.current!, {
      ...config,
      width: width * 2,
      height: width * 2,
    });

    // Animation loop
    let rafId: number;
    const animate = () => {
      if (pointerInteracting.current === null) phi += 0.005;
      globe.update({
        phi: phi + r,
        width: width * 2,
        height: width * 2,
      });
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    setTimeout(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = "1";
    });

    return () => {
      cancelAnimationFrame(rafId);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative aspect-square w-full max-w-[600px]",
        className
      )}
    >
      <canvas
        className={cn(
          "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]"
        )}
        ref={canvasRef}
        onPointerDown={(e) =>
          updatePointerInteraction(
            e.clientX - pointerInteractionMovement.current
          )
        }
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  );
}
