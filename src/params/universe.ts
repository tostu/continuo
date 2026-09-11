import type { ParamMatcher } from '@sveltejs/kit';
import { universes } from '$lib/universe/registry';

export const match = ((param: string): param is string =>
	universes.some((u) => u.slug === param)) satisfies ParamMatcher;
