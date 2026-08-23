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

# Apply Nuur Path branding to the generated web shell.
cp assets/nuur_path_logo.svg web/favicon.svg
python3 - <<'PY'
from pathlib import Path
p = Path('web/index.html')
s = p.read_text()
s = s.replace('<title>hifz_companion_flutter</title>', '<title>Nuur Path</title>')
s = s.replace('</head>', '  <link rel="icon" type="image/svg+xml" href="favicon.svg">\n</head>')
p.write_text(s)

m = Path('web/manifest.json')
if m.exists():
    text = m.read_text()
    text = text.replace('"name": "hifz_companion_flutter"', '"name": "Nuur Path"')
    text = text.replace('"short_name": "hifz_companion_flutter"', '"short_name": "Nuur Path"')
    m.write_text(text)
PY

echo "Getting Flutter dependencies..."
flutter pub get

echo "Building Nuur Path web app..."
flutter build web --release

echo "Build completed successfully."
