#!/usr/bin/env bash
set -euo pipefail

# The app must work after installation without a network connection. We fetch
# the verified quran-json datasets ONLY while building the application, then
# bundle the resulting files into the APK/web build as local Flutter assets.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/quran"
BASE="https://raw.githubusercontent.com/risan/quran-json/main/dist"

mkdir -p "$OUT"

fetch() {
  local name="$1"
  local url="$BASE/$name"
  local dest="$OUT/$name"
  echo "Preparing offline Quran asset: $name"
  curl -fsSL --retry 3 --retry-delay 1 "$url" -o "$dest"
  test -s "$dest"
}

fetch quran.json
fetch quran_en.json
fetch quran_ur.json
fetch quran_transliteration.json

python3 - "$OUT" <<'PY'
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
files = [
    root / "quran.json",
    root / "quran_en.json",
    root / "quran_ur.json",
    root / "quran_transliteration.json",
]

for path in files:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list) or len(data) != 114:
        raise SystemExit(f"Refusing to bundle {path.name}: expected 114 surahs")
    count = sum(len(ch.get("verses", [])) for ch in data)
    if count != 6236:
        raise SystemExit(f"Refusing to bundle {path.name}: expected 6236 ayahs, got {count}")

print("Offline Quran assets verified: 114 surahs / 6,236 ayahs in every dataset.")
PY
