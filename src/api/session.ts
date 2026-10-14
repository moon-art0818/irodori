// ログイン状態。ログイン中はクラウド保存、未ログインはこの端末(ブラウザ)に保存
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import { api, serverAvailable } from './client'
import type { ApiUser, Providers } from './contract'

let user: ApiUser | null = null
let ready: Promise<void> | null = null
let hasServer = false
let sessionError = ''
let demo = false
/** 公開デモ版か(ログイン等を出さない) */
export function isDemo() { return demo }
export function sessionProblem() { return sessionError }
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())

export function onSession(f: () => void) { subs.add(f); return () => { subs.delete(f) } }
export function currentUser() { return user }
export function serverOn() { return hasServer }

export function initSession() {
  if (!ready) ready = (async () => {
    const { detectLocal } = await import('./local')
    if (await detectLocal()) { hasServer = false; emit(); return } // ローカル版はログイン不要(保存先はフォルダ)
    hasServer = await serverAvailable()
    if (hasServer) {
      for (let i = 0; i < 3; i++) {
        try { const r: any = await api.me(); user = r.user; demo = !!r.demo; if (demo) hasServer = false; sessionError = ''; break }
        catch (e: any) { sessionError = e?.message ?? '接続できません'; await new Promise((r) => setTimeout(r, 800 * (i + 1))) }
      }
    }
    emit()
  })()
  return ready
}

export async function register(name: string) {
  const opts = await api.registerOptions(name)
  const resp = await startRegistration({ optionsJSON: opts })
  user = (await api.registerVerify(resp)).user
  emit()
  return user
}
export async function login() {
  const opts = await api.loginOptions()
  const resp = await startAuthentication({ optionsJSON: opts })
  user = (await api.loginVerify(resp)).user
  emit()
  return user
}
/** ログイン中のアカウントに、この端末のパスキーを追加する(復旧手段) */
export async function addPasskey() {
  const opts = await api.addPasskeyOptions()
  const resp = await startRegistration({ optionsJSON: opts })
  await api.addPasskeyVerify(resp)
  user = (await api.me()).user
  emit()
}
let prov: Providers | null = null
export async function getProviders(): Promise<Providers> {
  if (prov) return prov
  try { prov = await api.providers() } catch { prov = { google: false, unsplash: false, pexels: false, pixabay: false } }
  return prov
}
export async function refreshUser() { try { user = (await api.me()).user; emit() } catch { /* */ } }

export async function logout() {
  await api.logout().catch(() => {})
  user = null
  emit()
}
