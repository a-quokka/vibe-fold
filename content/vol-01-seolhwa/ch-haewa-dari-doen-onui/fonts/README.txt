Noto Serif KR — SIL Open Font License 1.1 (see OFL.txt)
Source: Google Fonts (fonts.gstatic.com), Noto Serif KR v31.

Subset to exactly what this chapter renders: every Hangul syllable that
appears in index.html, plus the whole of printable ASCII and a few marks, so
that changing an English caption never silently drops a glyph.

  pyftsubset NotoSerifKR.ttf --text-file=charset.txt --flavor=woff2 \
    --layout-features='kern,liga,calt' --no-hinting --desubroutinize \
    --output-file=serif-400.woff2

IF YOU ADD OR CHANGE KOREAN TEXT, RE-SUBSET.
A syllable that is not in the file falls back to the system sans, and the
caption comes out half serif and half gothic. To check what is missing:

  python3 - <<'EOF'
  from fontTools.ttLib import TTFont
  import re, pathlib
  need = set(re.findall(r'[가-힣]', pathlib.Path("index.html").read_text()))
  f = TTFont("fonts/serif-400.woff2")
  have = {chr(c) for t in f["cmap"].tables for c in t.cmap}
  print("".join(sorted(need - have)) or "ok")
  EOF
