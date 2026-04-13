"use client"

import { useEffect } from "react"
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion"

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedCounter({ value, duration = 1.5, className = "" }: AnimatedCounterProps) {
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { stiffness: 50, damping: 30 })
  const display = useTransform(spring, (latest) => Math.floor(latest))

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  return <motion.span className={className}>{display}</motion.span>
}


