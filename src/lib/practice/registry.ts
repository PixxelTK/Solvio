'use client';

import { ComponentType } from 'react';
import { Difficulty } from '@/lib/engine/types';
import { PracticeModuleId, PRACTICE_MODULES } from './types';
import LinearEquationsPractice from '@/components/practice/LinearEquationsPractice';
import RearrangingEquationsPractice from '@/components/practice/RearrangingEquationsPractice';
import GaussianEliminationPractice from '@/components/practice/GaussianEliminationPractice';
import SystemsOfEquationsPractice from '@/components/practice/SystemsOfEquationsPractice';
import { DIFFICULTY_DESCRIPTIONS as algebraDescriptions } from '@/lib/modules/algebra/engine';
import { DIFFICULTY_DESCRIPTIONS as multivariableDescriptions } from '@/lib/modules/multivariable/engine';
import { DIFFICULTY_DESCRIPTIONS as systemsDescriptions } from '@/lib/modules/systems-of-equations/engine';
import { DIFFICULTY_DESCRIPTIONS as linearAlgebraDescriptions } from '@/lib/modules/linear-algebra/index';

export interface PracticeGameProps {
  difficulty: Difficulty;
  onBack: () => void;
}

type GameComponent = ComponentType<PracticeGameProps>;

const registry = new Map<PracticeModuleId, GameComponent>();
const descriptions = new Map<PracticeModuleId, Record<Difficulty, string>>();

registry.set(PRACTICE_MODULES.LINEAR_EQUATIONS, LinearEquationsPractice);
registry.set(PRACTICE_MODULES.REARRANGING_EQUATIONS, RearrangingEquationsPractice);
registry.set(PRACTICE_MODULES.GAUSSIAN_ELIMINATION, GaussianEliminationPractice);
registry.set(PRACTICE_MODULES.SYSTEMS_OF_EQUATIONS, SystemsOfEquationsPractice);

descriptions.set(PRACTICE_MODULES.LINEAR_EQUATIONS, algebraDescriptions);
descriptions.set(PRACTICE_MODULES.REARRANGING_EQUATIONS, multivariableDescriptions);
descriptions.set(PRACTICE_MODULES.GAUSSIAN_ELIMINATION, linearAlgebraDescriptions);
descriptions.set(PRACTICE_MODULES.SYSTEMS_OF_EQUATIONS, systemsDescriptions);

export function getPracticeComponent(moduleId: string): GameComponent | undefined {
  return registry.get(moduleId as PracticeModuleId);
}

export function getRegisteredModuleIds(): PracticeModuleId[] {
  return Array.from(registry.keys());
}

export function getDifficultyDescriptions(moduleId: PracticeModuleId): Record<Difficulty, string> | undefined {
  return descriptions.get(moduleId);
}
