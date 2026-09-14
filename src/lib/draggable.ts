/** Things on a desk get moved by hand.
 *
 *  Used by the work windows and by the stickers: both are absolutely placed by
 *  script, both are picked up anywhere on themselves, and both have to be able
 *  to tell a move from a press — a window that opens the moment you try to
 *  shift it is not a window.
 */
export interface DragOptions {
	/** Below this a drag is a click that wandered, and nothing should move. */
	threshold?: number;
	/** Called when the press turns out to have been a press. Left out for
	 *  anything that does nothing when pressed. */
	onPress?: (element: HTMLElement) => void;
}

export function makeDraggable(elements: HTMLElement[], options: DragOptions = {}): void {
	const threshold = options.threshold ?? 5;
	// Whatever is picked up comes to the top of the pile and stays there.
	let front = 1;

	elements.forEach((element) => {
		let originX = 0;
		let originY = 0;
		let startLeft = 0;
		let startTop = 0;
		let carrying = false;
		let moved = false;

		element.addEventListener('pointerdown', (event) => {
			if (event.button !== 0) return;

			originX = event.clientX;
			originY = event.clientY;
			startLeft = parseFloat(element.style.left) || 0;
			startTop = parseFloat(element.style.top) || 0;
			carrying = true;
			moved = false;

			element.style.zIndex = String((front += 1));
			element.setPointerCapture(event.pointerId);
		});

		element.addEventListener('pointermove', (event) => {
			if (!carrying) return;

			const dx = event.clientX - originX;
			const dy = event.clientY - originY;
			if (!moved && Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

			moved = true;
			element.dataset.dragging = 'true';
			element.style.left = `${startLeft + dx}px`;
			element.style.top = `${startTop + dy}px`;
			event.preventDefault();
		});

		const drop = (event: PointerEvent) => {
			if (!carrying) return;
			carrying = false;
			delete element.dataset.dragging;
			element.releasePointerCapture?.(event.pointerId);
			// A press that turned into a move leaves the element focused, and the
			// focus ring then sits on something nobody is keyboarding through.
			if (moved) element.blur();
		};

		element.addEventListener('pointerup', drop);
		element.addEventListener('pointercancel', drop);

		// Something that was carried does not also open.
		element.addEventListener('click', (event) => {
			if (moved) {
				event.preventDefault();
				moved = false;
				return;
			}
			options.onPress?.(element);
		});

		// Images inside offer themselves to the browser's own drag otherwise.
		element.addEventListener('dragstart', (event) => event.preventDefault());
	});
}

/** Random, but not anywhere: clear of the header, inside the page, and spread
 *  across the screen rather than piled in one corner. Each thing gets its own
 *  band of the screen and lands somewhere in it.
 */
export function scatter(elements: HTMLElement[], options: { spread?: number } = {}): void {
	// The navigation's band. Nothing scattered lands in it.
	const probe = document.createElement('div');
	probe.style.cssText =
		'position:fixed;left:0;top:0;width:0;height:var(--stage-clear);visibility:hidden';
	document.body.appendChild(probe);
	const header = probe.getBoundingClientRect().height;
	probe.remove();
	const margin = 24;
	const spread = options.spread ?? 1;

	elements.forEach((element, index) => {
		const width = element.offsetWidth;
		const height = element.offsetHeight;

		const band = (window.innerHeight - header - margin * 2 - height) / elements.length;
		const top = header + margin + band * index + Math.random() * Math.max(0, band);
		// The page's own width, not the window's — see Stickers: `innerWidth`
		// counts the scrollbar and pushes the last of these off the right edge.
		const page = document.documentElement.clientWidth;
		const left = margin + Math.random() * Math.max(0, page - width - margin * 2);

		element.style.left = `${Math.round(left)}px`;
		element.style.top = `${Math.round(window.scrollY + top)}px`;
		// A hand drops things at an angle; a grid does not.
		element.style.rotate = `${((Math.random() * 5 - 2.5) * spread).toFixed(2)}deg`;
	});
}
