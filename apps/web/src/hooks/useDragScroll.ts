'use client'

import { useRef, useEffect } from 'react'

/**
 * useDragScroll — enables click-and-drag horizontal scrolling on desktop.
 * Mobile users get native touch scrolling for free; this just adds
 * the same affordance for mouse users.
 *
 * Usage:
 *   const scrollRef = useDragScroll<HTMLDivElement>()
 *   <div ref={scrollRef} className="shelf-track">...</div>
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let isDown = false
    let startX = 0
    let scrollLeft = 0

    const onMouseDown = (e: MouseEvent) => {
      isDown = true
      el.style.cursor = 'grabbing'
      startX = e.pageX - el.offsetLeft
      scrollLeft = el.scrollLeft
    }

    const onMouseLeaveOrUp = () => {
      isDown = false
      el.style.cursor = 'grab'
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return
      e.preventDefault()
      const x = e.pageX - el.offsetLeft
      const walk = (x - startX) * 1.2
      el.scrollLeft = scrollLeft - walk
    }

    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('mouseleave', onMouseLeaveOrUp)
    el.addEventListener('mouseup', onMouseLeaveOrUp)
    el.addEventListener('mousemove', onMouseMove)

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mouseleave', onMouseLeaveOrUp)
      el.removeEventListener('mouseup', onMouseLeaveOrUp)
      el.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return ref
}
