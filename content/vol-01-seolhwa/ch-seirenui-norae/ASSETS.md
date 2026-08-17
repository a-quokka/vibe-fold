# 세이렌의 노래 — 에셋 스펙

GPT로 스프라이트를 생성해 이 챕터에 넣기 위한 작업 문서. 각 항목은 지금 `index.html`이 캔버스로 그리고 있는 도형을 무엇으로 대체하는지, 어떤 규격이어야 하는지를 정의한다.

---

## 0. 먼저 — 무엇을 이미지로 만들고 무엇을 코드로 두나

이 작품은 **전체 화면 반응형**이다. 세로 모바일부터 와이드 데스크톱까지 뷰포트 비율이 제각각이라, **크기가 뷰포트에 비례해 변하는 요소**나 **시간에 따라 움직이는 요소**를 고정 비율 이미지로 바꾸면 늘어나거나 죽는다.

판단 기준은 하나다 — **고정 비율로 그려도 되는가.**

### 만든다

| # | 파일 | 상태 |
|---|---|---|
| 1 | `assets/siren.webp` | ✅ 완료 |
| 2 | `assets/odysseus.webp` | ✅ 완료 |
| 3 | `assets/rock-lip.webp` | ✅ 완료 |
| 4 | `assets/ship.webp` | ✅ 완료 (2차. 1차는 돛 때문에 반려 — [사유](#️-돛을-그리지-말-것)) |
| 5 | `assets/crew.webp` | 대기 |
| 6 | `assets/backdrop.webp` | 대기 |
| 7 | `assets/wave.webp` | 대기 |

### 코드로 남긴다

| 요소 | 왜 |
|---|---|
| 하늘·바다 그라디언트 | 어떤 비율에서도 정확히 채워야 함. 그라디언트가 정답 |
| 음표 | 수십 개 동시 스폰, 회전·크기 랜덤. path가 더 선명하고 가벼움 |
| 세이렌 음파 링 | 시간 기반으로 퍼지는 원 |
| 피격 파티클 | 물리 계산 결과 |
| 물결선의 **움직임** | 스크롤·속도는 코드. 물마루 **모양**만 7번 에셋으로 대체 |
| **노** | 직선이라 코드가 정확하고, 각도를 흔들면 젓는 동작이 산다. 생성 이미지에서 가장 왜곡이 심한 형태이기도 하다 |

> **정정 기록.** 이 문서 초판은 배·갑판·돛·배경을 "만들지 말 것"으로 분류했다. 근거가 `갑판 = W × 0.6`처럼 **뷰포트 너비에 묶인 치수**였는데, 그건 제약이 아니라 초기 구현 선택이었다. 기준을 `H`로 바꾸면 고정 비율 스프라이트가 문제없이 들어간다. 배경도 **잘려도 되는 그림**이면 cover 방식으로 안전하다. 아래 4~7번이 그 정정 결과다.

---

## 공통 규격

**팔레트** — 프롬프트에 hex를 그대로 넣을 것. 이 색 밖으로 나가면 캔버스로 그린 부분과 따로 논다.

```
하늘  #0a1024 → #111d3a → #060a16      바다  #0b1730
바위  #05080f      금색  #e8b24c
피부  #d8c49a      옷    #c8b48a
밧줄  #8c6b3a      돛대  #2a1e0d
갑판  #1c1409      돛    #141d33
```

**스타일** — 플랫 실루엣. 그라디언트·텍스처·회화적 렌더링 금지. 2색 이내.

**출력** — 투명 배경 PNG(알파). 배경·지면·그림자·반사 굽지 말 것. 정사각 1024×1024, 사방 15% 여백.

**최종 포맷** — `.webp` (알파 유지, PNG 대비 60~80% 절감). **PNG를 그대로 커밋하지 않는다.** 변환 절차는 아래 [WebP 변환](#webp-변환) 참조.

**폴더 구조** — 스프라이트는 `assets/` 하위에 둔다. 챕터 루트에는 계약 파일(`index.html`, `meta.yaml`, `thumb.svg`)만 남긴다.

```
ch-seirenui-norae/
  index.html   meta.yaml   thumb.svg   ASSETS.md
  assets/  siren  odysseus  rock-lip  ship  crew  backdrop  wave  (.webp)
```

**용량 예산** — 챕터 폴더 전체 **300KB 이하**. 에셋은 `content/` → `public/chapters/` → `dist/`로 **3중 복사**되므로 실측의 3배가 레포에 쌓인다. 참고: 현재 폴더 28KB, 예시 볼륨 4편 전체 96KB.

---

## 1. `assets/siren.webp` — 세이렌

가장 우선순위가 높다. 지금은 **반지름 8px 금색 점**이라 투자 대비 효과가 가장 크다.

| 항목        | 값                                                                 |
| ----------- | ------------------------------------------------------------------ |
| 대체 대상   | `drawSirens()` 3번째 패스 — `ctx.arc(at.x, at.y, 8)`               |
| 화면 표시   | 높이 **120~140px**                                                 |
| 소스 해상도 | 1024×1024 → 320px 높이로 다운스케일                                |
| 개수        | 화면에 4마리 (좌 2, 우 2)                                          |
| 방향        | **오른쪽을 보게** 1장만. 우측 바위용은 캔버스에서 좌우 반전        |
| 앵커        | **발치 = 바닥 중앙**. 이 점이 `(at.x, at.y)`에 놓임                |
| 배치        | x는 `W×0.06` / `W×0.94`, y는 상단 150px~`H×0.62` 구간에 4레인 분산 |

발광 효과(`shadowBlur 22`)는 코드에 남긴다. 스프라이트에 빛번짐을 굽지 말 것 — 겹쳐서 뭉갠다.

```
Flat vector silhouette game sprite, side view, facing right.
Subject: a siren perched on a rock ledge, Homeric Greek, luring —
body turned toward the viewer's right, head tilted, mouth open in song,
long hair falling. Bird-like legs optional. No wings spread wide.

STYLE
- Flat shapes only. No gradients, no texture, no painterly rendering.
- Near-black silhouette #05080f with #e8b24c accent edges only.
- Reads clearly at 120px tall. Strong readable outline.
- Ancient Greek, Homeric. No modern or fantasy elements.

OUTPUT
- Transparent background (PNG with alpha). No backdrop, no scenery, no rock.
- One subject, centered, 15% empty margin on all sides.
- No drop shadow, no ground plane, no glow, no reflection.
- Square canvas, 1024x1024.
```

> 바위는 별도 에셋이다. 세이렌 스프라이트에 바위를 포함시키지 말 것.

### 실측 (2026-08-17, 채택본)

| 항목 | 값 |
|---|---|
| 원본 | 1254×1254 PNG, 778KB, `hasAlpha: yes` |
| 알파 바운딩박스 | 233,61 → 1030,1190 (798×1130, 비율 0.706) |
| 캔버스 여백 | 좌 233 / 우 223 / 상 61 / 하 63 — 거의 대칭, 중심 양호 |
| 크롭 후 리사이즈 | **226×320** |
| 최종 | **`assets/siren.webp` 29,128B** (손실 q90 채택) |
| 발 중심 | bbox 중심에서 **좌측 42px**(폭의 5.3%) — 코드에서 오프셋 보정 |

바운딩박스는 `scratchpad/bbox.js`로 계산했다(Node 내장 zlib만 사용, PNG 알파 직접 파싱). 다음 에셋도 같은 방식으로 잰다.

---

## 2. `assets/odysseus.webp` — 돛대에 묶인 오디세우스

작품의 주제가 걸린 스프라이트. 지금은 **둥근 사각형 + 원 + 가로선 3개**다.

| 항목        | 값                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| 대체 대상   | `drawOdysseus()` — `roundRect(-13, -bodyLen, 26, bodyLen, 13)` + `arc(0, -bodyLen-13, 15)` + 밧줄 3줄 |
| 화면 표시   | 높이 **116~203px** (`bodyLen` = `clamp(H×0.19, 88, 175)` + 머리 28)                                   |
| 소스 해상도 | 1024×1024 → 410px 높이로 다운스케일                                                                   |
| 방향        | **정면**. 좌우로 기우는 동작이므로 측면 아님                                                          |
| 앵커        | **발치 = 바닥 중앙이 회전 피벗.** 최우선 규격                                                         |
| 회전        | 피벗 기준 ±54°(`MAX_LEAN 0.95`)                                                                       |

**앵커가 이 에셋의 전부다.** 캔버스가 `translate(W/2, deckY)` 후 `rotate(body.angle)`을 걸기 때문에, 스프라이트의 **바닥 중앙**이 정확히 회전축에 와야 한다. 여기가 어긋나면 몸이 발치가 아니라 허공을 축으로 돈다. 크롭할 때 좌우 여백을 **완벽히 대칭**으로 맞춰야 하므로, 인물을 캔버스 정중앙에 세워서 뽑을 것.

머리 위치도 중요하다. 피격 판정이 머리 중심 기준 반경 7px이고, 머리 중심은 바닥에서 위로 `bodyLen + 13`인 지점이다. **전신 높이의 약 88% 지점에 머리 중심**이 오게.

밧줄은 몸에 대해 고정이므로 **스프라이트에 포함**시킨다.

```
Flat vector silhouette game sprite, front view, standing upright.
Subject: Odysseus lashed to a ship's mast with rope — arms bound behind,
three coils of rope across the chest and waist, head straining upward,
Homeric Greek tunic. Body rigid, restrained, unable to move.

STYLE
- Flat shapes only. No gradients, no texture, no painterly rendering.
- Tunic #c8b48a, skin #d8c49a, rope #8c6b3a. No other colours.
- Reads clearly at 200px tall.
- Ancient Greek, Homeric. No modern or fantasy elements.

OUTPUT
- Transparent background (PNG with alpha). No mast, no backdrop, no scenery.
- Figure standing dead centre, perfectly vertical, feet at the bottom.
- Equal empty margin left and right — symmetry is critical.
- No drop shadow, no ground plane, no reflection.
- Square canvas, 1024x1024.
```

> 돛대는 코드가 따로 그린다(`fillRect`, 폭 12px). 스프라이트에 돛대를 넣지 말 것 — 인물만 회전해야 하는데 돛대까지 같이 돌면 안 된다.

---

## 3. `assets/rock-lip.webp` — 해안 바위 (상단만)

이름 그대로 **바위 윗부분만** 만든다. 전체를 만들면 안 된다.

현재 바위는 5각 폴리곤이고 세이렌 위치에서 **화면 바닥(`H`)까지** 내려간다. 즉 높이가 뷰포트에 따라 400~800px로 변한다 — 스프라이트로 만들면 늘어난다.

| 항목        | 값                                                                     |
| ----------- | ---------------------------------------------------------------------- |
| 대체 대상   | `drawSirens()` 2번째 패스의 폴리곤 **상단부만**                        |
| 화면 표시   | 약 **260 × 180px**                                                     |
| 소스 해상도 | 1024×1024 → 520px 너비로 다운스케일                                    |
| 방향        | **왼쪽 바위 기준** 1장. 우측은 좌우 반전                               |
| 앵커        | 바위 윗면(세이렌이 앉는 턱)이 `(at.x, at.y)`                           |
| 아래쪽      | 스프라이트 하단부터 화면 바닥까지는 **코드가 `#05080f` 단색으로 채움** |

스프라이트 **하단 가장자리는 반드시 단색 `#05080f`로 꽉 찬 직선**이어야 한다. 아래를 단색으로 이어붙이므로, 여기가 들쭉날쭉하거나 반투명하면 이음매가 보인다.

```
Flat vector silhouette game sprite, side view.
Subject: the top of a jagged sea cliff — a rocky ledge with a flat perch
where a figure could sit, sharp angular fractures, Aegean coastal rock.
Only the upper portion of the cliff, as if the rest continues below frame.

STYLE
- Flat shapes only. No gradients, no texture, no painterly rendering.
- Solid near-black #05080f. Single colour, no highlights.
- Angular and sharp, not rounded or eroded.

OUTPUT
- Transparent background (PNG with alpha). No sky, no sea, no scenery.
- The BOTTOM EDGE of the rock must be a straight, solid, fully opaque
  horizontal line spanning the full width — it continues below frame.
- Wider than tall, roughly 3:2. Centered.
- No drop shadow, no reflection.
- Square canvas, 1024x1024.
```

---

## 4. `assets/ship.webp` — 배 (선체 + 갑판 + 돛대, **돛 없음**)

`drawShip()`을 통째로 대체한다. 지금은 사다리꼴 갑판 + 사각형 돛대 + 삼각형 돛이다.

**초판이 "만들지 말 것"으로 분류했던 항목이다.** 근거였던 `갑판 = W × 0.6`, `돛 = W × 0.2`를 **`H` 기준으로 바꾸면** 고정 비율 스프라이트가 그대로 들어간다. 코드는 이미 `shipWidth()` 하나에서 모든 부위를 파생시키도록 바꿔뒀다.

| 항목 | 값 |
|---|---|
| 대체 대상 | `drawShip()` 전체 |
| 화면 표시 | 너비 `min(clamp(H × 1.25, 560, 1200), W × 1.06)` |
| 소스 해상도 | 1536×640 → 너비 1200으로 다운스케일 |
| 방향 | 측면 한쪽. 좌우 반전 없음 |
| 앵커 | **돛대 중심 × 갑판면**이 `(W/2, deckY)` |
| 비율 | 가로:세로 = **2.4:1** |
| 압축 | 평평한 실루엣이므로 q88 이상 유지 |

### ⚠️ 돛을 그리지 말 것

**초판 프롬프트의 `a square sail furled or slack`이 오류였다.** 이 문구 때문에 돛이 활짝 펴진 배가 나왔고, 세 가지가 어긋났다.

**서사** — 『오디세이아』 12권에서 세이렌 해협을 지날 때 **바람이 완전히 멎는다.** 키르케의 지시대로 선원들은 돛을 내려 배 안에 챙겨 넣고 **노를 저어서** 지나간다. 돛이 펴져 있으면 "순항 중"으로 읽혀 장면이 아예 달라진다. 돛대는 남는다 — 오디세우스를 거기 묶어야 하므로.

**구도** — 짙은 남색 돛이 화면 정중앙, 오디세우스가 서는 바로 그 자리를 덮는다. 주인공 실루엣이 돛에 묻힌다.

**용량** — 돛 주름의 미묘한 음영 탓에 51KB가 나왔다. 다른 에셋의 2배가 넘는다. q68까지 낮춰도 48KB로 거의 안 줄었다. 평평한 실루엣만 남으면 크게 준다.

### 프롬프트

```
Flat vector silhouette game sprite, side view of an ancient Greek ship.
Subject: a Homeric wooden galley with the sail STRUCK — the crew has taken
the sail down and stowed it because the wind has died. Long low hull,
curved prow and stern, a bare vertical mast at the exact horizontal centre,
a bare yard crossing it. Oar ports along the hull.

CRITICAL
- NO SAIL. No canvas, no cloth, no fabric anywhere. The mast is bare.
- The mast must be perfectly vertical and at the exact horizontal centre.

STYLE
- Flat shapes only. No gradients, no texture, no painterly rendering.
- Hull and deck #1c1409, mast and yard #2a1e0d. No other colours.
- Dark and silhouette-like — this sits behind the lit figures.
- Ancient Greek, Homeric. No modern or fantasy elements.

OUTPUT
- Transparent background (PNG with alpha). No sea, no sky, no crew figures.
- The deck surface line at roughly 60% down the image; hull below it.
- Wider than tall, roughly 2.4:1. Canvas 1536x640.
- No drop shadow, no reflection, no water.
```

노는 **배에 그리지 않는다.** 선원(5번)이 노를 들고 있게 하는 편이 배선이 깔끔하다 — 배에도 노가 있으면 선원 위치와 노 각도를 맞춰야 해서 까다로워진다.

오디세우스는 이 스프라이트 **앞에** 그려진다. 돛대에 인물을 그려 넣지 말 것.

### 실측

| 항목 | 1차 (반려) | **2차 (채택)** |
|---|---|---|
| 원본 | 1774×887 | 1942×809 |
| 알파 바운딩박스 | 1677×698 (2.403) | **1893×724 (2.615)** |
| 돛대 중심 | 887 — bbox 중심에서 8px | **971 — bbox 중심에서 5px (0.26%)** |
| 갑판면 | y=630 | **y=630** |
| `SHIP_MAST_X` | 0.495 | **0.4971** |
| `SHIP_DECK_Y` | 0.824 | **0.8411** |
| 최종 | 51,143B (q82) | **42,190B (q84)** |

**앵커는 bbox 중심이 아니라 돛대 기준으로 잡는다.** 둘이 5px 어긋나 있고, 오디세우스가 매달리는 건 돛대다. 돛대 x는 `scratchpad/ship3.js`로 잰다 — 활대 아래·갑판 위 구간을 여러 높이에서 훑어, 가장 자주 잡히는 세로 기둥의 중심을 고른다.

**갑판면은 난간 위가 아니라 선체 위다.** 행별 구조를 보면 명확하다:

| y | 구조 |
|---|---|
| 596~602 | 상단 난간 (연속된 가로 바) |
| 608~626 | 난간 기둥 (틈 20여 개) |
| **630~** | **선체 (꽉 찬 면) ← 갑판면** |

상단 난간에 발을 두면 난간 *위에* 올라선 꼴이 된다. 선체 상단에 두면 난간이 정강이를 가로질러 측면 뷰로 맞는 그림이 나온다.

### 노 구멍 좌표 (노를 코드로 그릴 때 사용)

`scratchpad/ports.js`로 잰 값. 스프라이트(1200×459) 기준 **16개, 균등 간격**.

```
포트 y      0.8954  (스프라이트 높이 기준)
포트 x      0.1492 부터 0.8508 까지 16개 균등
간격        0.04677
```

즉 `i`번째 노 구멍은 `x = 0.1492 + i × 0.04677` (i = 0…15). 노는 여기서 뻗어 나오게 그리고, 각도에 위상차를 주면 젓는 동작이 된다. 선원(5번)은 이 중 일부 위치에 맞춰 배치한다.

---

## 5. `assets/crew.webp` — 밀랍으로 귀를 막은 선원 (상체 4인 시트)

**새 요소다.** 지금 화면에 없다.

원작에서 선원들은 밀랍으로 귀를 막고 노를 젓고, **오디세우스만 묶인 채 듣는다.** 지금 갑판이 비어 있어서 그 대비가 사라져 있다. 선원이 들어가면 "혼자만 듣고 있다"는 구도가 완성된다.

### 상체만 만든다. 노는 그리지 않는다.

**노는 GPT가 가장 못 그리는 형태다.** 가늘고 긴 직선에 손이 겹쳐 잡는 구조라 왜곡이 크게 난다. 그런데 노는 **그냥 직선이라 코드로 그리는 게 정확하고**, 각도를 흔들면 젓는 동작까지 살아난다. 선체의 노 구멍 위치를 재서 거기서 뻗어 나오게 한다.

**하체도 필요 없다.** 선원은 **배 스프라이트보다 먼저** 그린다. 그러면 갑판 아래는 선체가 덮고 난간이 몸통 아래를 가로지르므로, 애초에 안 보이는 부분이다. 상체만 만들면 왜곡 위험이 줄고 용량도 준다.

| 항목 | 값 |
|---|---|
| 대체 대상 | 없음 — 신규 |
| 범위 | **상체만** — 머리·어깨·팔·허리까지 |
| 화면 표시 | 높이 `odysseusH() × 0.45` |
| 소스 해상도 | 1280×320 시트 → 4등분, 각 높이 200으로 다운스케일 |
| 개수 | **4 포즈**, 갑판에 고정 배치 |
| 방향 | **측면, 오른쪽 보기.** 좌현 선원은 좌우 반전 |
| 앵커 | 각 인물 **가로 중앙 × 하단 절단선** |
| 그리는 순서 | **배보다 먼저** (선체·난간이 아랫부분을 가림) |
| 회전 | **없음.** 오디세우스만 기운다 |
| 노 | **코드로 그림.** 스프라이트에 넣지 말 것 |

하단 절단선은 **수평 직선**으로 깔끔하게 자른다. 어차피 선체 뒤에 숨지만, 삐뚤면 난간 틈으로 잘린 단면이 비친다.

오디세우스보다 **작고 어둡게** 나와야 한다. 주인공보다 눈에 띄면 구도가 무너진다. 밀랍은 귀에 붙은 작은 밝은 점으로 읽히면 충분하다.

### 프롬프트

```
Flat vector silhouette game sprite sheet, side view, facing right.
Subject: four ancient Greek oarsmen, UPPER BODY ONLY — head, shoulders,
arms and torso down to the waist. Each is mid-row: leaning forward, pulling
back, upright, and twisting. Each has a small pale lump of beeswax plugging
the visible ear. Hands closed as if gripping something.

CRITICAL
- NO OARS. No poles, no shafts, no blades. Hands grip empty air.
- UPPER BODY ONLY. Cut off cleanly at the waist — no hips, no legs.
- The bottom edge of each figure must be a straight horizontal cut.

STYLE
- Flat shapes only. No gradients, no texture, no painterly rendering.
- Tunic #c8b48a darkened, skin #d8c49a darkened, wax a pale dot.
- Darker and plainer than a hero figure — these are background crew.
- Ancient Greek, Homeric. No modern or fantasy elements.

OUTPUT
- Transparent background (PNG with alpha). No deck, no ship, no scenery.
- Four figures in one row, evenly spaced, clear empty gaps between them.
- All four cut at the same height, sharing one straight bottom line.
- No drop shadow, no ground plane, no reflection.
- Canvas 1280x320.
```

## 6. `assets/backdrop.webp` — 먼 배경

**조건부로 가능하다.** 전체 화면을 덮는 한 장은 비율이 제각각이라 위험하지만, **잘려나가도 되는 그림**이면 cover 방식(비율 유지하며 채우고 넘치는 부분은 잘라냄)으로 안전하다.

| 항목 | 값 |
|---|---|
| 대체 대상 | 없음 — `drawSky()` 위에 얹는 레이어 |
| 화면 표시 | 화면 전체, **cover 맞춤** |
| 소스 해상도 | 1920×1080 → 너비 1280으로 다운스케일 |
| 비율 | **16:9** |
| 그리는 순서 | `drawSky()` 다음, `drawRocks()` 앞 |
| 불투명도 | 코드에서 `globalAlpha 0.5` 내외로 얹음 |

**바깥 15%에 중요한 것을 넣지 말 것.** 세로 화면에서는 좌우가, 와이드에서는 상하가 잘려나간다. 달·먼 절벽 같은 요소는 중앙 70% 안에 둔다.

하늘 그라디언트는 그대로 남으므로 이 그림은 **분위기 레이어**다. 배경 전체를 칠하려 하지 말고 실루엣과 안개만 담는다. 하단은 바다에 묻히므로 아래로 갈수록 투명해지면 좋다.

```
Flat vector scenery layer for a night sea strait.
Subject: distant jagged cliffs on both far sides, low haze over the water,
a thin moon high up. Everything far away and small — this is a backdrop.

STYLE
- Flat shapes only. No gradients except a soft haze. No texture.
- Near-black #05080f cliffs, faint #111d3a haze, tiny #e8b24c moon.
- Very low contrast — it must sit behind everything without competing.
- Ancient Greek, Homeric. No modern or fantasy elements.

OUTPUT
- Transparent background (PNG with alpha). No foreground, no ship, no figures.
- Nothing important within the outer 15% — the edges will be cropped.
- Fade to fully transparent along the bottom edge.
- Canvas 1920x1080, exactly 16:9.
```

---

## 7. `assets/wave.webp` — 물마루 (3종 시트)

**움직임은 코드에 남고, 모양만 에셋으로 바꾼다.** 지금은 `swell` 배열이 반투명 직선을 흘려보내는데, 스크롤·속도·재생성은 그대로 두고 그리는 도형만 스프라이트로 교체한다.

| 항목 | 값 |
|---|---|
| 대체 대상 | `drawWater()`의 `swell` 직선 `stroke` |
| 화면 표시 | 너비 **60~250px** (기존 `s.len` 그대로) |
| 소스 해상도 | 1536×256 시트 → 3등분, 각 너비 260으로 다운스케일 |
| 개수 | 3종, 스폰 시 랜덤 선택 |
| 앵커 | 각 물마루 **중앙** |
| 불투명도 | 코드에서 `globalAlpha 0.16` 유지 |

**타일링이 필요 없다.** 물마루가 낱개로 흩뿌려지므로 좌우 이음매를 맞추지 않아도 된다. 대신 각 물마루의 **좌우 끝이 가늘게 사라져야** 잘린 티가 안 난다.

```
Flat vector sprite sheet — three separate ocean wave crests, side view.
Subject: three long thin horizontal crests of water, seen nearly edge-on
from deck level. Simple, calm, night sea. Not breaking, not foaming.

STYLE
- Flat shapes only. No gradients, no texture, no painterly rendering.
- Single pale colour, near white. No outline, no fill variation.
- Each crest tapers to nothing at both left and right ends.
- Very simple — these read at 100px wide.

OUTPUT
- Transparent background (PNG with alpha). No sea, no sky, no scenery.
- Three crests in one row, evenly spaced, clear empty gaps between them.
- Each crest much wider than tall, roughly 6:1.
- No drop shadow, no reflection.
- Canvas 1536x256.
```

---

## 스프라이트 시트로 한 번에 받기 (권장)

GPT는 호출마다 스타일이 미묘하게 달라진다. **여러 개를 한 장에 배치해 받으면** 톤이 일관된다. 자르는 건 이쪽에서 `sips`로 처리.

5번(선원)과 7번(물마루)은 **처음부터 시트가 규격**이다. 각 스펙의 프롬프트를 그대로 쓰면 된다.

4번(배)과 6번(배경)은 비율이 서로 달라서 **한 장에 묶지 말 것.** 배는 2:1, 배경은 16:9다. 각각 따로 뽑는다.

1~3번은 이미 낱장으로 받았고 톤이 맞았다. 4~7번을 뽑을 때는 **같은 대화창에서 이어서** 뽑아 스타일을 유지하고, 프롬프트 앞에 다음을 붙일 것:

```
Same flat silhouette style as the siren and Odysseus sprites in this chat —
same palette, same flatness, same absence of texture and shading.
```

---

## WebP 변환

도구는 `sips`(macOS 기본)와 `cwebp` / `dwebp` 1.6.0(Homebrew). 받은 PNG를 그대로 커밋하지 말고 반드시 이 단계를 거친다.

### 무손실로 간다

플랫 실루엣은 색 수가 적고 경계가 딱 떨어진다. 이런 그림은 **무손실 WebP가 손실 압축보다 작으면서 화질도 완벽한** 경우가 대부분이다. 손실 압축은 하드 엣지 주변에 링잉(번짐)을 만들어 실루엣에 특히 나쁘다.

다만 그림에 따라 뒤집히기도 하므로 **둘 다 뽑아서 작은 쪽을 채택**한다.

### 파이프라인

에셋마다 크롭 → 리사이즈 → 변환 순서.

```bash
cd content/vol-01-seolhwa/ch-seirenui-norae

# 1) 리사이즈 — PNG 상태로, 알파 유지
sips --resampleHeight 320 siren-src.png --out /tmp/siren-320.png

# 2) 무손실 / 손실 둘 다 인코딩
cwebp -lossless -m 6 -alpha_q 100 /tmp/siren-320.png -o /tmp/a.webp
cwebp -q 90     -m 6 -alpha_q 100 /tmp/siren-320.png -o /tmp/b.webp

# 3) 작은 쪽을 자동 채택
[ $(stat -f%z /tmp/a.webp) -le $(stat -f%z /tmp/b.webp) ] \
  && cp /tmp/a.webp siren.webp \
  || cp /tmp/b.webp siren.webp
```

**실측 기록 — 예상이 뒤집혔다.** 실제 GPT 산출물(`assets/siren.webp`)로 돌린 결과:

| 인코딩 | 크기 |
|---|---|
| 무손실 | 72,936B |
| **손실 q90** | **29,128B** ← 채택 |

손실이 2.5배 작았다. GPT 이미지는 플랫해 보여도 선마다 안티에일리어싱과 미세한 색 변화가 깔려 있어서 무손실에 불리하다. 반대로 색이 진짜 몇 개뿐인 도형(예: 손으로 그린 SVG 계열)은 무손실이 이긴다.

**→ 어느 쪽이 이길지 미리 알 수 없다. 매번 둘 다 뽑아 비교할 것.** q90에서 육안 열화는 확인되지 않았다.

`-m 6`은 가장 느리고 가장 잘 줄이는 압축 모드. 에셋이 3장뿐이라 시간은 문제되지 않는다.

### 에셋별 목표 치수

| 파일            | 리사이즈     | 명령                        |
| --------------- | ------------ | --------------------------- |
| `assets/siren.webp`    | 높이 **320** | `sips --resampleHeight 320` |
| `assets/odysseus.webp` | 높이 **410** | `sips --resampleHeight 410` |
| `assets/rock-lip.webp` | 너비 **520** | `sips --resampleWidth 520`  |

전부 화면 표시 크기의 2배(레티나 대응)다. **이보다 크게 넣지 말 것** — 용량만 먹고 화면에서는 차이가 없다.

### 시트에서 잘라내기

한 장으로 받았다면 `--cropOffset`은 **Y, X 순서**다.

```bash
# 1536×1024 시트에서 가운데 512×1024 구간
sips --cropToHeightWidth 1024 512 --cropOffset 0 512 sheet.png --out /tmp/odysseus-src.png
```

오디세우스는 자른 뒤 **좌우 여백이 대칭인지 눈으로 반드시 확인**할 것. 여기가 어긋나면 회전축이 발치에서 벗어난다.

### 검증

```bash
# 알파가 살아있는지 + 실제 치수
dwebp siren.webp -o /tmp/check.png
sips -g pixelWidth -g pixelHeight -g hasAlpha /tmp/check.png

# 폴더 총량 (예산 300KB)
du -sh .
```

`hasAlpha: yes`가 아니면 투명도가 날아간 것이다. 다시 인코딩할 것.

### cwebp가 없는 환경

`brew install webp`. 설치가 어렵다면 **PNG로 커밋해도 동작은 한다** — 다만 보통 3~5배 크고, 3중 복사 때문에 레포에는 그 3배가 쌓인다. WebP 알파는 모든 최신 브라우저가 지원하며 로컬 파일이므로 CDN 금지 룰과도 무관하다.

---

## 전달 방법

파일을 이 폴더에 넣거나, 아무 데나 두고 경로만 알려줄 것. 각 파일이 무엇인지 한 줄씩 첨부.

받은 뒤 이쪽에서 처리하는 것:

1. 크롭 및 앵커 정렬 (특히 오디세우스 좌우 대칭)
2. 표시 크기의 2배로 리사이즈 — [WebP 변환](#webp-변환)의 치수표대로
3. WebP 변환, 무손실/손실 비교 후 작은 쪽 채택, `hasAlpha` 검증
4. 캔버스 드로우 배선 — 이미지 로드, 좌우 반전, 회전 피벗 연결
5. 로드 실패 시 **기존 도형으로 폴백** 유지 (에셋 없이도 작품이 돌아가야 함)
6. 원본 PNG는 폴더에 남기지 않고 삭제 (3중 복사 대상이 됨)

---

## 체크리스트

- [ ] 투명 배경 (불투명하게 오면 로컬에 제거 도구가 없음 — `brew install imagemagick` 필요)
- [ ] 팔레트 준수, 그라디언트·텍스처 없음
- [ ] 그림자·발광·지면 굽지 않음
- [x] 세이렌: 오른쪽 보기, 바위 미포함
- [x] 오디세우스: 정면, 좌우 대칭, 돛대 미포함, 밧줄 포함
- [x] 바위: 상단만, 하단 가장자리가 단색 직선
- [ ] 배: **돛 없음**(가장 흔한 실수), 돛대가 **수직 + 가로 정중앙**, 갑판면 60%, 인물·노 미포함
- [ ] 선원: **상체만 + 노 없음**, 4인 한 줄, 하단 절단선이 수평 직선, 오디세우스보다 어둡게
- [ ] 배경: 바깥 15%에 중요 요소 없음, 하단 투명 페이드, 16:9
- [ ] 물마루: 3종 한 줄, 좌우 끝이 가늘게 소실, 6:1
- [ ] **`.webp`로 변환 완료** — PNG 원본이 폴더에 남아있지 않을 것
- [ ] `dwebp` + `sips -g hasAlpha`로 투명도 생존 확인
- [ ] 치수가 표시 크기의 2배인지 확인 (320 / 410 / 780 / 1200 / 300 / 1280 / 260)
- [ ] 챕터 폴더 합계 300KB 이하
- [ ] 외부 요청 0 — 모든 파일이 이 폴더 안에 (`CONTRIBUTING.md` 하드 룰 1)

---

## 참고: 좌표 레퍼런스

```
CHROME_PAD   150       사이트 셸 고정 헤더가 덮는 상단 구간
deckY        H × 0.82  갑판면 = 오디세우스 회전 피벗의 y
bodyLen      clamp(H × 0.19, 88, 175)
odysseusH()  bodyLen × 1.16          오디세우스 전신 높이
MAX_LEAN     0.95 rad (±54°)
HEAD_HIT     7         머리 피격 반경 (그려진 머리는 약 11)
수면          deckY − 30

세이렌 크기   clamp(H × 0.15, 96, 150)
세이렌 x      min(W × 0.06, rockOuter())  좌 / 우는 W에서 뺀 값
세이렌 y      CHROME_PAD + 세이렌높이 ~ min(H × 0.62, deckY − 80)
             레인 0.08 / 0.26 / 0.66 / 0.94
바위 너비     clamp(W × 0.26, 300, 460)

그리는 순서
  하늘 → 바위 → 바다 → 세이렌 → 음파 → 배 → 오디세우스 → 음표 → 파티클
  (배경은 하늘 다음, 선원은 배 다음 오디세우스 앞)
```

### 측정한 앵커 값

| 상수 | 값 | 뜻 |
|---|---|---|
| `SIREN_FOOT_X` | 0.447 | 발톱이 스프라이트 폭의 이 지점 |
| `SIREN_MOUTH_X` | 0.46 | 입의 가로 오프셋 (앉은 지점 기준, 폭 배수) |
| `SIREN_MOUTH_Y` | 0.875 | 입의 세로 오프셋 (앉은 지점 위, 높이 배수) |
| `ROCK_PERCH_X` | 0.17 | 세이렌이 앉는 턱의 가로 위치 |
| `ROCK_PERCH_Y` | 0.016 | 턱의 세로 위치 |
| `ODY_HEAD_FRAC` | 0.932 | 머리 중심 (발치에서 위로, 전신 높이 배수) |

새 에셋도 같은 방식으로 잰다 — `scratchpad/bbox.js`(알파 바운딩박스·발 중심)와 `scratchpad/rock.js`(상단 윤곽 프로파일·하단 불투명도).
