import { useEffect, useState } from 'react'

/** スマホ幅(この幅以下でモバイル用の画面にする。CSS の @media と合わせる) */
export const MOBILE_Q = '(max-width: 760px)'

export const isMobileNow = () => typeof matchMedia !== 'undefined' && matchMedia(MOBILE_Q).matches

/** 画面幅がスマホ幅かどうか(向きを変えたり窓の幅を変えると追従する) */
export function useIsMobile() {
  const [m, setM] = useState(isMobileNow)
  useEffect(() => {
    const mq = matchMedia(MOBILE_Q)
    const f = () => setM(mq.matches)
    f()
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  return m
}
