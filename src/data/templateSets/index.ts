// 複数ページのテンプレートセット(10ページ前後)をまとめる
import type { Template } from '../templates'
import { SLIDES_SETS } from './slides'
import { SNS_SETS } from './sns'
import { PRINT_SETS } from './print'
import { WEB_SETS } from './web'

export const TEMPLATE_SETS: Template[] = [...SLIDES_SETS, ...SNS_SETS, ...PRINT_SETS, ...WEB_SETS]
