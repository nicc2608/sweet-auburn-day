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

# Image URLs. Upload these to the WordPress media library and paste each URL here;
# any left empty load from the published GitHub Pages site.
IMAGES = {
    'Landing/Photo/Hero%20Auburn.webp': '',
    'Landing/Photo/Hero%20Auburn%20square.webp': '',
    'Landing/Photo/Friends%20on%20Auburn.webp': '',
    'Landing/Photo/Friends%20on%20Auburn%20tall.webp': '',
    'Landing/Partners/dashboard.png': '',
    'Landing/Partners/dashboard-white.png': '',
    'Landing/Partners/downtown-atl.png': '',
    'Landing/Partners/nps-mlk.png': '',
    'Landing/Partners/mayors-office.png': '',
    'Landing/Partners/auc-woodruff-white.svg': '',
}

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
# Footer logo inline: WordPress often blocks SVG uploads.
logo = open('Landing/Logo/sweet-auburn-negative.svg').read().strip()
logo = logo.replace('<svg ', '<svg class="footer-logo" role="img" aria-label="Sweet Auburn Day" ', 1)
body = re.sub(r'<img src="Landing/Logo/sweet-auburn-negative\.svg"[^>]*>', lambda m: logo, body)
for path, url in IMAGES.items():
    body = body.replace(f'"{path}"', f'"{url or BASE + path}"')
assert 'Landing/' not in body.replace(BASE + 'Landing/', ''), 'an image path was left relative'


# The page's own html/body rules become wrapper rules; keep the wrapper a block.
# Theme guard: neutralise common WordPress theme rules before the landing's own rules apply.
guard = f"""{ROOT}{{display:block;position:relative;text-align:left}}
{ROOT} h1,{ROOT} h2,{ROOT} h3,{ROOT} h4,{ROOT} p,{ROOT} ul,{ROOT} ol,{ROOT} li,{ROOT} dl,{ROOT} dt,{ROOT} dd,{ROOT} figure,{ROOT} figcaption{{color:inherit;font-family:inherit;letter-spacing:normal;margin:0;padding:0;border:0;background:none}}
{ROOT} img,{ROOT} svg{{border:0;box-shadow:none;border-radius:0}}
{ROOT} a{{box-shadow:none}}
{ROOT} p,{ROOT} li,{ROOT} dt,{ROOT} dd,{ROOT} figcaption,{ROOT} strong{{font-size:inherit;line-height:inherit}}
{ROOT} h1,{ROOT} h2,{ROOT} h3{{text-shadow:none}}
{ROOT} .menu-toggle:hover,{ROOT} .menu-toggle:focus{{background:none;box-shadow:none}}"""

# Elementor and WordPress fixes (carried over from the version running on hddc.org).
ELEMENTOR = f"""/* Full-bleed: the landing spans the screen whatever padding or width the Elementor container has. */
{ROOT}{{width:100vw;max-width:100vw;margin:0 0 0 calc(50% - 50vw)}}
body.elementor-template-canvas,body:has({ROOT}){{overflow-x:clip;margin:0}}
/* Elementor wrappers add padding, gaps and widget spacing; zero them only around the landing. */
.e-con:has({ROOT}),.e-con-inner:has({ROOT}),.elementor-element-populated:has({ROOT}),.elementor-widget-container:has({ROOT}){{--padding-top:0px;--padding-bottom:0px;--padding-left:0px;--padding-right:0px;--gap:0px;--row-gap:0px;--min-height:0px;padding:0;margin:0;gap:0;min-height:0;border:0}}
.elementor-widget:has({ROOT}),.elementor-section:has({ROOT}),.elementor-column:has({ROOT}){{margin:0;padding:0;--widgets-spacing:0px}}
/* Boxed containers: let the inner box fill the width so the full-bleed math stays exact. */
.e-con-inner:has({ROOT}),.elementor-container:has({ROOT}){{max-width:none;width:100%;--content-width:100%}}
{ROOT} .footer-logo{{width:130px;height:auto}}
/* The skip link sits above the landing, over the theme header; keep it fully hidden until focused. */
{ROOT} .skip:not(:focus){{clip-path:inset(50%);width:1px;height:1px;overflow:hidden;white-space:nowrap;padding:0}}
/* Keep the menu below the WordPress admin bar when logged in. */
body.admin-bar {ROOT} .nav{{top:32px}}
@media (max-width:782px){{body.admin-bar {ROOT} .nav{{top:46px}}}}
/* WordPress stops pinning its admin bar below 600px, so the menu goes back to the very top. */
@media (max-width:600px){{body.admin-bar {ROOT} .nav{{top:0}}}}"""
css = re.sub(r'@keyframes\s+([\w-]+)', r'@keyframes sad-\1', css)
css = re.sub(r'animation:\s*([\w-]+)', lambda m: 'animation: sad-' + m.group(1) if m.group(1) not in ('none',) else m.group(0), css)
scoped = guard + '\n' + scope_css(css) + '\n' + ELEMENTOR

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
<script>(function (r) {{ r.classList.add('js'); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) r.classList.add('motion'); }})(document.currentScript.parentElement);</script>
{body}
</div>
<script>
(function () {{
const landing = document.getElementById('sad-landing');
{js}
}})();
</script>
'''
open('elementor/sweet-auburn-day-elementor.html', 'w').write(out)
print('ok', len(out))
