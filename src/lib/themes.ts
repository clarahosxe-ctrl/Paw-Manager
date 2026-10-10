// Every theme is a set of RGB triplets exposed as CSS variables (see tailwind.config.js).
export interface Theme { id: string; label: string; dark?: boolean; vars: Record<string, string> }
const v = (bg: string, card: string, primary: string, sage: string, ink: string, muted: string, line: string, warn: string, ok: string, onprimary = '255 255 255') =>
  ({ bg, card, primary, sage, ink, muted, line, warn, ok, onprimary })

export const THEMES: Theme[] = [
  { id: 'olive', label: 'Olive', vars: v('248 246 239', '238 235 215', '62 73 48', '167 174 138', '41 43 36', '133 132 119', '229 225 211', '199 120 90', '100 133 104') },
  { id: 'ocean', label: 'Océan', vars: v('243 247 249', '226 236 241', '36 82 107', '140 175 192', '28 40 48', '112 130 140', '214 226 232', '196 112 92', '84 140 120') },
  { id: 'terracotta', label: 'Terracotta', vars: v('252 246 241', '244 228 216', '158 84 56', '214 165 138', '48 33 27', '140 117 105', '237 222 210', '184 74 52', '104 132 90') },
  { id: 'lavande', label: 'Lavande', vars: v('248 246 251', '236 231 245', '88 70 130', '176 164 208', '36 32 48', '128 122 145', '226 220 238', '196 106 100', '98 134 110') },
  { id: 'night', label: 'Nuit', dark: true, vars: v('24 27 22', '36 41 33', '167 174 138', '88 98 72', '240 238 228', '160 160 148', '56 62 51', '224 144 112', '130 170 134', '28 32 22') },
]
export function applyTheme(id: string) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0]
  const root = document.documentElement
  for (const [k, val] of Object.entries(t.vars)) root.style.setProperty(`--${k}`, val)
  root.style.colorScheme = t.dark ? 'dark' : 'light'
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', `rgb(${t.vars.bg.split(' ').join(',')})`)
}
