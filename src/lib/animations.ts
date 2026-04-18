import { Variants, BezierDefinition } from 'motion/react';

/**
 * ARC Motion Design Tokens
 * 6.1 Drei Kategorien (Functional, Expressive, Ambient)
 */

export const ARC_EASE_OUT: BezierDefinition = [0, 0, 0.2, 1];
export const ARC_EASE_IN: BezierDefinition = [0.4, 0, 1, 1];

/**
 * 6.2 Animation-Patterns
 */

// Reveal Pattern: Fade-in + Scale 95%→100%
export const revealVariants: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.95 
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: ARC_EASE_OUT
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.97,
    transition: {
      duration: 0.2,
      ease: ARC_EASE_IN
    }
  }
};

// Layout Transition Patterns
export const layoutTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1
};

// Pulse Pattern
export const pulseVariants: Variants = {
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity
    }
  }
};

// Float Pattern
export const floatVariants: Variants = {
  animate: {
    y: [0, -5, 0],
    transition: {
      duration: 4,
      ease: "easeInOut",
      repeat: Infinity
    }
  }
};

// Hologram Build Pattern: zeilenweise von oben
export const hologramRowsVariants: Variants = {
  initial: { opacity: 0, x: -2 },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.02,
      duration: 0.3,
      ease: ARC_EASE_OUT
    }
  })
};

// Connected Transition Pattern: Scale + Position spring
export const connectedTransition = {
  layout: true,
  transition: {
    type: "spring",
    duration: 0.4,
    bounce: 0.2, // --arc-ease-spring approx
  }
};

/**
 * Stagger Helper for Multiple Elements
 */
export const getStaggerChildren = (stagger = 0.05) => ({
  animate: {
    transition: {
      staggerChildren: stagger
    }
  }
});
