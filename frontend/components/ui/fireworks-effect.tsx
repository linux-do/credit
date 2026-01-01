"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  color: string
  decay: number
}

interface Firework {
  x: number
  y: number
  targetY: number
  vx: number
  vy: number
  color: string
  particles: Particle[]
  exploded: boolean
  dead: boolean
}

export function FireworksEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let fireworks: Firework[] = []

    const colors = [
      "#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#8f00ff",
      "#ff1493", "#00bfff", "#ffd700", "#ff4500", "#32cd32"
    ]

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createFirework = () => {
      const x = Math.random() * canvas.width
      const y = canvas.height

      const targetY = canvas.height * 0.2 + Math.random() * (canvas.height * 0.5)
      const speed = 8 + Math.random() * 5

      fireworks.push({
        x,
        y,
        targetY,
        vx: (Math.random() - 0.5) * 3,
        vy: -speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        particles: [],
        exploded: false,
        dead: false
      })
    }

    const createParticles = (x: number, y: number, color: string) => {
      const particleCount = 50 + Math.random() * 50
      const particles: Particle[] = []

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 5 + 1
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: color,
          decay: Math.random() * 0.01 + 0.005
        })
      }
      return particles
    }

    const updateAndDraw = () => {
      if (!ctx || !canvas) return

      ctx.globalCompositeOperation = "destination-out"
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.globalCompositeOperation = "lighter"

      if (Math.random() < 0.04) {
        createFirework()
      }

      fireworks.forEach((fw) => {
        if (fw.dead) return

        if (!fw.exploded) {
          ctx.beginPath()
          ctx.arc(fw.x, fw.y, 2, 0, Math.PI * 2)
          ctx.fillStyle = fw.color
          ctx.fill()

          fw.x += fw.vx
          fw.y += fw.vy
          fw.vy += 0.15

          if (fw.vy >= 0 || fw.y <= fw.targetY) {
            fw.exploded = true
            fw.particles = createParticles(fw.x, fw.y, fw.color)
          }
        } else {
          for (let i = fw.particles.length - 1; i >= 0; i--) {
            const p = fw.particles[i]

            ctx.beginPath()
            ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
            ctx.fillStyle = p.color
            ctx.globalAlpha = p.alpha
            ctx.fill()
            ctx.globalAlpha = 1

            p.x += p.vx
            p.y += p.vy
            p.vy += 0.1
            p.alpha -= p.decay

            if (p.alpha <= 0) {
              fw.particles.splice(i, 1)
            }
          }

          if (fw.particles.length === 0) {
            fw.dead = true
          }
        }
      })

      fireworks = fireworks.filter(fw => !fw.dead)

      animationFrameId = requestAnimationFrame(updateAndDraw)
    }

    resizeCanvas()
    updateAndDraw()

    window.addEventListener("resize", resizeCanvas)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ background: "transparent" }}
    />
  )
}
