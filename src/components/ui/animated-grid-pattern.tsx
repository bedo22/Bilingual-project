"use client"

import {
  ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

export interface AnimatedGridPatternProps extends ComponentPropsWithoutRef<"svg"> {
  width?: number
  height?: number
  x?: number
  y?: number
  strokeDasharray?: number
  numSquares?: number
  maxOpacity?: number
  duration?: number
  repeatDelay?: number
}

type Square = {
  id: number
  pos: [number, number]
  iteration: number
}

export function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 50,
  className,
  maxOpacity = 0.5,
  duration = 4,
  repeatDelay = 0.5,
  ...props
}: AnimatedGridPatternProps) {
  const id = useId()
  const containerRef = useRef<SVGSVGElement | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [seed, setSeed] = useState(0)

  const seededValue = useCallback((value: number) => {
    const normalized = Math.sin(value) * 10000
    return normalized - Math.floor(normalized)
  }, [])

  const getPos = useCallback(
    (index: number): [number, number] => {
      const xSeed = seededValue(index + seed + 1)
      const ySeed = seededValue(index + seed + 2)

      return [
        Math.floor((xSeed * dimensions.width) / width),
        Math.floor((ySeed * dimensions.height) / height),
      ]
    },
    [dimensions.height, dimensions.width, seededValue, seed, width, height]
  )

  const generateSquares = useCallback(
    (count: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        pos: getPos(i),
        iteration: seed,
      })),
    [getPos, seed]
  )

  const updateSquarePosition = useCallback((squareId: number) => {
    setSeed((currentSeed) => currentSeed + squareId + 1)
  }, [])

  const squares = useMemo(
    () => (dimensions.width && dimensions.height ? generateSquares(numSquares) : []),
    [dimensions.width, dimensions.height, generateSquares, numSquares, seed]
  )

  useEffect(() => {
    const element = containerRef.current
    if (!element) return undefined

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions((currentDimensions) => {
          const nextWidth = entry.contentRect.width
          const nextHeight = entry.contentRect.height
          if (
            currentDimensions.width === nextWidth &&
            currentDimensions.height === nextHeight
          ) {
            return currentDimensions
          }
          setSeed((currentSeed) => currentSeed + 1)
          return { width: nextWidth, height: nextHeight }
        })
      }
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30",
        className
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      <svg x={x} y={y} className="overflow-visible">
        {squares.map(({ pos: [squareX, squareY], id, iteration }, index) => (
          <motion.rect
            initial={{ opacity: 0 }}
            animate={{ opacity: maxOpacity }}
            transition={{
              duration,
              repeat: 1,
              delay: index * 0.1,
              repeatType: "reverse",
              repeatDelay,
            }}
            onAnimationComplete={() => updateSquarePosition(id)}
            key={`${id}-${iteration}`}
            width={width - 1}
            height={height - 1}
            x={squareX * width + 1}
            y={squareY * height + 1}
            fill="currentColor"
            strokeWidth="0"
          />
        ))}
      </svg>
    </svg>
  )
}
