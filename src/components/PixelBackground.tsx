import { useEffect, useRef } from 'react'

/** One low-frequency clock; decorative canvas is never part of the accessibility tree. */
export function PixelBackground() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, last = 0
    function draw(time: number) {
      const width = innerWidth, height = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2)
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr; canvas.height = height * dpr
      }
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.clearRect(0, 0, width, height)
      const tick = reduced.matches ? 0 : time / 1000
      for (let x = 0; x < width; x += 28) {
        for (let y = 0; y < height; y += 28) {
          const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
          const noise = seed - Math.floor(seed)
          if (noise < .79) continue
          const pulse = .5 + .5 * Math.sin(tick * .65 + noise * 42 + y * .005)
          ctx!.fillStyle = `rgba(29,196,46,${.025 + pulse * .13})`
          ctx!.fillRect(x, y, noise > .96 ? 6 : 3, noise > .96 ? 6 : 3)
        }
      }
    }
    function loop(time: number) {
      if (time - last > 80) { draw(time); last = time }
      frame = requestAnimationFrame(loop)
    }
    function restart() {
      cancelAnimationFrame(frame)
      draw(performance.now())
      if (!document.hidden && !reduced.matches) frame = requestAnimationFrame(loop)
    }
    restart()
    document.addEventListener('visibilitychange', restart)
    reduced.addEventListener('change', restart)
    window.addEventListener('resize', restart)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', restart); reduced.removeEventListener('change', restart); window.removeEventListener('resize', restart) }
  }, [])
  return <div className="pixel-background" aria-hidden="true"><canvas ref={ref}/><div className="pixel-grid"/></div>
}
