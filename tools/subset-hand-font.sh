#!/usr/bin/env bash
# Rebuild site/assets/fonts/xiaolai-sub.woff2: the handwritten font (Xiaolai, SIL OFL 1.1,
# https://github.com/lxgw/kose-font) cut down to just the characters the site writes in it.
# Run again whenever the project descriptions (site/assets/dk.js) or the idle hint change.
# Needs: curl, python3 with fonttools + brotli (pip install fonttools brotli).
set -euo pipefail
cd "$(dirname "$0")/.."
ver=v3.126
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
curl -sfL -o "$tmp/Xiaolai-Regular.ttf" "https://github.com/lxgw/kose-font/releases/download/$ver/Xiaolai-Regular.ttf"
# every desc string in dk.js, the idle hint in index.html, plus printable ASCII
text=$(python3 -I - <<'PY'
import re
js = open('site/assets/dk.js', encoding='utf-8').read()
html = open('site/index.html', encoding='utf-8').read()
s = ''.join(re.findall(r"desc: '([^']*)'", js)) + ''.join(re.findall(r'id="idle"[^>]*>(.*?)</p>', html, re.S))
s = re.sub(r'<[^>]+>', '', s)
print(''.join(sorted(set(s + ''.join(map(chr, range(32, 127)))))))
PY
)
python3 -m fontTools.subset "$tmp/Xiaolai-Regular.ttf" --text="$text" --flavor=woff2 \
  --layout-features='*' --output-file=site/assets/fonts/xiaolai-sub.woff2
ls -l site/assets/fonts/xiaolai-sub.woff2
