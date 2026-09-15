/** Where the notes are kept.
 *
 *  They used to live in the writer's own browser, which meant nobody ever read
 *  anybody else's — a guestbook that only its own author could open. They go
 *  to a small shared table now.
 *
 *  The key below is published on purpose. It is the kind meant to ship inside
 *  a page, and what it can do is not decided here but by the table's own
 *  rules: read a note, add a note, and nothing else. It cannot change or
 *  remove what is already written. Anything that needs more than that does not
 *  belong in a static site.
 */

const ENDPOINT = 'https://tlgomocfcfdxbdkqtxqq.supabase.co/rest/v1/guestbook';
const KEY = 'sb_publishable_boJLDQwN5TaIV2mvVBolug_PH9IyUVq';

const HEADERS: Record<string, string> = {
	apikey: KEY,
	Authorization: `Bearer ${KEY}`,
};

/** Two hundred characters, the same figure the table itself enforces. Said in
 *  both places on purpose: here so the writer is told before they press, there
 *  so it is true whatever the page says. */
export const LIMIT = 200;

/** A note as the page thinks of it. Where it sits on screen is not in here —
 *  that is worked out fresh for every reader, so the same note lands somewhere
 *  else each time and no two people see the same arrangement. */
export type Note = { id: string; text: string; at: number };

type Row = { id: string; body: string; created_at: string };

/** The latest hundred for this page, shuffled, and only as many as asked for.
 *
 *  Latest rather than random on the server's side because a page nobody has
 *  written on in a year should still show the year's writing, not a sample of
 *  it. The shuffle is here, where it costs nothing.
 */
export async function fetchNotes(page: string, want: number): Promise<Note[]> {
	const query = new URLSearchParams({
		select: 'id,body,created_at',
		page: `eq.${page}`,
		order: 'created_at.desc',
		limit: '100',
	});

	let rows: Row[];
	try {
		const answer = await fetch(`${ENDPOINT}?${query}`, { headers: HEADERS });
		if (!answer.ok) return [];
		rows = (await answer.json()) as Row[];
	} catch {
		// Offline, or the table is not reachable. An empty page is a fair
		// reading of "we could not find out"; the button still works.
		return [];
	}

	for (let i = rows.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[rows[i], rows[j]] = [rows[j], rows[i]];
	}

	return rows.slice(0, want).map((row) => ({
		id: row.id,
		text: row.body,
		at: Date.parse(row.created_at),
	}));
}

/** Hands a note over. Answers whether it landed. */
export async function postNote(page: string, text: string): Promise<boolean> {
	try {
		const answer = await fetch(ENDPOINT, {
			method: 'POST',
			headers: { ...HEADERS, 'Content-Type': 'application/json' },
			body: JSON.stringify({ page, body: text }),
		});
		return answer.ok;
	} catch {
		return false;
	}
}
