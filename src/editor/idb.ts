// IndexedDB の最小ラッパー。使えない環境(プライベートモード等)ではメモリに逃がす
const DB_NAME = 'irodori'
const STORES = ['docs', 'assets', 'brand', 'versions', 'fonts'] as const
type Store = (typeof STORES)[number]

let dbp: Promise<IDBDatabase | null> | null = null
const mem: Record<string, Map<string, any>> = { docs: new Map(), assets: new Map(), brand: new Map(), versions: new Map(), fonts: new Map() }
export let storageOk = true

function open(): Promise<IDBDatabase | null> {
  if (dbp) return dbp
  dbp = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 3)
      req.onupgradeneeded = () => {
        for (const s of STORES) if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s, { keyPath: 'id' })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => { storageOk = false; resolve(null) }
    } catch { storageOk = false; resolve(null) }
  })
  return dbp
}

function tx<T>(store: Store, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return open().then((db) => new Promise<T>((resolve, reject) => {
    if (!db) return reject(new Error('no-db'))
    const t = db.transaction(store, mode)
    const r = fn(t.objectStore(store))
    // 書き込みはトランザクション完了(容量超過などの中断を検知できる)まで待つ
    if (mode === 'readwrite') { t.oncomplete = () => { storageOk = true; resolve(r.result as T) }; t.onabort = t.onerror = () => reject(t.error ?? r.error) }
    else { r.onsuccess = () => resolve(r.result as T); r.onerror = () => reject(r.error) }
  }))
}

export async function idbPut(store: Store, value: { id: string;[k: string]: any }) {
  try { await tx(store, 'readwrite', (s) => s.put(value)) }
  catch (e: any) {
    storageOk = false
    mem[store].set(value.id, value)
    // DB 自体が使えない環境(プライベートモード等)はメモリで動かす。容量超過などの失敗は呼び出し側に伝える
    if (e?.message !== 'no-db') throw e
  }
}
export async function idbGet<T>(store: Store, id: string): Promise<T | undefined> {
  try { return await tx<T>(store, 'readonly', (s) => s.get(id)) } catch { return mem[store].get(id) }
}
export async function idbAll<T>(store: Store): Promise<T[]> {
  try { return await tx<T[]>(store, 'readonly', (s) => s.getAll()) } catch { return [...mem[store].values()] }
}
export async function idbDelete(store: Store, id: string) {
  try { await tx(store, 'readwrite', (s) => s.delete(id)) } catch { mem[store].delete(id) }
}
