from pathlib import Path
import re
import struct
import zlib
import math

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "android/app/src/main/res"
DRAWABLE = RES / "drawable"
MIPMAP_ANY = RES / "mipmap-anydpi"
MIPMAP_V26 = RES / "mipmap-anydpi-v26"
DENSITIES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
for folder in (DRAWABLE, MIPMAP_ANY, MIPMAP_V26, *(RES / d for d in DENSITIES)):
    folder.mkdir(parents=True, exist_ok=True)

# Use a UNIQUE resource name instead of Flutter's default ic_launcher. This
# prevents Android/launcher caches from resolving the old generated Flutter icon.
ICON_NAME = "nuur_path_launcher"
ROUND_ICON_NAME = "nuur_path_launcher_round"

def png_rgba(path, width, height, pixels):
    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        raw.extend(pixels[y * stride:(y + 1) * stride])
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff)
    data = b"\x89PNG\r\n\x1a\n"
    data += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    data += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    data += chunk(b"IEND", b"")
    path.write_bytes(data)


def make_icon(size):
    px = bytearray(size * size * 4)
    def setpx(x, y, rgba):
        if 0 <= x < size and 0 <= y < size:
            i = (y * size + x) * 4
            px[i:i+4] = bytes(rgba)
    def blend(x, y, rgba):
        if not (0 <= x < size and 0 <= y < size):
            return
        i = (y * size + x) * 4
        a = rgba[3] / 255
        oa = px[i+3] / 255
        na = a + oa * (1 - a)
        if na <= 0:
            return
        for c in range(3):
            px[i+c] = int((rgba[c] * a + px[i+c] * oa * (1-a)) / na)
        px[i+3] = int(na * 255)

    r = size * 0.18
    for y in range(size):
        for x in range(size):
            dx = min(x + 0.5, size - x - 0.5)
            dy = min(y + 0.5, size - y - 0.5)
            inside = min(dx, dy) >= r or ((max(r-dx, 0))**2 + (max(r-dy, 0))**2 <= r*r)
            if inside:
                setpx(x, y, (6, 26, 27, 255))
    for y in range(int(size * .55), int(size * .94)):
        for x in range(int(size * .08), int(size * .92)):
            xn, yn = x/size, y/size
            y1 = .69 + .07 * math.sin((xn-.05) * math.pi * 2.2)
            y2 = .79 + .06 * math.sin((xn+.12) * math.pi * 2.4)
            if abs(yn-y1) < .055:
                blend(x, y, (42, 143, 123, 175))
            if abs(yn-y2) < .055:
                blend(x, y, (15, 102, 89, 210))
    for y in range(int(size*.23), int(size*.76)):
        for x in range(int(size*.22), int(size*.58)):
            xn, yn = x/size, y/size
            cx = .40 + .07 * math.sin((yn-.22) * math.pi * 2.5)
            width = .05 + .12 * (yn-.22)
            if abs(xn-cx) < width and yn > .22:
                alpha = int(210 * (1 - abs(xn-cx)/max(width, .001)))
                blend(x, y, (85, 210, 177, alpha))
    cx, cy = .73*size, .30*size
    R = .135*size
    cutx, cuty = .77*size, .27*size
    for y in range(int(cy-R-2), int(cy+R+2)):
        for x in range(int(cx-R-2), int(cx+R+2)):
            if (x-cx)**2 + (y-cy)**2 <= R*R and (x-cutx)**2 + (y-cuty)**2 >= (R*.84)**2:
                setpx(x, y, (243, 196, 109, 255))
    sx, sy = int(.52*size), int(.48*size)
    for y in range(sy-5, sy+6):
        for x in range(sx-5, sx+6):
            if abs(x-sx) + abs(y-sy) <= 4:
                setpx(x, y, (255, 230, 163, 255))
    return px

for density, size in DENSITIES.items():
    folder = RES / density
    pixels = make_icon(size)
    png_rgba(folder / f"{ICON_NAME}.png", size, size, pixels)
    png_rgba(folder / f"{ROUND_ICON_NAME}.png", size, size, pixels)

ICON = '''<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="512" android:viewportHeight="512">
    <path android:fillColor="#061A1B" android:pathData="M118,18H394C449,18 494,63 494,118V394C494,449 449,494 394,494H118C63,494 18,449 18,394V118C18,63 63,18 118,18Z"/>
    <path android:fillColor="#2A8F7B" android:fillAlpha="0.48" android:pathData="M38,361C116,340 168,367 237,412C307,457 384,445 476,388L476,421C384,478 307,490 237,445C168,400 116,373 38,394Z"/>
    <path android:fillColor="#0F6659" android:fillAlpha="0.70" android:pathData="M31,406C128,365 183,412 249,444C324,480 399,444 480,405L480,431C399,470 324,506 249,470C183,438 128,391 31,432Z"/>
    <path android:fillColor="#55D2B1" android:pathData="M162,342C111,292 140,229 191,179C231,139 242,101 225,70C295,124 253,204 209,244C178,273 178,311 213,331C232,342 248,358 249,385C225,352 196,344 162,342Z"/>
    <path android:fillColor="#F3C46D" android:pathData="M385,87C351,92 324,121 324,157C324,194 354,224 391,224C415,224 437,211 450,191C438,198 425,202 411,202C373,202 343,171 343,133C343,114 351,97 364,85C371,79 379,74 385,72V87Z"/>
</vector>
'''
(DRAWABLE / "nuur_path_icon.xml").write_text(ICON, encoding="utf-8")

# Android 7 and lower use the real PNGs. Android 8+ gets a unique adaptive icon.
ADAPTIVE = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@android:color/transparent"/>
    <foreground android:drawable="@drawable/nuur_path_icon"/>
</adaptive-icon>
'''
for name in (ICON_NAME, ROUND_ICON_NAME):
    (MIPMAP_V26 / f"{name}.xml").write_text(ADAPTIVE, encoding="utf-8")

manifest = ROOT / "android/app/src/main/AndroidManifest.xml"
if not manifest.exists():
    raise SystemExit("AndroidManifest.xml not found. Run 'flutter create . --platforms android' first.")
text = manifest.read_text(encoding="utf-8")
text = re.sub(r'android:icon="[^"]*"', f'android:icon="@mipmap/{ICON_NAME}"', text)
text = re.sub(r'android:roundIcon="[^"]*"', f'android:roundIcon="@mipmap/{ROUND_ICON_NAME}"', text)
text = re.sub(r'android:label="[^"]*"', 'android:label="Nuur Path"', text)
if 'android:roundIcon=' not in text:
    text = text.replace(f'android:icon="@mipmap/{ICON_NAME}"', f'android:icon="@mipmap/{ICON_NAME}" android:roundIcon="@mipmap/{ROUND_ICON_NAME}"')
manifest.write_text(text, encoding="utf-8")

print("Wrote uniquely named Nuur Path launcher resources and forced the Android manifest to use them.")
