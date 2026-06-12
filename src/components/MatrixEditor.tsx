'use client';

import { useState, useEffect, useCallback } from 'react';
import { AugmentedMatrix } from '@/lib/modules/linear-algebra';

interface MatrixEditorProps {
  matrix: AugmentedMatrix;
  onChange: (matrix: AugmentedMatrix) => void;
  disabled?: boolean;
}

export default function MatrixEditor({ matrix, onChange, disabled = false }: MatrixEditorProps) {
  const [cells, setCells] = useState<string[][]>(
    matrix.rows.map(row => row.values.map(v => String(v)))
  );

  useEffect(() => {
    setCells(matrix.rows.map(row => row.values.map(v => formatNum(v))));
  }, [matrix]);

  const handleChange = useCallback((rowIdx: number, colIdx: number, value: string) => {
    setCells(prev => {
      const next = prev.map(r => [...r]);
      next[rowIdx][colIdx] = value;
      return next;
    });

    const numVal = parseFloat(value);
    if (isNaN(numVal)) return;

    const newMatrix: AugmentedMatrix = {
      rows: matrix.rows.map((row, ri) => ({
        values: row.values.map((v, ci) => {
          if (ri === rowIdx && ci === colIdx) return numVal;
          const cellVal = parseFloat(cells[ri][ci]);
          return isNaN(cellVal) ? v : cellVal;
        }),
      })),
      numVars: matrix.numVars,
    };
    onChange(newMatrix);
  }, [matrix, cells, onChange]);

  return (
    <div className="inline-block">
      <div className="flex items-stretch gap-0">
        <div className="border-2 border-r-0 border-gray-600 rounded-l-md flex flex-col justify-center px-1">
          <div className="text-gray-400 text-2xl">[</div>
        </div>
        <div className="flex-1">
          {cells.map((row, ri) => (
            <div key={ri} className={`flex items-center ${ri > 0 ? 'border-t border-gray-700' : ''}`}>
              {row.map((cell, ci) => {
                const isAugmented = ci === matrix.numVars;
                return (
                  <span key={ci} className="flex items-center">
                    {isAugmented && (
                      <span className="text-gray-500 mx-1 text-lg">|</span>
                    )}
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleChange(ri, ci, e.target.value)}
                      disabled={disabled}
                      className={`
                        w-16 h-10 text-center text-sm font-mono
                        bg-gray-800 text-white
                        border-0 outline-none
                        focus:bg-gray-700 focus:ring-1 focus:ring-blue-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors
                      `}
                      aria-label={`Row ${ri + 1}, Column ${ci + 1}${isAugmented ? ' (augmented)' : ''}`}
                    />
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <div className="border-2 border-l-0 border-gray-600 rounded-r-md flex flex-col justify-center px-1">
          <div className="text-gray-400 text-2xl">]</div>
        </div>
      </div>
    </div>
  );
}

function formatNum(n: number): string {
  const rounded = Math.round(n * 10000) / 10000;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
}
