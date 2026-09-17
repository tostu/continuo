import { error } from '@sveltejs/kit';
import { loadUniverse } from '$lib/server/universe-repo';
import type { PageServerLoad } from './$types';

/** Der Zeitstrahl braucht nur Werke, Staffeln und Sagas – keine Figuren, keine Plot Points. */
export const load: PageServerLoad = async ({ params }) => {
	const universe = await loadUniverse(params.universum);
	if (!universe) error(404, 'Universum nicht gefunden');

	const { name, sagas, works, seasons } = universe;
	return { universe: { name, sagas, works, seasons } };
};
