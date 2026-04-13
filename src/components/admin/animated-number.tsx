"use client"

import { useEffect } from "react"
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion"

interface AnimatedNumberProps {
  value: number | string
}

export function AnimatedNumber({ value }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { stiffness: 100, damping: 20 })
  const display = useTransform(spring, (latest) => Math.floor(latest).toLocaleString())

  useEffect(() => {
    if (typeof value === "number") {
      motionValue.set(value)
    }
  }, [value, motionValue])

  if (typeof value === "string") {
    return <span>{value}</span>
  }

  return <motion.span>{display}</motion.span>
}


