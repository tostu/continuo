import type { Pathname } from '$app/types';
import { resolve } from '$app/paths';
import { localizeHref } from '$lib/paraglide/runtime';

/** App-interner Link, lokalisiert und base-path-sicher. */
export const href = (path: string) => resolve(localizeHref(path) as Pathname);
