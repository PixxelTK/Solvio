'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathDisplayProps {
  latex: string;
  className?: string;
  displayMode?: boolean;
}

export default function MathDisplay({ latex, className = '', displayMode = true }: MathDisplayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(latex, ref.current, {
          displayMode,
          throwOnError: false,
          trust: true,
        });
      } catch {
        ref.current.textContent = latex;
      }
    }
  }, [latex, displayMode]);

  return (
    <div
      ref={ref}
      className={`math-display ${className}`}
    />
  );
}
