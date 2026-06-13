import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Returns whether scroll-reactive chrome should be visible.
 *
 * Mirrors the top navbar's hide-on-scroll thresholds (see
 * `components/layout/Navbar.tsx`) so dependent chrome — e.g. the in-page
 * section-jumper bar — hides and reveals in lock-step with the navbar.
 * Hides when scrolling down (past 80px), reveals when scrolling up or near the top.
 */
export function useHideOnScroll(): boolean {
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)
  const location = useLocation()

  useEffect(() => {
    setVisible(true)
    lastY.current = window.scrollY

    const onScroll = () => {
      const current = window.scrollY
      const delta = current - lastY.current
      if (current <= 10) setVisible(true)
      else if (delta > 5 && current > 80) setVisible(false)
      else if (delta < -5) setVisible(true)
      lastY.current = current
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [location.pathname])

  return visible
}
