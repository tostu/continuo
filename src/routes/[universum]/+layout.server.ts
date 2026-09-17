import { error } from '@sveltejs/kit';
import { loadUniverse } from '$lib/server/universe-repo';
import type { LayoutServerLoad } from './$types';

/**
 * Serverseitig, weil die Daten in D1 liegen: ein Param-Matcher (`src/params/…`) läuft
 * auch im Browser und darf nicht asynchron sein, kann die Datenbank also nicht fragen.
 * Unbekannte Slugs fallen deshalb hier durch.
 *
 * Bewusst nur Name und Slug: Layout-Daten landen in jeder Unterseite als Hydration-JSON
 * und `__data.json`. Jede Seite schneidet sich ihren Teil des Universums selbst zu.
 */
export const load: LayoutServerLoad = async ({ params }) => {
	const universe = await loadUniverse(params.universum);
	if (!universe) error(404, 'Universum nicht gefunden');

	return { slug: params.universum, name: universe.name };
};
