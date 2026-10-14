// エディタ上部の BGM プレーヤー(再生・音量・開始位置・フェード・クレジット)
import { Music as MusicIcon, Pause, Play, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { DesignAudio } from '../editor/types'
import { BgmPlayer } from '../features/media'
import { usePopover } from './ColorPicker'

const SAFE_URL = /^https:\/\//

export function AudioBar({ audio, onChange }: { audio: DesignAudio; onChange: (a: DesignAudio | undefined, commit?: boolean) => void }) {
  const [playing, setPlaying] = useState(false)
  const player = useRef<BgmPlayer | null>(null)
  const { open, setOpen, ref } = usePopover()
  // 曲が替わったら作り直す
  useEffect(() => {
    let dead = false
    setPlaying(false)
    BgmPlayer.create(audio).then((p) => { if (dead) p?.dispose(); else player.current = p })
    return () => { dead = true; player.current?.dispose(); player.current = null }
  }, [audio.assetId]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { player.current?.setAudio(audio) }, [audio])
  const toggle = async () => {
    const p = player.current
    if (!p) return
    if (p.playing) { await p.stop(false); setPlaying(false) } else { await p.play(); setPlaying(p.playing) }
  }
  const set = (patch: Partial<DesignAudio>, commit = false) => { onChange({ ...audio, ...patch }, commit); if (patch.volume !== undefined) player.current?.setVolume(patch.volume) }
  const c = audio.credit
  return (
    <div className="audio-bar" title="このデザインの BGM">
      <button className="tb-btn" title={playing ? '停止' : 'BGM を試聴'} onClick={toggle}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
      <MusicIcon size={14} />
      <span className="audio-bar-title" title={audio.title}>{audio.title}</span>
      {c && <span className="audio-bar-credit" title="クレジット">
        {c.author ?? '不明'} / {c.source}{c.license ? `(${c.license})` : ''}
        {c.pageUrl && SAFE_URL.test(c.pageUrl) && <> <a href={c.pageUrl} target="_blank" rel="noopener noreferrer">出典</a></>}
      </span>}
      <div className="pop-wrap" ref={ref}>
        <button className={'tb-btn' + (open ? ' on' : '')} title="音量・開始位置・フェード" onClick={() => setOpen(!open)}><SlidersHorizontal size={16} /></button>
        {open && (
          <div className="popover right audio-pop">
            <label className="slider"><span>音量(%)</span>
              <input type="range" min={0} max={100} value={Math.round(audio.volume * 100)} onChange={(e) => set({ volume: +e.target.value / 100 })} onPointerUp={() => onChange(audio, true)} />
              <span className="num">{Math.round(audio.volume * 100)}</span></label>
            <label className="slider"><span>開始(秒)</span>
              <input type="number" className="num" min={0} step={1} value={audio.start} onChange={(e) => set({ start: Math.max(0, +e.target.value || 0) })} onBlur={() => onChange(audio, true)} /></label>
            <label className="slider"><span>フェードイン(秒)</span>
              <input type="number" className="num" min={0} max={10} step={0.5} value={audio.fadeIn} onChange={(e) => set({ fadeIn: Math.max(0, +e.target.value || 0) })} onBlur={() => onChange(audio, true)} /></label>
            <label className="slider"><span>フェードアウト(秒)</span>
              <input type="number" className="num" min={0} max={10} step={0.5} value={audio.fadeOut} onChange={(e) => set({ fadeOut: Math.max(0, +e.target.value || 0) })} onBlur={() => onChange(audio, true)} /></label>
            <p className="hint">動画(MP4/WebM)の書き出しとプレゼンで流れます。曲が短いときは繰り返します。{c?.license?.startsWith('CC BY') ? ' CC BY の曲は、公開する際に作者名・出典を表記してください。' : ''}</p>
          </div>
        )}
      </div>
      <button className="tb-btn" title="BGM を外す" onClick={() => { player.current?.dispose(); onChange(undefined, true) }}><X size={16} /></button>
    </div>
  )
}
