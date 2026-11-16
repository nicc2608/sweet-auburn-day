"""Build a single HTML block of the landing for an Elementor HTML widget.

Run from the repo root:  python3 tools/build-elementor.py
Writes elementor/sweet-auburn-day-elementor.html

Everything is wrapped in <div id="sad-landing">: every CSS rule is scoped to it, so the
WordPress theme and the landing don't restyle each other. Images load from the published
GitHub Pages site, so the block works as soon as it's pasted.
"""
import re

ROOT = '#sad-landing'
BASE = 'https://nicc2608.github.io/sweet-auburn-day/'

def scope_selector(sel):
    sel = sel.strip()
    if sel in (':root', 'html', 'body'):
        return ROOT
    m = re.match(r'^(\.js|\.motion)(?=[\s.:#\[]|$)(.*)$', sel)
    if m:  # state classes live on the wrapper instead of <html>
        return ROOT + m.group(1) + m.group(2)
    if sel.startswith('*'):
        return f'{ROOT} {sel}'
    return f'{ROOT} {sel}'

def split_selectors(s):
    out, depth, cur = [], 0, ''
    for ch in s:
        if ch in '([':
            depth += 1
        elif ch in ')]':
            depth -= 1
        if ch == ',' and depth == 0:
            out.append(cur); cur = ''
        else:
            cur += ch
    out.append(cur)
    return out

def scope_css(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out, i = [], 0
    while i < len(css):
        j = css.find('{', i)
        if j == -1:
            break
        head = css[i:j].strip()
        # find the matching closing brace
        depth, k = 1, j + 1
        while depth:
            if css[k] == '{': depth += 1
            elif css[k] == '}': depth -= 1
            k += 1
        body = css[j + 1:k - 1]
        if head.startswith('@media') or head.startswith('@supports'):
            out.append(f'{head}{{{scope_css(body)}}}')
        elif head.startswith('@'):
            out.append(f'{head}{{{body}}}')  # keyframes, font-face: unchanged
        else:
            sels = ','.join(scope_selector(s) for s in split_selectors(head))
            out.append(f'{sels}{{{body.strip()}}}')
        i = k
    return '\n'.join(out)

html = open('index.html').read()
css = open('styles.css').read()
js = open('main.js').read()

fonts = re.search(r'<link rel="stylesheet" href="(https://fonts\.googleapis\.com/[^"]+)">', html).group(1)
body = html[html.index('<body>') + 6:html.index('<script src="main.js"></script>')].strip()
body = re.sub(r'(src|href|srcset)="Landing/', rf'\1="{BASE}Landing/', body)

# The page's own html/body rules become wrapper rules; keep the wrapper a block.
# Theme guard: neutralise common WordPress theme rules before the landing's own rules apply.
guard = f"""{ROOT}{{display:block;position:relative;text-align:left}}
{ROOT} h1,{ROOT} h2,{ROOT} h3,{ROOT} h4,{ROOT} p,{ROOT} ul,{ROOT} ol,{ROOT} li,{ROOT} dl,{ROOT} dt,{ROOT} dd,{ROOT} figure,{ROOT} figcaption{{color:inherit;font-family:inherit;letter-spacing:normal;margin:0;padding:0;border:0;background:none}}
{ROOT} img,{ROOT} svg{{border:0;box-shadow:none;border-radius:0}}
{ROOT} a{{box-shadow:none}}"""
scoped = guard + '\n' + scope_css(css)

js = js.replace("document.documentElement.classList.contains('motion')", "landing.classList.contains('motion')")
js = js.replace('getComputedStyle(document.documentElement)', 'getComputedStyle(landing)')
js = js.replace("document.querySelector(", "landing.querySelector(").replace("document.querySelectorAll(", "landing.querySelectorAll(").replace("document.getElementById(", "landing.querySelector('#' + ")

out = f'''<!-- Sweet Auburn Day landing. Paste into one Elementor HTML widget on a full-width page. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{fonts}">
<style>
{scoped}
</style>
<div id="sad-landing">
{body}
</div>
<script>
(function () {{
  var landing = document.getElementById('sad-landing');
  landing.classList.add('js');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) landing.classList.add('motion');
}})();
</script>
<script>
(function () {{
const landing = document.getElementById('sad-landing');
{js}
}})();
</script>
'''
open('elementor/sweet-auburn-day-elementor.html', 'w').write(out)
print('ok', len(out))
