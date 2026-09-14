import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

export type VolumeStatus = 'published' | 'coming_soon';

export interface VolumeMeta {
	id: string;
	number: number;
	slug: string;
	title: string;
	summary: string;
	date: string;
	status: VolumeStatus;
	/** Where this volume stands in the drawer, if that is not where its number
	 *  would put it. The number is the volume's name and half of its address, so
	 *  it cannot be moved to reorder the stack; this can. */
	shelf?: number;
	featured?: boolean;
	example?: boolean;
}

export interface ChapterMeta {
	id: string;
	slug: string;
	title: string;
	creator: string;
	description: string;
	thumbnail: string;
	/** Optional 1200x630 share card, relative to the chapter folder. */
	shareImage?: string;
	/** Optional favicon for this chapter's page, relative to the chapter folder. */
	favicon?: string;
	links?: {
		github?: string;
		website?: string;
		instagram?: string;
	};
}

export interface Chapter extends ChapterMeta {
	order: number;
	volId: string;
	chId: string;
	dirName: string;
	iframeSrc: string;
	thumbSrc: string;
	shareImageSrc?: string;
	faviconSrc?: string;
}

interface VolumeYaml extends VolumeMeta {
	chapters?: string[];
}

export interface Volume extends VolumeMeta {
	volId: string;
	dirName: string;
	coverSrc?: string;
	chapters: Chapter[];
}

const volumesRoot = join(process.cwd(), 'content');

function loadYaml<T>(path: string): T {
	return parseYaml(readFileSync(path, 'utf8')) as T;
}

function toVolId(volume: VolumeMeta): string {
	return `${volume.number}-${volume.slug}`;
}

function toChId(order: number, slug: string): string {
	return `${order}-${slug}`;
}

function listedChapterDirs(volumeDir: string, chapterDirs: string[] | undefined): string[] {
	const dirs = chapterDirs ?? [];
	const seen = new Set<string>();

	for (const dirName of dirs) {
		if (!dirName || dirName.startsWith('_') || dirName.startsWith('.')) {
			throw new Error(`Invalid chapter folder "${dirName}" in ${volumeDir}/volume.yaml`);
		}
		if (seen.has(dirName)) {
			throw new Error(`Duplicate chapter "${dirName}" in ${volumeDir}/volume.yaml`);
		}
		seen.add(dirName);
	}

	return dirs;
}

function loadChapters(volumeDir: string, volId: string, chapterDirs: string[]): Chapter[] {
	if (chapterDirs.length === 0) return [];

	return chapterDirs.map((dirName, index) => {
		const chapterPath = join(volumeDir, dirName);
		const metaPath = join(chapterPath, 'meta.yaml');
		const indexPath = join(chapterPath, 'index.html');
		if (!existsSync(metaPath) || !existsSync(indexPath)) {
			throw new Error(
				`Chapter "${dirName}" listed in ${volumeDir}/volume.yaml is missing meta.yaml or index.html`,
			);
		}

		const meta = loadYaml<ChapterMeta>(metaPath);
		const order = index + 1;
		const chId = toChId(order, meta.slug);

		const asset = (file: string) => `/chapters/${volId}/${chId}/${file}`;

		return {
			...meta,
			order,
			volId,
			chId,
			dirName,
			iframeSrc: asset('index.html'),
			thumbSrc: asset(meta.thumbnail),
			shareImageSrc: meta.shareImage ? asset(meta.shareImage) : undefined,
			faviconSrc: meta.favicon ? asset(meta.favicon) : undefined,
		};
	});
}

export function getAllVolumes(): Volume[] {
	if (!existsSync(volumesRoot)) return [];

	const volumes: Volume[] = [];

	for (const entry of readdirSync(volumesRoot, { withFileTypes: true })) {
		if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) {
			continue;
		}

		const volumeDir = join(volumesRoot, entry.name);
		const yamlPath = join(volumeDir, 'volume.yaml');
		if (!existsSync(yamlPath)) continue;

		const meta = loadYaml<VolumeYaml>(yamlPath);
		const volId = toVolId(meta);
		const chapters = loadChapters(volumeDir, volId, listedChapterDirs(volumeDir, meta.chapters));

		volumes.push({
			...meta,
			featured: Boolean(meta.featured),
			example: Boolean(meta.example),
			volId,
			dirName: entry.name,
			coverSrc: chapters[0]?.thumbSrc,
			chapters,
		});
	}

	// Ascending: the folder stack paints in array order and the last one drawn
	// stands at the front, so the newest volume is the one facing the room.
	const shelfOf = (volume: VolumeMeta) => volume.shelf ?? volume.number;
	return volumes.sort((a, b) => shelfOf(a) - shelfOf(b));
}

export function getVolumeByVolId(volId: string): Volume | undefined {
	return getAllVolumes().find((volume) => volume.volId === volId);
}

export function getFeaturedVolume(): Volume | undefined {
	return getAllVolumes().find(
		(volume) => volume.featured && volume.status !== 'coming_soon',
	);
}

export function getChapter(volId: string, chId: string): Chapter | undefined {
	return getVolumeByVolId(volId)?.chapters.find((chapter) => chapter.chId === chId);
}

export function getAdjacentChapters(
	volume: Volume,
	chId: string,
): { prev?: Chapter; next?: Chapter; current?: Chapter } {
	const index = volume.chapters.findIndex((chapter) => chapter.chId === chId);
	if (index === -1) return {};

	return {
		current: volume.chapters[index],
		prev: index > 0 ? volume.chapters[index - 1] : undefined,
		next: index < volume.chapters.length - 1 ? volume.chapters[index + 1] : undefined,
	};
}

export function chapterHref(volId: string, chId: string): string {
	return `/vol/${volId}/ch/${chId}`;
}

export function volumeHref(volId: string): string {
	return `/vol/${volId}`;
}

export function formatVolLabel(number: number): string {
	return `Vol.${number}`;
}

export function formatVolumeTitle(volume: Pick<VolumeMeta, 'number' | 'title' | 'example'>): string {
	const label = `${formatVolLabel(volume.number)} ${volume.title}`;
	return volume.example ? `${label} (Example)` : label;
}

export function formatChapterLabel(order: number, title: string): string {
	return `Ch.${order} ${title}`;
}

/** The date printed on a volume's cover.
 *
 *  `volume.yaml` may hold a bare year (`2026`), a year-month, or a full date —
 *  and YAML turns an unquoted ISO date into a `Date` on its own, which is why
 *  this takes `unknown` rather than `string`. Everything comes back
 *  dot-separated: 2026, 2026.03, 2026.03.14.
 */
export function formatVolumeDate(date: unknown): string {
	if (date instanceof Date) {
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${date.getUTCFullYear()}.${pad(date.getUTCMonth() + 1)}.${pad(date.getUTCDate())}`;
	}

	return String(date ?? '').trim().replace(/-/g, '.');
}
