import type { APIRoute } from 'astro';

/** 검색 로봇에게 하는 첫 인사.
 *
 *  전부 들어와도 된다고 적고, 페이지 목록표가 어디 있는지 알려 줍니다.
 *  막는 자리는 두지 않습니다 — 이 사이트에 사람이 보지 않아야 할 페이지는
 *  없고, 액자 안의 그림(`/chapters/…`)까지 읽어야 로봇이 작품 페이지를
 *  제대로 그려 봅니다.
 *
 *  주소를 손으로 적지 않고 `site` 에서 가져옵니다. 도메인이 바뀌면 여기도
 *  같이 바뀌어야 하는데, 두 군데 적어 두면 한 군데는 반드시 낡습니다. */
export const GET: APIRoute = ({ site }) => {
	const origin = site ?? new URL('https://fold.vibecodingclub.kr');

	const body = `User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap.xml', origin).href}
`;

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
