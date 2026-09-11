import { universeBySlug } from '$lib/universe/registry';
import type { LayoutLoad } from './$types';

// Matcher garantiert ein bekanntes Universum.
export const load: LayoutLoad = ({ params }) => ({
	slug: params.universum,
	universe: universeBySlug(params.universum)!
});
