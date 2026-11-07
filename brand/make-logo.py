#!/usr/bin/env python3
# Usage, from the repository root: python3 brand/make-logo.py .
# Needs fontTools (pip install fonttools) and the Inter Display font files.
# Then run: node brand/make-png.js
# Generates the Glass Qubit logo files. Text is converted to outlines
# (Inter, SIL Open Font License) so the files look the same everywhere.
import sys, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

OUT = sys.argv[1]
os.makedirs(os.path.join(OUT, 'brand'), exist_ok=True)

def text_path(fontfile, text, size, x0=0.0, baseline=0.0, tracking=0.0):
    f = TTFont(fontfile)
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    s = size / upm
    pen = SVGPathPen(gs)
    x = 0.0
    names = [cmap[ord(c)] for c in text]
    kern = {}
    # simple pair kerning via GPOS is complex; Inter's spacing is fine without it
    for i, n in enumerate(names):
        tp = TransformPen(pen, (s, 0, 0, -s, x0 + x * s, baseline))
        gs[n].draw(tp)
        x += gs[n].width + tracking * upm
    return pen.getCommands(), x * s

INTER = os.environ.get('INTER_DIR', '/usr/share/fonts/opentype/inter') + '/InterDisplay-'

# ---------- the mark: a glass Bloch sphere holding one qubit ----------
def mark(uid, detail=True):
    eq = f'''
    <path d="M5 32a27 8 0 0 1 54 0" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.2" stroke-dasharray="2.2 2.6"/>
    <path d="M5 32a27 8 0 0 0 54 0" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/>''' if detail else '''
    <path d="M5 32a27 8 0 0 0 54 0" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.6"/>'''
    axis = '<path d="M32 5v54" stroke="#fff" stroke-opacity=".22" stroke-width="1"/>' if detail else ''
    sw_vec = 2.6 if detail else 4
    r_dot = 4.4 if detail else 6.5
    tip = (44.5, 17.5)
    return f'''<defs>
    <radialGradient id="{uid}b" cx=".36" cy=".3" r=".78">
      <stop offset="0" stop-color="#d6e7ff"/>
      <stop offset=".42" stop-color="#5e92f7"/>
      <stop offset=".82" stop-color="#2450c9"/>
      <stop offset="1" stop-color="#14307f"/>
    </radialGradient>
    <linearGradient id="{uid}h" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".9"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="27" fill="url(#{uid}b)"/>
  {axis}{eq}
  <path d="M32 32L{tip[0]} {tip[1]}" stroke="#fff" stroke-width="{sw_vec}" stroke-linecap="round"/>
  <circle cx="32" cy="32" r="{1.8 if detail else 2.6}" fill="#fff"/>
  <circle cx="{tip[0]}" cy="{tip[1]}" r="{r_dot}" fill="#ffc24b" stroke="#fff" stroke-width="{1.4 if detail else 2}"/>
  <ellipse cx="22.5" cy="17.5" rx="{10 if detail else 11}" ry="{5.2 if detail else 6}" transform="rotate(-38 22.5 17.5)" fill="url(#{uid}h)" opacity="{.75 if detail else .7}"/>
  {'<path d="M50.5 40.5a21 21 0 0 1-12 12.5" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/>' if detail else ''}
  <circle cx="32" cy="32" r="{26.4 if detail else 26}" fill="none" stroke="#e8f1ff" stroke-opacity=".7" stroke-width="{1.2 if detail else 2}"/>'''

def svg(w, h, body, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'

# Mark alone
open(f'{OUT}/brand/glass-qubit-mark.svg', 'w').write(svg(64, 64, mark('m'), 'Glass Qubit'))
# Favicon: simplified for 16–32 px
open(f'{OUT}/favicon.svg', 'w').write(svg(64, 64, mark('f', detail=False), 'Glass Qubit'))

# Wordmark: "Glass" light (clear, see-through) + "Qubit" semibold (the thing you work with)
SIZE = 40; BASE = 46
g_path, g_w = text_path(INTER + 'Light.otf', 'Glass', SIZE, 0, BASE)
gap = SIZE * 0.24
q_path, q_w = text_path(INTER + 'SemiBold.otf', 'Qubit', SIZE, g_w + gap, BASE)
word_w = g_w + gap + q_w

def lockup(ink, soft, name):
    W = 64 + 16 + word_w + 4
    body = mark('l' + name) + f'''
  <g transform="translate(80 0)">
    <path d="{g_path}" fill="{soft}"/>
    <path d="{q_path}" fill="{ink}"/>
  </g>'''
    open(f'{OUT}/brand/glass-qubit-logo-{name}.svg', 'w').write(svg(round(W, 1), 64, body, 'Glass Qubit'))
    return W

# On dark backgrounds / on light backgrounds
LW = lockup('#ffffff', '#a9c6ff', 'on-dark')
lockup('#0e1f4d', '#2f6fed', 'on-light')

# Stacked lockup for square spaces
def stacked(ink, soft, name):
    W = max(word_w, 64) + 16
    mx = (W - 128) / 2
    body = f'<g transform="translate({mx} 0) scale(2)">' + mark('s' + name) + '</g>' + f'''
  <g transform="translate({(W - word_w)/2} 126)">
    <path d="{g_path}" fill="{soft}"/>
    <path d="{q_path}" fill="{ink}"/>
  </g>'''
    open(f'{OUT}/brand/glass-qubit-stacked-{name}.svg', 'w').write(svg(round(W, 1), 184, body, 'Glass Qubit'))
stacked('#ffffff', '#a9c6ff', 'on-dark')
stacked('#0e1f4d', '#2f6fed', 'on-light')

# Social preview, 1280×640, for GitHub's repository settings
t_path, t_w = text_path(INTER + 'Regular.otf', 'A quantum lab in your browser', 30, 0, 0)
logo_scale = 2.2
lockup_w = LW * logo_scale
x0 = (1280 - lockup_w) / 2
body = f'''<defs><radialGradient id="bg" cx=".5" cy=".42" r=".75">
    <stop offset="0" stop-color="#1b2a55"/><stop offset="1" stop-color="#0b1020"/></radialGradient></defs>
  <rect width="1280" height="640" fill="url(#bg)"/>
  <g transform="translate({x0} 220) scale({logo_scale})">{mark('p')}
    <g transform="translate(80 0)"><path d="{g_path}" fill="#a9c6ff"/><path d="{q_path}" fill="#fff"/></g>
  </g>
  <g transform="translate({(1280 - t_w)/2} 420)"><path d="{t_path}" fill="#c7d3ee"/></g>'''
open(f'{OUT}/brand/social-preview.svg', 'w').write(svg(1280, 640, body, 'Glass Qubit: a quantum lab in your browser'))
print('wordmark width', word_w, 'lockup', LW)
