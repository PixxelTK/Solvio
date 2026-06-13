'use client';

import { useRef, useState, useEffect } from 'react';
import { EquationCard } from '../../EquationCard';

interface FloatingEquationProps {
  latex: string;
  title?: string;
  size?: string;
}

export default function FloatingEquation({ latex, title = 'Current Equation', size }: FloatingEquationProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setFloating(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section ref={ref} className="mb-6">
        <EquationCard title={title} latex={latex} size={size} />
      </section>
      <div
        className={`md:hidden fixed top-2 left-0 right-0 z-50 px-4 transition-all duration-300 ${
          floating ? 'translate-y-0' : '-translate-y-80 pointer-events-none'
        }`}
      >
        <EquationCard title={title} latex={latex} size={size} />
      </div>
    </>
  );
}
