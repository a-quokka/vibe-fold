// @ts-check
import { defineConfig } from 'astro/config';
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = fileURLToPath(new URL('.', import.meta.url));
const volumesDir = join(root, 'content');
const publicChaptersDir = join(root, 'public/chapters');

/**
 * Copy chapter folders into public/ for static serving + iframe src.
 */
function syncContentToPublic() {
	if (!existsSync(volumesDir)) return;

	rmSync(publicChaptersDir, { recursive: true, force: true });
	mkdirSync(publicChaptersDir, { recursive: true });

	for (const entry of readdirSync(volumesDir, { withFileTypes: true })) {
		if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

		const volumePath = join(volumesDir, entry.name);
		const volumeYamlPath = join(volumePath, 'volume.yaml');
		if (!existsSync(volumeYamlPath)) continue;

		const volume = parseYaml(readFileSync(volumeYamlPath, 'utf8'));
		const volId = `${volume.number}-${volume.slug}`;

		const chapterDirs = Array.isArray(volume.chapters) ? volume.chapters : [];
		if (chapterDirs.length === 0) continue;

		chapterDirs.forEach((dirName, index) => {
			const chapterPath = join(volumePath, dirName);
			const metaPath = join(chapterPath, 'meta.yaml');
			const indexPath = join(chapterPath, 'index.html');
			if (!existsSync(metaPath) || !existsSync(indexPath)) {
				throw new Error(
					`Chapter "${dirName}" listed in ${volumeYamlPath} is missing meta.yaml or index.html`,
				);
			}

			const meta = parseYaml(readFileSync(metaPath, 'utf8'));
			const chId = `${index + 1}-${meta.slug}`;
			const dest = join(publicChaptersDir, volId, chId);
			mkdirSync(dirname(dest), { recursive: true });
			cpSync(chapterPath, dest, { recursive: true });
		});
	}
}

/** 내보낸 자바스크립트를 옛 문법으로 번역합니다.
 *
 *  최신 문법(예컨대 `||=`)이 한 군데라도 남아 있으면, 그것을 모르는
 *  브라우저는 파일 전체를 파싱하지 못하고 자바스크립트를 한 줄도 실행하지
 *  않습니다. 화면이 조금 덜 예쁜 정도가 아니라, 들어오는 움직임도 폴더가
 *  펼쳐지는 장면도 통째로 사라지고, 본문을 숨겨 두고 스크립트가 다시 켜는
 *  화면은 빈 화면으로 남습니다. 아이폰의 인앱 브라우저(네이버 앱 등)는
 *  iOS 의 WebKit 을 그대로 쓰므로, 낡은 기기를 쓰는 사람이 여기에 그대로
 *  걸립니다.
 *
 *  `vite.build.target` 으로 지정하는 길도 있지만 Astro 가 그 값을 쓰지
 *  않습니다 — 지정해도 청크가 그대로 나옵니다. 그래서 빌드가 끝난 뒤에
 *  esbuild 로 한 번 더 번역합니다. 기준은 es2019 입니다. 브라우저 이름으로
 *  적는 길(`safari13`)도 있지만, 그러면 esbuild 가 구조 분해 문법을 옮기지
 *  못한다며 거부합니다. 해의 이름으로 적으면 옮길 수 있는 것만 옮기고,
 *  `||=` 같은 최신 문법은 남기지 않습니다. */
function lowerClientScripts() {
	return {
		name: 'vibe-lower-client-scripts',
		hooks: {
			'astro:build:done': async ({ dir, logger }) => {
				const { transform } = await import('esbuild');
				const assets = join(fileURLToPath(dir), '_astro');
				if (!existsSync(assets)) return;

				let count = 0;
				for (const name of readdirSync(assets)) {
					if (!name.endsWith('.js')) continue;

					const file = join(assets, name);
					const { code } = await transform(readFileSync(file, 'utf8'), {
						target: 'es2019',
						format: 'esm',
						minify: true,
						legalComments: 'none',
					});
					writeFileSync(file, code);
					count += 1;
				}

				logger.info(`옛 문법으로 번역한 스크립트 ${count}개 (es2019)`);
			},
		},
	};
}

/** @type {import('astro').AstroIntegration} */
function contentSyncIntegration() {
	return {
		name: 'vibe-content-sync',
		hooks: {
			'astro:config:setup': () => {
				syncContentToPublic();
			},
			'astro:server:setup': ({ server }) => {
				syncContentToPublic();
				server.watcher.add(volumesDir);
				server.watcher.on('all', (_event, filePath) => {
					if (typeof filePath === 'string' && filePath.startsWith(volumesDir)) {
						syncContentToPublic();
					}
				});
			},
			'astro:build:start': () => {
				syncContentToPublic();
			},
		},
	};
}

/**
 * Chapters run in `<iframe sandbox="allow-scripts">`, which gives them an opaque
 * origin. Every asset they request therefore arrives as `Sec-Fetch-Site: cross-site`
 * with `Origin: null`, and the dev server's sec-fetch guard answers 403 — so
 * sprites, fonts and data files silently vanish during `astro dev` while working
 * perfectly in the static build.
 *
 * Dev only, and scoped to /chapters/ — the guard still covers every other route.
 */
function allowSandboxedChapterAssets() {
	return {
		name: 'vibe-allow-sandboxed-chapters',
		configureServer(server) {
			// Returning a function defers to after Astro has installed its own
			// middleware; unshifting then puts us genuinely first, which plugin
			// ordering alone does not guarantee.
			return () => {
				server.middlewares.stack.unshift({
					route: '',
					handle: (req, _res, next) => {
						if (req.url && req.url.startsWith('/chapters/')) {
							delete req.headers['sec-fetch-site'];
						}
						next();
					},
				});
			};
		},
	};
}

// https://astro.build/config
export default defineConfig({
	site: 'https://fold.vibecodingclub.kr',
	integrations: [contentSyncIntegration(), lowerClientScripts()],
	vite: {
		plugins: [allowSandboxedChapterAssets()],
	},
});
