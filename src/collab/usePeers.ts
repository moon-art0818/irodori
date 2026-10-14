import { useEffect, useRef, useState } from 'react'
import type { Awareness } from 'y-protocols/awareness'
import { readPeers, type PeerState } from './presence'

/** 自分以外の参加者(カーソルの細かい動きでは再描画しない: 名前・ページ・選択が同じなら更新しない) */
export function usePeers(a: Awareness | null, withCursor = false): PeerState[] {
  const [peers, setPeers] = useState<PeerState[]>([])
  const last = useRef('')
  useEffect(() => {
    if (!a) { setPeers([]); return }
    const f = () => {
      const next = readPeers(a)
      const key = JSON.stringify(withCursor ? next : next.map((p) => ({ ...p, cursor: null, sel: [], page: null })))
      if (key === last.current) return
      last.current = key
      setPeers(next)
    }
    f()
    a.on('change', f)
    return () => { a.off('change', f) }
  }, [a, withCursor])
  return peers
}
