'use client';

import { motion } from 'framer-motion';

interface Tab {
  key: string;
  label: string;
  icon?: string;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export function AnimatedTabs({ tabs, activeTab, onTabChange, className = '' }: AnimatedTabsProps) {
  return (
    <div
      className={`bg-[#F5F1EB] dark:bg-[#2D3142] rounded-2xl p-1.5 overflow-x-auto no-scrollbar ${className}`}
    >
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-body font-medium relative z-10 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-white'
                  : 'text-[#64748B] dark:text-white/60 hover:text-navy dark:hover:text-white/80'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-pill"
                  className="absolute inset-0 bg-amber rounded-xl"
                  style={{ zIndex: -1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.icon && <span>{tab.icon}</span>}
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
