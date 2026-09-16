import sharp from 'sharp';

/** 작품 썸네일에서 그 작품을 대표할 색 하나를 뽑습니다.
 *
 *  평균색을 쓰지 않는 이유는, 사진의 평균은 거의 언제나 탁한 회갈색으로
 *  수렴하기 때문입니다. 밤하늘 사진 세 장의 평균을 나란히 놓으면 세 장이
 *  전부 같은 색으로 보입니다.
 *
 *  그래서 눈이 실제로 집어내는 색을 찾습니다. 그림을 아주 작게 줄여 모든
 *  화소를 훑고, 너무 어둡거나 너무 밝아서 색을 말할 수 없는 화소를 버린
 *  다음, 남은 화소를 색상환의 칸에 나눠 담습니다. 가장 많은 화소가 담긴
 *  칸이 그 그림에서 눈에 들어오는 색입니다.
 */

/** 색을 말할 수 있는 화소인지 판정하는 기준입니다. 검정에 가까운 화소와
 *  흰색에 가까운 화소는 색조를 거의 갖고 있지 않아서, 모아 봐야 그림을
 *  대표하지 못합니다. */
const DARKEST = 0.2;
const LIGHTEST = 0.92;
const FAINTEST = 0.35;

/** 색상환을 몇 칸으로 나눌지 정합니다. 칸이 너무 넓으면 빨강과 주황이 한
 *  칸에 들어가고, 너무 좁으면 같은 색이 여러 칸으로 흩어집니다. */
const SECTORS = 24;

type Hsl = { h: number; s: number; l: number };

function toHsl(r: number, g: number, b: number): Hsl {
	const red = r / 255;
	const green = g / 255;
	const blue = b / 255;

	const high = Math.max(red, green, blue);
	const low = Math.min(red, green, blue);
	const span = high - low;
	const l = (high + low) / 2;

	if (span === 0) return { h: 0, s: 0, l };

	const s = l > 0.5 ? span / (2 - high - low) : span / (high + low);

	let h: number;
	if (high === red) h = ((green - blue) / span + (green < blue ? 6 : 0)) / 6;
	else if (high === green) h = ((blue - red) / span + 2) / 6;
	else h = ((red - green) / span + 4) / 6;

	return { h: h * 360, s, l };
}

function toHex(r: number, g: number, b: number): string {
	const pair = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
	return `#${pair(r)}${pair(g)}${pair(b)}`;
}

/** 썸네일 한 장에서 색을 최대 `want` 개까지 뽑습니다. 선명한 순서로
 *  돌려주며, 읽을 수 없는 파일이면 빈 배열을 돌려줍니다. */
export async function pickColours(file: string, want = 1): Promise<string[]> {
	let width: number;
	let height: number;
	let data: Buffer;

	try {
		const small = await sharp(file)
			// 64화소면 충분합니다. 대표색을 찾는 일이지 그림을 보는 일이 아니고,
			// 작게 줄이는 과정에서 잡티가 평탄해지는 이점도 있습니다.
			.resize(64, 64, { fit: 'inside' })
			.raw()
			.toBuffer({ resolveWithObject: true });
		width = small.info.width;
		height = small.info.height;
		data = small.data;
		if (small.info.channels < 3) return [];
		// 채널 수가 3이든 4이든 앞의 셋만 읽습니다.
		var step = small.info.channels;
	} catch {
		// SVG 처럼 래스터로 못 푸는 파일이거나 경로가 틀린 경우입니다.
		return [];
	}

	const buckets = new Map<number, { count: number; sat: number; r: number; g: number; b: number }>();

	for (let i = 0; i < width * height * step; i += step) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];
		const { h, s, l } = toHsl(r, g, b);

		if (l < DARKEST || l > LIGHTEST || s < FAINTEST) continue;

		const sector = Math.floor((h / 360) * SECTORS) % SECTORS;
		const bucket = buckets.get(sector) ?? { count: 0, sat: 0, r: 0, g: 0, b: 0 };
		bucket.count += 1;
		bucket.sat += s;
		bucket.r += r;
		bucket.g += g;
		bucket.b += b;
		buckets.set(sector, bucket);
	}

	// 화소가 많은 칸이 아니라, 많으면서 선명한 칸을 앞에 둡니다. 밤 장면은
	// 어두운 배경 화소가 압도적으로 많아서, 개수만 세면 어느 그림에서나
	// 같은 남색이 나옵니다.
	return [...buckets.values()]
		.sort((a, b) => b.count * (b.sat / b.count) - a.count * (a.sat / a.count))
		.slice(0, want)
		.map((bucket) => toHex(bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count));
}
