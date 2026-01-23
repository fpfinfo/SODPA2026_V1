'use client';

import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';
import React from 'react';

interface MotionWrapperProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  scale?: boolean;
}

export const MotionWrapper = ({
  children,
  className,
  delay = 0,
  direction = 'up',
  duration = 0.3,
  scale = false,
  ...props
}: MotionWrapperProps) => {
  const getVariants = () => {
    const variants: any = {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: {
          duration,
          delay,
          ease: 'easeOut'
        }
      },
      exit: { opacity: 0 }
    };

    if (direction === 'up') variants.hidden.y = 20;
    if (direction === 'down') variants.hidden.y = -20;
    if (direction === 'left') variants.hidden.x = 20;
    if (direction === 'right') variants.hidden.x = -20;

    if (scale) {
      variants.hidden.scale = 0.95;
      variants.visible.scale = 1;
    }

    // Reset standard transform if direction is none, but keep initial opacity
    if (direction === 'none') {
       // variants.hidden only has opacity: 0
    } else {
        variants.visible.y = 0;
        variants.visible.x = 0;
    }

    return variants;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={getVariants()}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const StaggerContainer = ({
  children,
  className,
  staggerChildren = 0.05,
  delayChildren = 0
}: {
  children: React.ReactNode;
  className?: string;
  staggerChildren?: number;
  delayChildren?: number;
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren,
            delayChildren
          }
        }
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};

export const StaggerTableBody = ({
  children,
  className,
  staggerChildren = 0.05,
  delayChildren = 0,
  ...props
}: HTMLMotionProps<'tbody'> & { staggerChildren?: number; delayChildren?: number }) => {
  return (
    <motion.tbody
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren,
            delayChildren
          }
        }
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.tbody>
  );
};

export const MotionTableRow = ({
  children,
  className,
  ...props
}: HTMLMotionProps<'tr'>) => {
  return (
    <motion.tr
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.tr>
  );
};

export const MotionItem = ({
  children,
  className,
  ...props
}: HTMLMotionProps<'div'>) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
