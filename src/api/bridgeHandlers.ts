// AI エージェント(MCP サーバー)からの依頼に、ブラウザ側で答える処理
import { jsPDF } from 'jspdf'
import { renderPage, renderPageSVG } from '../editor/core'
import { fileRepo, newPageId } from '../editor/repo'
import { TEMPLATES, templateToJSON, templatePagesJSON, pageCount } from '../data/templates'
import { SIZES } from '../data/sizes'
import { startBridge } from './local'

export function startLocalBridge() {
  return startBridge({
    /** テンプレ一覧 */
    async templates(m) {
      const q = String(m.query ?? '')
      return TEMPLATES.filter((t) => !q || (t.name + t.category + (t.tags ?? []).join(' ')).includes(q)).map((t) => ({ id: t.id, name: t.name, category: t.category, width: t.w, height: t.h, pages: pageCount(t) }))
    },
    /** サイズのプリセット一覧 */
    async sizes() { return SIZES.map((s) => ({ id: s.id, label: s.label, group: s.group, width: s.w, height: s.h, print: s.print ?? null })) },
    /** テンプレを適用: mode = replace(指定ページを置換)/ append(ページを追加) */
    async template(m) {
      const doc = await fileRepo.get(m.id)
      if (!doc) throw new Error(`デザイン ${m.id} が見つかりません`)
      const t = TEMPLATES.find((x) => x.id === m.templateId)
      if (!t) throw new Error(`テンプレ ${m.templateId} が見つかりません`)
      if (m.mode === 'append-all') { for (const json of templatePagesJSON(t, doc.width, doc.height)) doc.pages.push({ id: newPageId(), json }) ; await fileRepo.put(doc, { baseUpdatedAt: doc.updatedAt }); return { ok: true, pages: doc.pages.length } }
      const json = templateToJSON(t, doc.width, doc.height, Math.max(0, (m.templatePage ?? 1) - 1))
      if (m.mode === 'append') doc.pages.push({ id: newPageId(), json })
      else { const i = Math.max(0, Math.min(doc.pages.length - 1, (m.page ?? 1) - 1)); doc.pages[i] = { ...doc.pages[i], json } }
      await fileRepo.put(doc, { baseUpdatedAt: doc.updatedAt })
      return { ok: true, pages: doc.pages.length }
    },
    /** 品質の自動点検(AI が review にする前に使う) */
    async check(m) {
      const doc = await fileRepo.get(m.id)
      if (!doc) throw new Error(`デザイン ${m.id} が見つかりません`)
      const q: any = await import('../features/quality')
      const issues = await Promise.resolve(q.checkDesign(doc))
      return { issues: (issues ?? []).map((x: any) => ({ page: x.page, index: x.index, severity: x.severity, message: x.message })) }
    },
    /** 書き出し: format = png | jpeg | svg | pdf。page は 1 始まり(pdf は全ページ) */
    async render(m) {
      const doc = await fileRepo.get(m.id)
      if (!doc) throw new Error(`デザイン ${m.id} が見つかりません`)
      if (doc.deck) throw new Error('HTML スライドは画面の「PDF」ボタンから書き出してください')
      const fmt = m.format ?? 'png'
      if (fmt === 'pdf') {
        const unit = doc.print ? 'mm' : 'px'
        const pw = doc.print?.mmW ?? doc.width, ph = doc.print?.mmH ?? doc.height
        const orient = pw >= ph ? 'landscape' : 'portrait'
        const pdf = new jsPDF({ orientation: orient, unit, format: [pw, ph], hotfixes: ['px_scaling'], compress: true })
        for (let i = 0; i < doc.pages.length; i++) {
          const url = await renderPage(doc.pages[i].json, doc.width, doc.height, { multiplier: doc.print ? 2 : 1, format: 'jpeg', quality: 0.92 })
          if (i > 0) pdf.addPage([pw, ph], orient)
          pdf.addImage(url, 'JPEG', 0, 0, pw, ph, undefined, 'FAST')
        }
        return { dataURL: pdf.output('datauristring') }
      }
      const i = Math.max(0, Math.min(doc.pages.length - 1, (m.page ?? 1) - 1))
      if (fmt === 'svg') return { dataURL: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(await renderPageSVG(doc.pages[i].json, doc.width, doc.height)) }
      return { dataURL: await renderPage(doc.pages[i].json, doc.width, doc.height, { multiplier: Math.max(0.1, Math.min(3, m.scale ?? 1)), format: fmt === 'jpeg' ? 'jpeg' : 'png' }) }
    },
  })
}
