// 推論エンジンの wasm は jsDelivr から読むので、配信物から外す(Workers の 25MiB 上限対策)
import { readdirSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
const dir = (process.argv[2] ?? 'dist') + '/assets'
let removed = 0
for (const f of readdirSync(dir)) {
  if (/^ort-wasm.*\.wasm$/.test(f)) { unlinkSync(join(dir, f)); removed++ }
}
const big = readdirSync(dir).filter((f) => statSync(join(dir, f)).size > 25 * 1024 * 1024)
console.log(`strip-wasm: ${removed} 件削除` + (big.length ? ` / 25MiB 超が残っています: ${big.join(', ')}` : ''))
if (big.length) process.exit(1)
