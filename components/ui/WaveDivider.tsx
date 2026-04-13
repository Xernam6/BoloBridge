'use client';

import { useRef, useEffect } from 'react';

interface WaveDividerProps {
  className?: string;
}

export function WaveDivider({ className }: WaveDividerProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const progressRef = useRef(0);
  const xRef = useRef(0.2);
  const timeRef = useRef(Math.PI / 2);
  const reqIdRef = useRef<number | null>(null);

  useEffect(() => {
    setPath(0);
  }, []);

  const setPath = (progress: number) => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (pathRef.current) {
      pathRef.current.setAttributeNS(
        null,
        'd',
        `M0 50 Q${width * xRef.current} ${50 + progress * 0.4}, ${width} 50`
      );
    }
  };

  const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;

  const handleMouseEnter = () => {
    if (reqIdRef.current) {
      cancelAnimationFrame(reqIdRef.current);
      timeRef.current = Math.PI / 2;
      progressRef.current = 0;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { movementY, clientX } = e;
    if (pathRef.current) {
      const bounds = pathRef.current.getBoundingClientRect();
      xRef.current = (clientX - bounds.left) / bounds.width;
      progressRef.current += movementY;
      setPath(progressRef.current);
    }
  };

  const handleMouseLeave = () => {
    animateOut();
  };

  const animateOut = () => {
    const newProgress = progressRef.current * Math.sin(timeRef.current);
    progressRef.current = lerp(progressRef.current, 0, 0.025);
    timeRef.current += 0.2;
    setPath(newProgress);
    if (Math.abs(progressRef.current) > 0.75) {
      reqIdRef.current = requestAnimationFrame(animateOut);
    } else {
      timeRef.current = Math.PI / 2;
      progressRef.current = 0;
    }
  };

  return (
    <div className={`relative h-px w-full ${className ?? ''}`}>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative -top-5 z-10 h-10 w-full hover:-top-[80px] hover:h-[160px]"
      />
      <svg className="absolute -top-[50px] h-[100px] w-full">
        <path
          ref={pathRef}
          className="fill-none stroke-teal/30 dark:stroke-teal/20"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}
