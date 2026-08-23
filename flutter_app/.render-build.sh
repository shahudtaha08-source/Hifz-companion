#!/usr/bin/env bash
set -euo pipefail

FLUTTER_VERSION="3.35.1"
FLUTTER_DIR="${HOME}/flutter-sdk"
FLUTTER_ROOT="${FLUTTER_DIR}/flutter"

if [ ! -x "${FLUTTER_ROOT}/bin/flutter" ]; then
  echo "Installing Flutter ${FLUTTER_VERSION}..."
  rm -rf "${FLUTTER_DIR}"
  mkdir -p "${FLUTTER_DIR}"

  curl -fsSL \
    "https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_${FLUTTER_VERSION}-stable.tar.xz" \
    -o /tmp/flutter.tar.xz

  tar -xJf /tmp/flutter.tar.xz -C "${FLUTTER_DIR}"
  rm -f /tmp/flutter.tar.xz
fi

export FLUTTER_ROOT="${FLUTTER_ROOT}"
export PATH="${FLUTTER_ROOT}/bin:${FLUTTER_ROOT}/bin/cache/dart-sdk/bin:${PATH}"

echo "Using Flutter:"
command -v flutter
flutter --version
flutter config --no-analytics

echo "Generating Flutter web platform..."
flutter create . --platforms web

# Apply Nuur Path branding to the generated web shell and browser tab favicon.
cp assets/nuur_path_logo.svg web/favicon.svg
python3 - <<'PY'
from pathlib import Path
import json
import re

p = Path('web/index.html')
s = p.read_text()

# Browser tab title.
s = re.sub(r'<title>.*?</title>', '<title>Nuur Path</title>', s, count=1, flags=re.S)

# Remove Flutter's generated favicon/icon tags so Chrome cannot keep selecting
# the old default Flutter icon. Then add the Nuur Path logo as the only favicon.
s = re.sub(r'^\s*<link[^>]+rel=["\'](?:icon|shortcut icon)["\'][^>]*>\s*\n?', '', s, flags=re.M | re.I)
s = re.sub(r'^\s*<link[^>]+rel=["\']apple-touch-icon["\'][^>]*>\s*\n?', '', s, flags=re.M | re.I)
s = s.replace('</head>', '  <link rel="icon" type="image/svg+xml" href="favicon.svg?v=nuur-path-2">\n  <link rel="shortcut icon" type="image/svg+xml" href="favicon.svg?v=nuur-path-2">\n</head>')
p.write_text(s)

# Update installed/PWA branding too.
m = Path('web/manifest.json')
if m.exists():
    data = json.loads(m.read_text())
    data['name'] = 'Nuur Path'
    data['short_name'] = 'Nuur Path'
    data['description'] = 'Your Quran journey, one ayah at a time.'
    m.write_text(json.dumps(data, indent=2) + '\n')
PY

echo "Getting Flutter dependencies..."
flutter pub get

echo "Building Nuur Path web app..."
flutter build web --release

echo "Build completed successfully."
