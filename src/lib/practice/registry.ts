'use client';

import { ComponentType } from 'react';
import { Difficulty } from '@/lib/engine/types';
import { PracticeModuleId, PRACTICE_MODULES } from './types';
import LinearEquationsPractice from '@/components/practice/LinearEquationsPractice';
import RearrangingEquationsPractice from '@/components/practice/RearrangingEquationsPractice';
import GaussianEliminationPractice from '@/components/practice/GaussianEliminationPractice';

export interface PracticeGameProps {
  difficulty: Difficulty;
  onBack: () => void;
}

type GameComponent = ComponentType<PracticeGameProps>;

const registry = new Map<PracticeModuleId, GameComponent>();

registry.set(PRACTICE_MODULES.LINEAR_EQUATIONS, LinearEquationsPractice);
registry.set(PRACTICE_MODULES.REARRANGING_EQUATIONS, RearrangingEquationsPractice);
registry.set(PRACTICE_MODULES.GAUSSIAN_ELIMINATION, GaussianEliminationPractice);

export function getPracticeComponent(moduleId: string): GameComponent | undefined {
  return registry.get(moduleId as PracticeModuleId);
}

export function getRegisteredModuleIds(): PracticeModuleId[] {
  return Array.from(registry.keys());
}
