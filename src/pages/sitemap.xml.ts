import type { APIRoute } from 'astro';
import { chapterHref, getAllVolumes, volumeHref } from '../lib/content';

/** 검색 로봇에게 주는 페이지 목록표.
 *
 *  손으로 적지 않고 저장소의 내용에서 뽑습니다. 작품을 한 편 더 넣으면
 *  목록에도 저절로 들어가야 하고, 손으로 적어 둔 목록은 반드시 낡습니다.
 *
 *  싣는 주소는 실제로 만들어지는 페이지와 같아야 합니다 — 볼륨 페이지와
 *  작품 페이지는 `published` 인 볼륨에만 생기므로(각 페이지의
 *  `getStaticPaths` 를 보십시오), 여기서도 같은 조건으로 거릅니다. 없는
 *  주소를 목록에 싣는 것은 로봇에게 404 를 주는 것과 같습니다.
 *
 *  작품의 원본(`/chapters/…`)은 싣지 않습니다. 그쪽은 액자 안에서 돌아가는
 *  그림 자체이고, 사람이 들어와 읽을 자리는 그것을 감싼 작품 페이지입니다.
 *  둘을 같이 실으면 같은 작품이 검색 결과에 두 번 나옵니다. */
export const GET: APIRoute = ({ site }) => {
	const origin = site ?? new URL('https://fold.vibecodingclub.kr');
	/** 끝에 빗금을 붙여 적습니다. 페이지가 스스로 밝히는 대표 주소
	 *  (`<link rel="canonical">`)가 빗금으로 끝나므로, 목록에 다른 모양으로
	 *  적으면 로봇이 같은 페이지를 두 주소로 셉니다. */
	const at = (path: string) => new URL(path.endsWith('/') ? path : `${path}/`, origin).href;

	const published = getAllVolumes().filter((volume) => volume.status === 'published');

	/** 홈이 가장 중요하고, 볼륨이 그다음, 작품이 그다음입니다. `priority` 는
	 *  구글이 더 이상 보지 않지만 네이버를 비롯한 다른 로봇은 아직 읽습니다. */
	const entries: { loc: string; priority: string }[] = [
		{ loc: at('/'), priority: '1.0' },
		...published.map((volume) => ({ loc: at(volumeHref(volume.volId)), priority: '0.8' })),
		...published.flatMap((volume) =>
			volume.chapters.map((chapter) => ({
				loc: at(chapterHref(volume.volId, chapter.chId)),
				priority: '0.7',
			})),
		),
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
	.map(
		({ loc, priority }) => `	<url>
		<loc>${loc}</loc>
		<changefreq>monthly</changefreq>
		<priority>${priority}</priority>
	</url>`,
	)
	.join('\n')}
</urlset>
`;

	return new Response(body, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' },
	});
};
