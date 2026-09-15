# 재료와 제작 기록

## 시각 기준

사용자가 승인한 8장면: 흥부의 치료 → 제비의 씨앗 → 성장과 연주 → 흥부의 풍요 → 놀부의 행동 → 놀부의 박 → 소동 → 다시 씨앗.

공통 화풍은 한국 민화·수묵, 따뜻한 한지, 황토색 박, 주홍과 쪽빛 비단입니다. 제비는 검은 날개·밝은 배·붉은 목·갈라진 꼬리로 일관성을 유지합니다. 원전 사건 이후 합주·순환 결말은 창작 각색입니다.

원전 참고: https://encykorea.aks.ac.kr/Article/E0066012

## AI 생성 재료

2026-09-14, Codex 내장 image generation 도구로 이 작업에서 생성했습니다. 별도 API/모델 지정은 사용하지 않았으며 구체적인 내부 모델 버전은 확인되지 않았습니다. 외부 작가의 이미지를 사용하지 않았습니다.

`assets/images.js`에 아래 PNG 원본을 base64 data URI로 내장했습니다. 두 이미지 모두 실제 alpha 채널을 확인했습니다.

| 키 | 내용 | 생성 결과 ID |
| --- | --- | --- |
| gourd | 단독 박, 투명 배경 | exec-12917675-dcdc-4a22-b10c-2af0549d1c0b |
| hands | 흥부·놀부 손과 제비의 두 비네트, 투명 배경 | exec-e86c7f8f-262a-44aa-8070-297d37a6df90 |

생성 원본은 이 세션의 `~/.codex/generated_images/01a09f44-555a-7f63-94f1-6d317a9f1765/`에 보존됩니다. 실행은 해당 외부 경로에 의존하지 않습니다.

### Gourd prompt

Extract and recreate ONE CLOSED center gourd from this reference as a standalone production sprite on a genuinely TRANSPARENT background (alpha). Portrait canvas. Single large Korean bottle gourd centered, pale warm ochre fibrous watercolor surface, dark charcoal dry-brush pooling concentrated lower right, faded ink contour, pear shaped body with small bulb at top and big rounded bottom exactly like reference. Include tiny narrow hooked stem at top, but NO vine, NO leaves, NO concentric circles, NO cracks, NO paper background, NO shadow, NO surrounding objects, NO text. Keep all opaque pigment inside the silhouette, naturally feathered alpha only at brush edges. Gourd occupies 85 percent of canvas height with safe margin on all sides. Preserve exact subtle traditional Korean ink/minhwa handmade texture. This asset will rotate and split into two halves in an interactive canvas artwork.

### Hands prompt

Create a wide 2:1 transparent-background production sprite sheet with TWO separate isolated hand-and-bird vignettes. Preserve precisely the reference Korean ink/minhwa wash texture, ochre skin, swallow black wings ivory belly vermilion throat long forked tail. LEFT HALF: the caring patched undyed hemp sleeves and two hands cradling the bird and wrapping its leg from image 1. RIGHT HALF: intact indigo sleeves and two hands grasping the bird's body and leg BEFORE harm from image 2. No blood. Both vignettes same scale, each fully contained in its own half with 8 percent blank margin from all canvas edges and a clear transparent gap between them. Keep fingers, swallow identity and clothing consistent with each reference. Genuine alpha transparency everywhere outside the silhouettes including between fingers; remove ALL paper background, gourd silhouettes and loose graphic marks. No full faces, no text, no labels, no panels, no frames, no shadow, no additional objects. The sprites will be animated independently on a paper canvas. Keep loose organic sleeve ends with soft brush edges at bottom.

첫 결과에 체크무늬가 그려져 재편집했습니다. 최종 편집 prompt:

Edit only the background of this exact sprite sheet. Remove the gray checkerboard completely and output a genuinely transparent RGBA PNG with alpha zero wherever checkerboard currently appears. This is background removal, do NOT paint a checkerboard or simulate transparency with gray or white pixels. Preserve both hand/bird groups exactly, their colors, brush textures, shapes, placement and scale. Keep all body/skin/sleeve/bird surfaces opaque, make space between groups and fingers actually transparent. No other visual edits. Transparent background.

## 코드·소리·글꼴

코드와 절차적 도형, 한지 질감 및 Web Audio 합성음은 이 작품을 위해 작성했습니다. 제삼자 라이브러리 코드·음원·폰트 파일을 포함하지 않습니다. 브라우저의 시스템 글꼴을 사용합니다. `thumbnail.png`는 이 작품의 실제 렌더링을 이용해 만든 세로형 표지입니다.

## 두 번째 수정의 서사 재료

같은 도구로 기존 손·제비 그림을 참조해 만든 추가 키프레임을 `assets/story-images.js`에 내장했습니다. 이 두 재료는 alpha 투명이 아닌 순백색 배경이며 Canvas의 multiply 합성으로 사용합니다. 놀부 그림의 체크무늬 배경 시도 두 장은 채택하지 않았습니다.

| 키 | 내용 | 생성 결과 ID |
| --- | --- | --- |
| healBefore | 같은 삼베 소매와 제비, 다리를 감싸기 전 느슨한 천 | exec-51555602-99bf-4b9b-a360-830e27a886a6 |
| hurtAfter | 같은 쪽빛 소매와 제비, 다리를 꺾는 행동 직후 | exec-9263f693-62cb-4e7c-a2b7-5984eeca2c29 |

원본 위치: `~/.codex/generated_images/01a0a02e-c894-7723-9965-f542c1b863e8/`. 실행은 외부 경로에 의존하지 않습니다.

치료 전 프롬프트 요지: 기존 그림 직전의 키프레임, 같은 두 손·기운 삼베 소매·검은 날개와 주홍 목의 제비. 받친 손 위에서 가느다란 다리가 처져 있고 다른 손은 아직 감기지 않은 천을 다리 아래에 든다. 위치와 크기를 최대한 유지하고 순백색 배경에 분리한다.

놀부 프롬프트 요지: 기존 그림 직후의 키프레임, 같은 쪽빛 소매·황토색 솔기·제비. 아래 손이 가느다란 다리를 꺾고 제비는 놀라 날개를 편다. 피·상처·노출된 뼈 없이 먹과 수채 질감을 유지한다. 최종 편집은 피사체를 유지한 채 배경만 완전한 #FFFFFF로 교체하도록 요청했다.

## 자유 연주 음악

현재 수록곡은 「작은 봄」「제비의 춤」「박 타는 잔치」「놀부의 소동」「달빛 아래 한지」입니다. 모두 이 작품을 위해 코드로 작성한 약 1분 길이의 창작곡입니다. 각 곡은 도입·응답·변주·마무리를 가지며, 같은 짧은 루프의 반복 재생 대신 정해진 악보 이벤트로 진행합니다.

`tracks.js`에 음높이·장단·반주·악구 데이터를 두고 Web Audio로 합성합니다. 유명곡의 선율, 음원 샘플, 외부 영상 플레이어는 포함하지 않습니다. 실제 국악기 녹음이 아닌 합성 타악·현악기풍 음색입니다.

자동 연주 시계 방식은 Tone.js의 Transport 개념과 Web Audio 예약 방식을 검토하고 기존 합성음을 확장했습니다. 라이브러리 설치나 코드 복사는 하지 않았습니다. 참고: https://tonejs.github.io/ 및 https://github.com/tonejs/tone.js/wiki/Transport
