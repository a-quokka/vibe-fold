Diphylleia Regular — SIL Open Font License 1.1 (see OFL.txt)
Source: Google Fonts, Diphylleia. Hangul 완성형 2,781자 지원.

diphylleia-400.woff2 is the font as a file, kept here so it can be re-embedded
without going back to the original TTF. The chapter does NOT load it from this
path. It is embedded in index.html as a base64 data URI, because @font-face is
always a CORS request and this chapter runs in an iframe with
sandbox="allow-scripts" and no allow-same-origin. The document therefore has an
opaque origin, the font arrives as cross-origin, and without
Access-Control-Allow-Origin the browser accepts the 200 and discards the font —
silently, with the type falling back to the system sans. Images and video are
fetched no-cors and are unaffected. A data URI is never fetched, so none of
that applies.

NOT subset to the text on the page, unlike the other chapters here. This one
takes a name typed by the reader and prints it on the final screen, so every
Hangul syllable the font has must be present or somebody's name comes out in
the system gothic on the one screen the whole piece is built towards.

How it was made, from Diphylleia-Regular.ttf (1.9MB → 228KB):

  pyftsubset Diphylleia-Regular.ttf \
    --unicodes='U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-205E,U+AC00-D7A3,U+3130-318F,U+1100-11FF,U+3000-303F,U+FF01-FF60' \
    --flavor=woff2 --layout-features='kern,liga,calt' --no-hinting \
    --desubroutinize --output-file=diphylleia-400.woff2

  python3 -c "import base64,pathlib; \
    print(base64.b64encode(pathlib.Path('diphylleia-400.woff2').read_bytes()).decode())"

The printed string goes into index.html, into the one @font-face rule, after
`url("data:font/woff2;base64,`. Nothing else in the file has to change.
