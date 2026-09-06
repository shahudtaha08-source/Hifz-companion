#!/usr/bin/env bash
set -euo pipefail

FLUTTER_VERSION="3.35.1"
FLUTTER_DIR="${HOME}/flutter-sdk"
FLUTTER_ROOT="${FLUTTER_DIR}/flutter"

if [ ! -x "${FLUTTER_ROOT}/bin/flutter" ]; then
  echo "Installing Flutter ${FLUTTER_VERSION}..."
  rm -rf "${FLUTTER_DIR}"
  mkdir -p "${FLUTTER_DIR}"
  curl -fsSL "https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_${FLUTTER_VERSION}-stable.tar.xz" -o /tmp/flutter.tar.xz
  tar -xJf /tmp/flutter.tar.xz -C "${FLUTTER_DIR}"
  rm -f /tmp/flutter.tar.xz
fi

export FLUTTER_ROOT="${FLUTTER_ROOT}"
export PATH="${FLUTTER_ROOT}/bin:${FLUTTER_ROOT}/bin/cache/dart-sdk/bin:${PATH}"

flutter config --no-analytics
flutter create . --platforms web

# Build-time only: after this completes, Quran reading and Hifz data access
# do not need the network at runtime.
bash tool/prepare_quran_assets.sh

cp assets/nuur_path_logo.svg web/favicon.svg
cp assets/nuur_path_logo.svg web/Icon-192.svg
cp assets/nuur_path_logo.svg web/Icon-512.svg

python3 - <<'PY'
from pathlib import Path
import json
import re

p = Path('web/index.html')
s = p.read_text(encoding='utf-8')
s = re.sub(r'<title>.*?</title>', '<title>Miqra</title>', s, count=1, flags=re.S)
s = re.sub(r'^\s*<link[^>]+rel=["\'](?:icon|shortcut icon|apple-touch-icon)["\'][^>]*>\s*\n?', '', s, flags=re.M | re.I)
branding = '''  <link rel="icon" type="image/svg+xml" href="favicon.svg?v=miqra-1">
  <link rel="shortcut icon" type="image/svg+xml" href="favicon.svg?v=miqra-1">
  <link rel="apple-touch-icon" href="Icon-192.svg?v=miqra-1">
'''
s = s.replace('</head>', branding + '</head>')
p.write_text(s, encoding='utf-8')

m = Path('web/manifest.json')
data = json.loads(m.read_text(encoding='utf-8'))
data['name'] = 'Miqra'
data['short_name'] = 'Miqra'
data['description'] = 'Your Quran journey, one ayah at a time.'
data['icons'] = [
    {'src': 'Icon-192.svg?v=miqra-1', 'sizes': '192x192', 'type': 'image/svg+xml', 'purpose': 'any'},
    {'src': 'Icon-512.svg?v=miqra-1', 'sizes': '512x512', 'type': 'image/svg+xml', 'purpose': 'any maskable'}
]
m.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
PY

flutter pub get
flutter build web --release

echo "Build completed: Quran text, English/Urdu translations and transliteration are bundled for offline runtime."
