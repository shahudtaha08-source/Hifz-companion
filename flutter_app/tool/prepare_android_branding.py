from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "android/app/src/main/res"
DRAWABLE = RES / "drawable"
DRAWABLE.mkdir(parents=True, exist_ok=True)

ICON = '''<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="512"
    android:viewportHeight="512">
    <!-- Nuur Path launcher icon: generated from the app's own logo artwork. -->
    <path android:fillColor="#061A1B"
        android:pathData="M118,18H394C449,18 494,63 494,118V394C494,449 449,494 394,494H118C63,494 18,449 18,394V118C18,63 63,18 118,18Z"/>
    <path android:fillColor="#67D9BD" android:fillAlpha="0.45"
        android:pathData="M118,18H394C449,18 494,63 494,118V394C494,449 449,494 394,494H118C63,494 18,449 18,394V118C18,63 63,18 118,18Z"
        android:strokeColor="#67D9BD" android:strokeWidth="3"/>
    <path android:fillColor="#2A8F7B" android:fillAlpha="0.48"
        android:pathData="M38,361C116,340 168,367 237,412C307,457 384,445 476,388L476,421C384,478 307,490 237,445C168,400 116,373 38,394Z"/>
    <path android:fillColor="#0F6659" android:fillAlpha="0.70"
        android:pathData="M31,406C128,365 183,412 249,444C324,480 399,444 480,405L480,431C399,470 324,506 249,470C183,438 128,391 31,432Z"/>
    <path android:fillColor="#55D2B1"
        android:pathData="M162,342C111,292 140,229 191,179C231,139 242,101 225,70C295,124 253,204 209,244C178,273 178,311 213,331C232,342 248,358 249,385C225,352 196,344 162,342Z"/>
    <path android:fillColor="#55D2B1"
        android:pathData="M340,160C282,207 285,266 347,322C380,352 390,390 368,432C442,363 419,280 369,235C335,204 334,181 356,164C369,153 378,139 380,121C365,140 352,151 340,160Z"/>
    <path android:fillColor="#F3C46D"
        android:pathData="M385,87C351,92 324,121 324,157C324,194 354,224 391,224C415,224 437,211 450,191C438,198 425,202 411,202C373,202 343,171 343,133C343,114 351,97 364,85C371,79 379,74 385,72V87Z"/>
    <path android:fillColor="#FFE6A3"
        android:pathData="M264,224L272,247L295,255L272,263L264,286L256,263L233,255L256,247Z"/>
    <path android:fillColor="#69E5C5" android:pathData="M126,221A7,7 0,1 0,126.1,221Z"/>
    <path android:fillColor="#69E5C5" android:pathData="M290,149A5,5 0,1 0,290.1,149Z"/>
    <path android:fillColor="#69E5C5" android:pathData="M311,202A4,4 0,1 0,311.1,202Z"/>
</vector>
'''

(DRAWABLE / "nuur_path_icon.xml").write_text(ICON, encoding="utf-8")

manifest = ROOT / "android/app/src/main/AndroidManifest.xml"
if not manifest.exists():
    raise SystemExit("AndroidManifest.xml not found. Run 'flutter create . --platforms android' first.")

text = manifest.read_text(encoding="utf-8")
text = re.sub(r'android:icon="[^"]*"', 'android:icon="@drawable/nuur_path_icon"', text)
text = re.sub(r'android:roundIcon="[^"]*"', 'android:roundIcon="@drawable/nuur_path_icon"', text)
text = re.sub(r'android:label="[^"]*"', 'android:label="Nuur Path"', text)
manifest.write_text(text, encoding="utf-8")

print("Applied Nuur Path Android launcher icon and app label.")
