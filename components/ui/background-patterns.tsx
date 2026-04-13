"use client"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

// Hydration guard — all patterns are purely decorative and client-only
function useClientOnly() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

// ── Neural Network Paths ─────────────────────────────────────────────────────
export function NeuralPaths({ className = "" }: { className?: string }) {
  const mounted = useClientOnly()
  if (!mounted) return null

  // 3× larger viewBox = elements appear 3× smaller
  const nodes = Array.from({ length: 120 }, (_, i) => ({
    x: ((i * 137.5) % 4800),
    y: ((i * 97.3) % 3600),
    id: `node-${i}`,
  }))

  const connections: { id: string; d: string; delay: number }[] = []
  nodes.forEach((node, i) => {
    nodes.forEach((other, j) => {
      if (i >= j) return
      const dist = Math.sqrt((node.x - other.x) ** 2 + (node.y - other.y) ** 2)
      if (dist < 160 && (i + j) % 3 !== 0) {
        connections.push({
          id: `c-${i}-${j}`,
          d: `M${node.x},${node.y} L${other.x},${other.y}`,
          delay: (i * 0.4) % 10,
        })
      }
    })
  })

  return (
    <svg className={`absolute inset-0 w-full h-full ${className}`} viewBox="0 0 4800 3600" preserveAspectRatio="xMidYMid slice">
      {connections.map((c) => (
        <motion.path
          key={c.id}
          d={c.d}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: 6, delay: c.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {nodes.map((node) => (
        <motion.circle
          key={node.id}
          cx={node.x}
          cy={node.y}
          r="5"
          fill="currentColor"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1, 1.3, 1], opacity: [0, 0.7, 1, 0.7] }}
          transition={{ duration: 4, delay: (parseInt(node.id.split("-")[1]) * 0.3) % 8, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </svg>
  )
}

// ── Organic Flow Paths ───────────────────────────────────────────────────────
export function FlowPaths({ className = "" }: { className?: string }) {
  const mounted = useClientOnly()
  if (!mounted) return null

  // 3× larger viewBox, denser waves spread across full canvas
  const flowPaths = Array.from({ length: 28 }, (_, i) => ({
    id: `flow-${i}`,
    d: `M-300,${120 + i * 76} Q600,${120 + i * 76 - 56 + i * 3} 1500,${120 + i * 76} T2700,${120 + i * 76}`,
    strokeWidth: 1.5 + i * 0.2,
    baseOpacity: 0.12 + i * 0.025,
    delay: i * 0.7,
  }))

  return (
    <svg className={`absolute inset-0 w-full h-full ${className}`} viewBox="0 0 2400 2400" preserveAspectRatio="xMidYMid slice">
      {flowPaths.map((p) => (
        <motion.path
          key={p.id}
          d={p.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={p.strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{
            pathLength: [0, 1, 0.8, 0],
            opacity: [0, p.baseOpacity * 5, p.baseOpacity * 3, 0],
          }}
          transition={{ duration: 14, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </svg>
  )
}

// ── Geometric Grid Paths ─────────────────────────────────────────────────────
export function GeometricPaths({ className = "" }: { className?: string }) {
  const mounted = useClientOnly()
  if (!mounted) return null

  // gridSize 28 on a viewport-sized canvas ≈ 25px squares on screen
  const gridSize = 28
  const paths: { id: string; d: string; delay: number }[] = []
  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 20; y++) {
      // Pseudo-random scatter using prime multiplication hash — no diagonal bias
      const hash = ((x * 1664525 + y * 1013904223) >>> 0) % 1000
      if (hash < 220) {
        paths.push({
          id: `g-${x}-${y}`,
          d: `M${x * gridSize},${y * gridSize} L${(x + 1) * gridSize},${y * gridSize} L${(x + 1) * gridSize},${(y + 1) * gridSize} L${x * gridSize},${(y + 1) * gridSize} Z`,
          // Scatter delays using different primes — no diagonal wave
          delay: ((x * 73 + y * 31) % 80) * 0.1,
        })
      }
    }
  }

  return (
    <svg className={`absolute inset-0 w-full h-full ${className}`} viewBox="0 0 896 560" preserveAspectRatio="xMidYMid slice">
      {paths.map((p) => (
        <motion.path
          key={p.id}
          d={p.d}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: 8, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </svg>
  )
}

// ── Spiral Paths ─────────────────────────────────────────────────────────────
export function SpiralPaths({ className = "" }: { className?: string }) {
  const mounted = useClientOnly()
  if (!mounted) return null

  // 30 spirals on a large canvas — radius ~100-160px in SVG ≈ 15-25px on screen
  const spirals = Array.from({ length: 30 }, (_, i) => {
    const cx = 400 + (i % 7) * 700
    const cy = 400 + Math.floor(i / 7) * 600
    const radius = 100 + (i % 5) * 15   // 100–160px in SVG, ~15–25px on screen
    const turns = 2 + (i % 4) * 0.4
    let d = `M${cx + radius},${cy}`
    for (let a = 0; a <= turns * 360; a += 6) {
      const rad = (a * Math.PI) / 180
      const cur = radius * (1 - a / (turns * 360))
      d += ` L${cx + cur * Math.cos(rad)},${cy + cur * Math.sin(rad)}`
    }
    return { id: `sp-${i}`, d, delay: ((i * 73) % 12) }
  })

  return (
    <svg className={`absolute inset-0 w-full h-full ${className}`} viewBox="0 0 5200 3600" preserveAspectRatio="xMidYMid slice">
      {spirals.map((s) => (
        <motion.path
          key={s.id}
          d={s.d}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0], rotate: [0, 360] }}
          transition={{
            pathLength: { duration: 12, repeat: Infinity, ease: "easeInOut", delay: s.delay },
            rotate: { duration: 22, repeat: Infinity, ease: "linear", delay: s.delay },
          }}
          style={{ transformOrigin: "center" }}
        />
      ))}
    </svg>
  )
}
