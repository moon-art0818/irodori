import { useEffect, useState } from 'react'

/** ライト/ダーク。初期値は OS の設定。選んだ値はこの端末に保存 */
export function useTheme(): ['light' | 'dark', () => void] {
  const sys = () => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const [t, setT] = useState<'light' | 'dark'>(() => { try { return (localStorage.getItem('irodori-theme') as any) || sys() } catch { return sys() } })
  useEffect(() => { document.documentElement.dataset.theme = t; try { localStorage.setItem('irodori-theme', t) } catch { /* */ } }, [t])
  return [t, () => setT((x) => (x === 'dark' ? 'light' : 'dark'))]
}
// 読み込み直後にちらつかないよう、保存済みのテーマを先に当てる
try { const v = localStorage.getItem('irodori-theme'); if (v) document.documentElement.dataset.theme = v } catch { /* */ }
