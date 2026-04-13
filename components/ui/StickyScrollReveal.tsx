"use client";

import React, { useRef, useState, useEffect } from "react";
import { useMotionValueEvent, useScroll, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StickyScrollItem {
  title: string;
  description: string;
  content?: React.ReactNode;
  icon?: React.ReactNode;
  gradient?: string;
}

export function StickyScrollReveal({
  content,
  contentClassName,
}: {
  content: StickyScrollItem[];
  contentClassName?: string;
}) {
  const [activeCard, setActiveCard] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    container: ref,
    offset: ["start start", "end start"],
  });
  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const cardsBreakpoints = content.map((_, index) => index / cardLength);
    const closestBreakpointIndex = cardsBreakpoints.reduce(
      (acc, breakpoint, index) => {
        const distance = Math.abs(latest - breakpoint);
        if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
          return index;
        }
        return acc;
      },
      0
    );
    setActiveCard(closestBreakpointIndex);
  });

  const backgroundColors = [
    "rgb(15, 10, 30)",  // deep navy
    "rgb(10, 8, 20)",   // darker
    "rgb(20, 12, 35)",  // violet-navy
  ];

  const linearGradients = [
    "linear-gradient(to bottom right, rgb(45, 212, 191), rgb(16, 185, 129))", // teal to emerald
    "linear-gradient(to bottom right, rgb(139, 92, 246), rgb(124, 92, 191))", // violet to purple
    "linear-gradient(to bottom right, rgb(255, 107, 107), rgb(251, 146, 60))", // coral to amber
  ];

  const [backgroundGradient, setBackgroundGradient] = useState(linearGradients[0]);

  useEffect(() => {
    setBackgroundGradient(linearGradients[activeCard % linearGradients.length]);
  }, [activeCard]);

  return (
    <motion.div
      animate={{
        backgroundColor: backgroundColors[activeCard % backgroundColors.length],
      }}
      className="h-[30rem] overflow-y-auto flex justify-center relative space-x-10 rounded-3xl p-10"
      ref={ref}
    >
      <div className="relative flex items-start px-4">
        <div className="max-w-2xl">
          {content.map((item, index) => (
            <div key={item.title + index} className="my-20">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: activeCard === index ? 1 : 0.3 }}
                className="flex items-center gap-3 mb-4"
              >
                {item.icon && (
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    {item.icon}
                  </div>
                )}
                <h2 className="text-2xl font-bold text-white">
                  {item.title}
                </h2>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: activeCard === index ? 1 : 0.3 }}
                className="text-base text-white/60 max-w-sm mt-4 leading-relaxed"
              >
                {item.description}
              </motion.p>
            </div>
          ))}
          <div className="h-40" />
        </div>
      </div>
      <div
        style={{ background: backgroundGradient }}
        className={cn(
          "hidden lg:block h-60 w-80 rounded-2xl sticky top-10 overflow-hidden transition-all duration-700",
          contentClassName
        )}
      >
        {content[activeCard].content ?? null}
      </div>
    </motion.div>
  );
}
