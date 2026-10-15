"""Optional Chromium smoke with exact local CSS/DOM/domain modules inlined.

Why inline: this environment may block file:// and localhost navigation. The
harness tests client-side behavior but does NOT certify real HTTP, Pages or CI.
Requires: pip install playwright and an installed Chromium executable.
Run: python tests/browser_smoke.py
"""
from __future__ import annotations
import os
from pathlib import Path
import re

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def html_with_inline_assets() -> tuple[str, str]:
    html = (ROOT / 'index.html').read_text(encoding='utf8')
    css = (ROOT / 'src/styles.css').read_text(encoding='utf8')
    data = (ROOT / 'src/data.mjs').read_text(encoding='utf8')
    domain = (ROOT / 'src/domain.mjs').read_text(encoding='utf8')
    app = (ROOT / 'src/app.mjs').read_text(encoding='utf8')
    data = data.replace('export const sessions', 'const initialSessions').replace('export const rooms', 'const rooms')
    domain = domain.replace('export const ', 'const ').replace('export function ', 'function ')
    app = re.sub(r'^import .*?;\s*$', '', app, flags=re.MULTILINE)
    js = '\n'.join([data, domain, 'const seed = initialSessions;', app])
    html = html.replace('<link rel="stylesheet" href="./src/styles.css"/>', f'<style>{css}</style>')
    html = html.replace('<script type="module" src="./src/app.mjs"></script>', '')
    return html, js


def main() -> None:
    html, js = html_with_inline_assets()
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
            headless=True,
            args=['--no-sandbox'],
        )
        for width in [320, 390, 768, 1440]:
            page = browser.new_page(viewport={'width': width, 'height': 900})
            errors: list[str] = []
            page.on('pageerror', lambda exc: errors.append(str(exc)))
            page.set_content(html)
            page.add_script_tag(content=js, type='module')
            page.locator('#scheduledCount').get_by_text('9').wait_for(timeout=6000)
            assert page.locator('#conflictCount').inner_text() == '2'
            assert page.locator('#sessionRows tr').count() == 10
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), f'horizontal page overflow at {width}'
            # Contract: reject newly introduced overlap without changing schedule.
            page.locator('[data-edit="W-107"]').click()
            page.locator('#statusEdit').select_option('planned')
            page.locator('#editForm button[type=submit]').click()
            assert page.locator('#editError').is_visible()
            assert 'Sala zajęta' in page.locator('#editError').inner_text()
            page.locator('#closeEdit').click()
            # Contract: resolve the original conflict.
            page.locator('[data-edit="W-103"]').click()
            page.locator('#roomEdit').select_option('Sala Spotkań')
            page.locator('#editForm button[type=submit]').click()
            assert page.locator('#conflictCount').inner_text() == '0'
            page.locator('#search').fill('przegląd decyzji')
            assert page.locator('#sessionRows tr').count() == 1
            page.locator('#resetDemo').click()
            assert page.locator('#conflictCount').inner_text() == '2'
            assert page.locator('#sessionRows tr').count() == 10
            assert not errors, f'JavaScript errors at {width}: {errors}'
            page.close()
            print(f'PASS browser smoke at {width}px')
        browser.close()


if __name__ == '__main__':
    main()
