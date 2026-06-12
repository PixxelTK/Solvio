'use client';

import { useState } from 'react';
import { Difficulty } from '@/lib/engine/types';
import ModeSelector from '@/components/ModeSelector';
import DifficultySelector from '@/components/DifficultySelector';
import GameScreen from '@/components/GameScreen';
import EquationGameScreen from '@/components/EquationGameScreen';

type Mode = 'equation-transformation' | 'gaussian-elimination';
type Screen = 'mode' | 'difficulty' | 'game';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('mode');
  const [mode, setMode] = useState<Mode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  if (screen === 'mode' || !mode) {
    return (
      <ModeSelector
        onSelect={(m) => {
          setMode(m);
          setScreen('difficulty');
        }}
      />
    );
  }

  if (screen === 'difficulty' || !difficulty) {
    return (
      <DifficultySelector
        mode={mode}
        onSelect={(d) => {
          setDifficulty(d);
          setScreen('game');
        }}
        onBack={() => {
          setMode(null);
          setScreen('mode');
        }}
      />
    );
  }

  if (mode === 'equation-transformation') {
    return (
      <EquationGameScreen
        difficulty={difficulty}
        onBack={() => {
          setDifficulty(null);
          setScreen('difficulty');
        }}
      />
    );
  }

  return (
    <GameScreen
      difficulty={difficulty}
      onBack={() => {
        setDifficulty(null);
        setScreen('difficulty');
      }}
    />
  );
}
