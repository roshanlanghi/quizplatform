import gsap from 'gsap';

// Helper to check if user has prefers-reduced-motion enabled
export const isReducedMotion = () => {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// 1. Page Entrance Fade & Upward Slide
export const animatePageEntrance = (element) => {
  if (!element || isReducedMotion()) return null;
  return gsap.fromTo(
    element,
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform' }
  );
};

// 2. Staggered Entrance for Cards / Stat Grids
export const animateStaggerCards = (containerElement, selector = '.card') => {
  if (!containerElement || isReducedMotion()) return null;
  const cards = containerElement.querySelectorAll(selector);
  if (!cards.length) return null;

  return gsap.fromTo(
    cards,
    { opacity: 0, y: 16 },
    {
      opacity: 1,
      y: 0,
      duration: 0.45,
      stagger: 0.07,
      ease: 'power2.out',
      clearProps: 'transform',
    }
  );
};

// 3. Question Transition in Quiz Interface
export const animateQuestionChange = (questionElement, direction = 'next') => {
  if (!questionElement || isReducedMotion()) return null;
  const xOffset = direction === 'next' ? 12 : -12;

  return gsap.fromTo(
    questionElement,
    { opacity: 0, x: xOffset },
    { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out', clearProps: 'transform' }
  );
};

// 4. Smooth Progress Bar Width Transition
export const animateProgressBar = (barElement, targetWidthPercent) => {
  if (!barElement) return null;
  if (isReducedMotion()) {
    gsap.set(barElement, { width: `${targetWidthPercent}%` });
    return null;
  }

  return gsap.to(barElement, {
    width: `${targetWidthPercent}%`,
    duration: 0.4,
    ease: 'power2.out',
  });
};

// 5. Option Select Feedback Highlight
export const animateOptionSelect = (optionElement) => {
  if (!optionElement || isReducedMotion()) return null;
  return gsap.fromTo(
    optionElement,
    { scale: 0.99 },
    { scale: 1, duration: 0.2, ease: 'power2.out' }
  );
};
