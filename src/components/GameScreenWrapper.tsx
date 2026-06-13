'use client';

import { useRouter } from 'next/navigation';
import { Difficulty } from '@/lib/engine/types';
import GameScreen from './GameScreen';
import EquationGameScreen from './EquationGameScreen';
import MultivariableEquationScreen from './MultivariableEquationScreen';

type Mode = 'equation-transformation' | 'gaussian-elimination' | 'multivariable-equation-system';

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

  if (mode === 'multivariable-equation-system') {
    return <MultivariableEquationScreen difficulty={difficulty} onBack={handleBack} />;
  }

  return <GameScreen difficulty={difficulty} onBack={handleBack} />;
}
