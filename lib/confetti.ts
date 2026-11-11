/*
 * Confetti, for a plate that becomes the oldest or newest in the collection.
 *
 * The one place outside the plate where colour is spent, on purpose: it happens
 * a handful of times a year and should not look like anything else in the app.
 * Pastel rather than primary so it sits with the rest of the page, but each
 * colour is dark enough to show against the pale ground — a true pastel yellow
 * disappears on it.
 *
 * The library is imported inside the function. The log screen is the one used
 * standing next to a car, and it should not download confetti on every visit
 * for the few saves that need it. It draws on its own fixed canvas that ignores
 * pointer events and removes itself, so nothing in the layout moves.
 */
const COLORS = ['#f7a8b8', '#f9c58d', '#f2dc7a', '#9fd8a8', '#8fc7ee', '#c3a6e8'];

/** Bursts from the centre of `from`. Does nothing under reduced motion. */
export async function fireConfetti(from: HTMLElement | null): Promise<void> {
  const rect = from?.getBoundingClientRect();
  const origin = rect
    ? {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      }
    : { x: 0.5, y: 0.35 };

  try {
    const { default: confetti } = await import('canvas-confetti');
    await confetti({
      particleCount: 90,
      spread: 80,
      startVelocity: 38,
      ticks: 220,
      origin,
      colors: COLORS,
      disableForReducedMotion: true,
    });
  } catch {
    // Decoration only. A failed chunk load must not turn a good save into an error.
  }
}
