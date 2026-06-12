'use client';

import { useRouter } from 'next/navigation';
import { Difficulty } from '@/lib/engine/types';
import GameScreen from './GameScreen';
import EquationGameScreen from './EquationGameScreen';

type Mode = 'equation-transformation' | 'gaussian-elimination';

interface GameScreenWrapperProps {
  mode: Mode;
  difficulty: Difficulty;
}

export default function GameScreenWrapper({ mode, difficulty }: GameScreenWrapperProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push(`/${mode}`);
  };

  if (mode === 'equation-transformation') {
    return <EquationGameScreen difficulty={difficulty} onBack={handleBack} />;
  }

  return <GameScreen difficulty={difficulty} onBack={handleBack} />;
}
