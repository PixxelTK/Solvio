'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faMinus, faXmark, faDivide, faEquals,
  faRotateLeft, faDeleteLeft,
} from '@fortawesome/free-solid-svg-icons';

interface EquationKeyboardProps {
  onInsert: (value: string) => void;
  onClear: () => void;
  onDelete: () => void;
}

const keys: { key: string; label?: string; icon?: any }[] = [
  { key: '7', label: '7' },
  { key: '8', label: '8' },
  { key: '9', label: '9' },
  { key: 'x', label: 'x' },
  { key: 'y', label: 'y' },
  { key: '4', label: '4' },
  { key: '5', label: '5' },
  { key: '6', label: '6' },
  { key: 'z', label: 'z' },
  { key: '+', icon: faPlus },
  { key: '1', label: '1' },
  { key: '2', label: '2' },
  { key: '3', label: '3' },
  { key: '-', icon: faMinus },
  { key: '*', icon: faXmark },
  { key: '0', label: '0' },
  { key: '(', label: '(' },
  { key: ')', label: ')' },
  { key: '/', icon: faDivide },
  { key: '=', icon: faEquals },
  { key: '.', label: '.' },
];

export default function EquationKeyboard({ onInsert, onClear, onDelete }: EquationKeyboardProps) {
  return (
    <div className="mt-3 grid grid-cols-5 gap-2 p-2 text-slate-600 dark:text-slate-100 rounded-2xl bg-gray-100 dark:bg-slate-900">
      {keys.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onInsert(item.key)}
          className={`h-11 rounded-xl bg-white dark:bg-slate-800 hover:scale-105 active:bg-gray-200 dark:active:bg-slate-700 cursor-pointer text-lg font-semibold active:scale-95 transition ${
            ['x', 'y', 'z'].includes(item.key) ? 'font-serif' : ''
          }`}
        >
          {item.icon ? <FontAwesomeIcon icon={item.icon} /> : item.label}
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="col-span-1 h-11 rounded-xl bg-white dark:bg-slate-800 hover:scale-105 cursor-pointer text-lg font-semibold active:scale-95 transition"
      >
        <FontAwesomeIcon icon={faRotateLeft} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="col-span-2 h-11 rounded-xl bg-white dark:bg-slate-800 hover:scale-105 cursor-pointer text-lg font-semibold active:scale-95 transition"
      >
        <FontAwesomeIcon icon={faDeleteLeft} />
      </button>
    </div>
  );
}
