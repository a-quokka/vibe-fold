/** Folder palette.
 *
 *  Bright, slightly chalky neons on near-black — every swatch light enough to
 *  take black ink, so the folders read as coloured paper rather than as glowing
 *  panels. Colours are assigned by a volume's position in the archive rather
 *  than by `Math.random()`, so a volume keeps the same colour across reloads,
 *  between visitors, and — the reason this lives in its own module — between
 *  the folder stack on the home page and the volume page that folder opens.
 *
 *  Measured against their own ink: coral 5.92:1, sky 11.85:1, green 12.19:1,
 *  yellow 14.73:1, pink 9.57:1, grey 13.38:1. Against the page's #191919 every
 *  one clears 5:1, so the folder shapes stay legible as shapes.
 */
export interface Swatch {
	bg: string;
	ink: string;
}

const INK = '#111111';

export const FOLDER_COLORS: Swatch[] = [
	{ bg: '#f8595e', ink: INK },
	{ bg: '#9fd4f2', ink: INK },
	{ bg: '#6fe96f', ink: INK },
	{ bg: '#f2e67c', ink: INK },
	{ bg: '#f2a0c8', ink: INK },
	{ bg: '#d9d9d9', ink: INK },
];

export function swatchAt(index: number): Swatch {
	return FOLDER_COLORS[index % FOLDER_COLORS.length];
}
