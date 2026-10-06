import type { Template } from '../templates'
import { INSTAGRAM_TEMPLATES } from './instagram'
import { INSTAGRAM_PORTRAIT_TEMPLATES } from './igportrait'
import { STORY_TEMPLATES } from './story'
import { YOUTUBE_TEMPLATES } from './youtube'
import { SLIDE_TEMPLATES } from './slides'
import { FLYER_TEMPLATES } from './flyer'
import { CARD_TEMPLATES } from './card'
import { X_TEMPLATES } from './x'
import { WEB_TEMPLATES } from './web'
import { LINE_TEMPLATES } from './line'
import { MISC_TEMPLATES } from './misc'

export const MORE_TEMPLATES: Template[] = [
  ...INSTAGRAM_TEMPLATES, ...INSTAGRAM_PORTRAIT_TEMPLATES, ...STORY_TEMPLATES, ...YOUTUBE_TEMPLATES,
  ...SLIDE_TEMPLATES, ...FLYER_TEMPLATES, ...CARD_TEMPLATES, ...X_TEMPLATES, ...WEB_TEMPLATES,
  ...LINE_TEMPLATES, ...MISC_TEMPLATES,
]
