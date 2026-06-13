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
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current ?? spanRef.current;
    if (el) {
      try {
        katex.render(latex, el, {
          displayMode,
          throwOnError: false,
          trust: true,
        });
      } catch {
        el.textContent = latex;
      }
    }
  }, [latex, displayMode]);

  if (displayMode) {
    return <div ref={ref} className={`math-display ${className}`} />;
  }

  return <span ref={spanRef} className={`math-display ${className}`} />;
}
