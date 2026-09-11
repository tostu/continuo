import type { Universe } from './types';
import { fate } from './fate';
import { starWars } from './star-wars';

export interface UniverseEntry {
	/** URL-Segment: /[universum]/werk/… */
	slug: string;
	universe: Universe;
}

export const universes: UniverseEntry[] = [
	{ slug: 'star-wars', universe: starWars },
	{ slug: 'fate', universe: fate }
];

export const universeBySlug = (slug: string): Universe | undefined =>
	universes.find((u) => u.slug === slug)?.universe;
