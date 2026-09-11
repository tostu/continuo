import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Flip } from 'gsap/Flip';

let registered = false;

/** GSAP mit Plugins – nur im Browser aufrufen (onMount / $effect). */
export function useGsap() {
	if (!registered) {
		gsap.registerPlugin(DrawSVGPlugin, Flip);
		registered = true;
	}
	return { gsap, Flip };
}

export const reducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
