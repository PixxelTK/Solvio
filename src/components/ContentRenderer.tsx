'use client';

import React from 'react';
import MathDisplay from './MathDisplay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLightbulb, faPencilAlt, faArrowRight, faPlay, faCheck, faStar,
  faTimes, faExclamationTriangle, faInfoCircle, faQuestionCircle,
  faCog, faCalculator, faChartLine, faSquareRootAlt as faSquareRoot,
  faBook, faBullseye, faFlag, faGraduationCap, faInfinity, faMinus,
  faPlus, faEquals, faArrowUp, faArrowDown, faExchangeAlt,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

const iconMap: Record<string, IconDefinition> = {
  lightbulb: faLightbulb,
  pencil: faPencilAlt,
  'arrow-right': faArrowRight,
  play: faPlay,
  check: faCheck,
  star: faStar,
  times: faTimes,
  warning: faExclamationTriangle,
  info: faInfoCircle,
  question: faQuestionCircle,
  cog: faCog,
  calculator: faCalculator,
  'chart-line': faChartLine,
  'square-root': faSquareRoot,
  book: faBook,
  bullseye: faBullseye,
  flag: faFlag,
  graduation: faGraduationCap,
  infinity: faInfinity,
  minus: faMinus,
  plus: faPlus,
  equals: faEquals,
  'arrow-up': faArrowUp,
  'arrow-down': faArrowDown,
  exchange: faExchangeAlt,
};

function parseLatex(text: string): { type: 'text' | 'inline' | 'display'; content: string }[] {
  const parts: { type: 'text' | 'inline' | 'display'; content: string }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const displayStart = remaining.indexOf('$$');
    const inlineStart = remaining.indexOf('$');

    if (displayStart === -1 && inlineStart === -1) {
      parts.push({ type: 'text', content: remaining });
      break;
    }

    const firstDollar = displayStart !== -1 && (inlineStart === -1 || displayStart < inlineStart) ? displayStart : inlineStart;
    const isDisplay = firstDollar === displayStart;

    if (firstDollar > 0) {
      parts.push({ type: 'text', content: remaining.slice(0, firstDollar) });
    }

    const delimiter = isDisplay ? '$$' : '$';
    const endIdx = remaining.indexOf(delimiter, firstDollar + delimiter.length);

    if (endIdx === -1) {
      parts.push({ type: 'text', content: remaining.slice(firstDollar) });
      break;
    }

    const latex = remaining.slice(firstDollar + delimiter.length, endIdx);
    parts.push({ type: isDisplay ? 'display' : 'inline', content: latex });
    remaining = remaining.slice(endIdx + delimiter.length);
  }

  return parts;
}

type InlineToken =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'icon'; name: string }
  | { type: 'latex'; content: string; display: boolean };

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const remaining = text;

  const pattern = /(\*\*.*?\*\*|\{fa:[^}]*\}|\$\$[^$]*\$\$|\$[^$]*\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: remaining.slice(lastIndex, match.index) });
    }

    const part = match[1];
    if (part.startsWith('**') && part.endsWith('**')) {
      tokens.push({ type: 'bold', content: part.slice(2, -2) });
    } else if (part.startsWith('{fa:') && part.endsWith('}')) {
      tokens.push({ type: 'icon', name: part.slice(4, -1) });
    } else if (part.startsWith('$$') && part.endsWith('$$')) {
      tokens.push({ type: 'latex', content: part.slice(2, -2), display: true });
    } else if (part.startsWith('$') && part.endsWith('$')) {
      tokens.push({ type: 'latex', content: part.slice(1, -1), display: false });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < remaining.length) {
    tokens.push({ type: 'text', content: remaining.slice(lastIndex) });
  }

  return tokens;
}

export function renderLatexText(text: string) {
  const parts = parseLatex(text);
  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i}>{part.content}</span>;
        }
        return (
          <MathDisplay
            key={i}
            latex={part.content}
            displayMode={part.type === 'display'}
          />
        );
      })}
    </>
  );
}

export function renderLatexInline(text: string) {
  const parts = parseLatex(text);
  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i}>{part.content}</span>;
        }
        return (
          <span key={i} className="inline-block">
            <MathDisplay latex={part.content} displayMode={false} />
          </span>
        );
      })}
    </>
  );
}

export function renderInlineContent(text: string): React.ReactNode {
  if (!text) return null;
  const tokens = parseInline(text);
  return (
    <>
      {tokens.map((token, i) => {
        switch (token.type) {
          case 'text':
            return <span key={i}>{token.content}</span>;
          case 'bold':
            return <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">{token.content}</strong>;
          case 'icon':
            return (
              <span key={i} className="mx-0.5 inline-block">
                <FontAwesomeIcon icon={iconMap[token.name] || faInfoCircle} className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </span>
            );
          case 'latex':
            return (
              <span key={i} className="inline-block">
                <MathDisplay latex={token.content} displayMode={token.display} />
              </span>
            );
        }
      })}
    </>
  );
}

function parseTableRow(line: string): string[] {
  return line
    .split('|')
    .filter((_, i, arr) => i > 0 && i < arr.length - 1 || arr.length <= 2)
    .map(c => c.trim());
}

export function renderRichText(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const blocks: { type: 'p' | 'ul' | 'ol' | 'table'; content: string[] | string[][] }[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      i++;
      continue;
    }

    if (trimmed.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: 'table', content: rows });
      continue;
    }

    if (trimmed.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: 'ul', content: items });
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push({ type: 'ol', content: items });
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i].trim();
      if (l === '' || l.startsWith('- ') || /^\d+\.\s/.test(l) || l.startsWith('|')) break;
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'p', content: [paraLines.join('\n')] });
  }

  return (
    <>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'p': {
            const text = (block.content as string[])[0];
            if (!text) return null;

            const segments = text.split(/(\$\$[^$]*\$\$)/g);
            if (segments.length === 1) {
              return <p key={idx}>{renderInlineContent(text)}</p>;
            }

            return (
              <div key={idx} className="space-y-2">
                {segments.map((seg, i) => {
                  if (seg.startsWith('$$') && seg.endsWith('$$')) {
                    return <MathDisplay key={i} latex={seg.slice(2, -2)} displayMode={true} />;
                  }
                  if (seg) {
                    return <p key={i}>{renderInlineContent(seg)}</p>;
                  }
                  return null;
                })}
              </div>
            );
          }
          case 'ul':
            return (
              <ul key={idx} className="list-disc pl-5 space-y-1">
                {(block.content as string[]).map((item, j) => (
                  <li key={j}>{renderInlineContent(item)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={idx} className="list-decimal pl-5 space-y-1">
                {(block.content as string[]).map((item, j) => (
                  <li key={j}>{renderInlineContent(item)}</li>
                ))}
              </ol>
            );
          case 'table': {
            const rows = block.content as string[][];
            if (rows.length === 0) return null;

            const hasSep = rows.length > 1 && rows[1].every(c => /^[-:]+$/.test(c));
            const headerRow = hasSep ? rows[0] : rows[0];
            const dataRows = hasSep ? rows.slice(2) : rows.slice(1);

            return (
              <div key={idx} className="overflow-x-auto my-2">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-300 dark:border-slate-600">
                      {headerRow.map((cell, j) => (
                        <th key={j} className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {renderInlineContent(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((row, j) => (
                      <tr key={j} className="border-b border-slate-200 dark:border-slate-700">
                        {row.map((cell, k) => (
                          <td key={k} className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {renderInlineContent(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }
      })}
    </>
  );
}
