Noto Serif KR — SIL Open Font License 1.1 (see OFL.txt)
Source: Google Fonts (fonts.gstatic.com), Noto Serif KR v31.

The font is not a file here. It is embedded in index.html as a base64 data
URI, because @font-face is always a CORS request and this chapter runs in an
iframe with sandbox="allow-scripts" and no allow-same-origin. The document
therefore has an opaque origin, the font arrives as cross-origin, and without
Access-Control-Allow-Origin the browser accepts the 200 and discards the
font — silently, with the type falling back to the system sans. Images are
fetched no-cors and are unaffected, which is why only the type went missing.
A data URI is never fetched, so none of that applies.

Subset to exactly what this chapter renders: every Hangul syllable in
index.html, plus all printable ASCII so changing an English caption can never
drop a glyph.

  pyftsubset NotoSerifKR.ttf --text-file=charset.txt --flavor=woff2 \
    --layout-features='kern,liga,calt' --no-hinting --desubroutinize \
    --output-file=serif-400.woff2

  python3 -c "import base64,pathlib; \
    print(base64.b64encode(pathlib.Path('serif-400.woff2').read_bytes()).decode())"

IF YOU ADD OR CHANGE KOREAN TEXT, RE-SUBSET AND RE-EMBED.
A syllable that is not in the subset falls back to the system sans and the
caption comes out half serif, half gothic. To list what is missing you need
the woff2 back out of the data URI:

  python3 - <<'EOF'
  import base64, re, pathlib
  from fontTools.ttLib import TTFont
  import io
  src = pathlib.Path("index.html").read_text()
  b64 = re.search(r'url\("data:font/woff2;base64,([^"]+)"\)', src).group(1)
  f = TTFont(io.BytesIO(base64.b64decode(b64)))
  have = {chr(c) for t in f["cmap"].tables for c in t.cmap}
  need = set(re.findall(r'[가-힣]', src))
  print("".join(sorted(need - have)) or "ok")
  EOF
