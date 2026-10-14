// 音楽タブ: BGM を設定する(自分の音声ファイル / Openverse の CC0・パブリックドメイン・CC BY)
import { Music as MusicIcon, Pause, Play, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { putMediaAsset } from '../editor/assets'
import type { DesignAudio } from '../editor/types'
import { fetchBlob, fmtTime, notifyCollabAudio, notifyCollabProblem, searchOpenverseAudio, type AudioHit } from '../features/media'
import { collabMediaProblem } from '../editor/assets'

export const DEFAULT_AUDIO = { volume: 0.6, start: 0, fadeIn: 1, fadeOut: 2 }

/** 自分の音声ファイルを BGM にする(ドロップからも使う) */
export async function audioFromFile(f: File): Promise<DesignAudio> {
  if (!f.type.startsWith('audio/')) throw new Error('音声ファイルではありません')
  const { id } = await putMediaAsset(f)
  notifyCollabProblem(collabMediaProblem(f), 'この音声')
  notifyCollabAudio()
  return { assetId: id, title: f.name.replace(/\.\w+$/, ''), ...DEFAULT_AUDIO }
}

export function MusicTab({ audio, onAudio }: { audio?: DesignAudio; onAudio: (a: DesignAudio | undefined) => void }) {
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<'music' | 'sound_effect'>('music')
  const [items, setItems] = useState<AudioHit[]>([])
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [adding, setAdding] = useState('')
  const [err, setErr] = useState('')
  const [playing, setPlaying] = useState('')
  const player = useRef<HTMLAudioElement | null>(null)
  const term = useRef('')
  const load = async (query: string, p: number, k = kind) => {
    setBusy(true); setErr('')
    try {
      const res = await searchOpenverseAudio(query, p, k)
      setItems((prev) => (p === 1 ? res : [...prev, ...res]))
      setPage(p)
    } catch (e: any) { setErr(e?.message ?? String(e)) }
    finally { setBusy(false) }
  }
  useEffect(() => { load('', 1) }, [])
  useEffect(() => () => { player.current?.pause() }, [])
  const preview = (h: AudioHit) => {
    if (playing === h.id) { player.current?.pause(); setPlaying(''); return }
    player.current?.pause()
    const a = new Audio(h.url)
    a.onended = () => setPlaying('')
    a.onerror = () => { setPlaying(''); setErr('この曲は試聴できませんでした') }
    player.current = a
    setPlaying(h.id)
    a.play().catch(() => setPlaying(''))
  }
  const useAsBgm = async (h: AudioHit) => {
    setAdding(h.id); setErr('')
    try {
      const raw = await fetchBlob(h.url)
      const blob = raw.type.startsWith('audio/') ? raw : new Blob([raw], { type: 'audio/mpeg' })
      const { id } = await putMediaAsset(blob)
      onAudio({
        assetId: id, title: h.title, ...DEFAULT_AUDIO,
        credit: { author: h.creator, pageUrl: h.pageUrl, source: h.provider, license: h.licenseLabel },
      })
      notifyCollabProblem(collabMediaProblem(blob), 'この音声')
      notifyCollabAudio()
      player.current?.pause(); setPlaying('')
    } catch (e: any) { setErr('この曲は取り込めませんでした: ' + (e?.message ?? e)) }
    finally { setAdding('') }
  }
  const onFile = async (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    setErr('')
    try { onAudio(await audioFromFile(f)) } catch (e: any) { setErr(e?.message ?? String(e)) }
  }
  return (
    <>
      {audio && (
        <div className="bgm-now">
          <MusicIcon size={16} /><span className="bgm-now-title" title={audio.title}>{audio.title}</span>
          <button className="tb-btn danger" title="BGM を外す" onClick={() => onAudio(undefined)}><Trash2 size={16} /></button>
        </div>
      )}
      <label className="upload-btn">
        <MusicIcon size={18} /> 音声ファイルをアップロード
        <input type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg" hidden onChange={(e) => { void onFile(e.target.files); e.target.value = '' }} />
      </label>
      <p className="hint">mp3・m4a・wav・ogg。ここで選んだ曲が、このデザインの BGM(1 本)になります。画面上部のバーで試聴・音量・フェードを調整できます。</p>
      <div className="sec-title">曲を探す(Openverse)</div>
      <div className="row src-tabs">
        <button className={'chip' + (kind === 'music' ? ' on' : '')} onClick={() => { setKind('music'); setItems([]); load(term.current, 1, 'music') }}>音楽</button>
        <button className={'chip' + (kind === 'sound_effect' ? ' on' : '')} onClick={() => { setKind('sound_effect'); setItems([]); load(term.current, 1, 'sound_effect') }}>効果音</button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); term.current = q; load(q, 1) }}>
        <input className="search" placeholder="曲を検索(例: piano、calm、upbeat)" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      <p className="hint">商用利用できる CC0・パブリックドメイン・CC BY のみ(BY-SA・NC・ND は除外)。「CC BY」の曲は作者のクレジット表記が必要です(BGM に設定すると上部に表示されます)。</p>
      {err && <p className="error">{err}</p>}
      <div className="audio-list">
        {items.map((h) => (
          <div key={h.id} className={'audio-row' + (adding === h.id ? ' busy' : '')}>
            <button className="tb-btn" title={playing === h.id ? '停止' : '試聴'} onClick={() => preview(h)}>{playing === h.id ? <Pause size={16} /> : <Play size={16} />}</button>
            <div className="audio-meta">
              <div className="audio-title" title={h.title}>{h.title}</div>
              <div className="audio-sub">{h.creator} · {h.provider} · {h.licenseLabel}{h.duration ? ` · ${fmtTime(h.duration)}` : ''}</div>
            </div>
            <button className="chip" disabled={!!adding} onClick={() => useAsBgm(h)}>BGMにする</button>
          </div>
        ))}
      </div>
      {!busy && items.length === 0 && !err && <p className="hint">見つかりませんでした。英語でも試してみてください。</p>}
      {items.length > 0 && <button className="chip wide" disabled={busy} onClick={() => load(term.current, page + 1)}>{busy ? '読み込み中…' : 'もっと見る'}</button>}
    </>
  )
}
