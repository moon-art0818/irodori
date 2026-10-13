// 複数ページのテンプレートセット(10ページ前後)をまとめる
import type { Template } from '../templates'
import { SLIDES_SETS } from './slides'
import { SNS_SETS } from './sns'

export const TEMPLATE_SETS: Template[] = [...SLIDES_SETS, ...SNS_SETS]
