export const PRACTICE_MODULES = {
  LINEAR_EQUATIONS: 'equation-transformation',
  REARRANGING_EQUATIONS: 'multivariable-equation-system',
  GAUSSIAN_ELIMINATION: 'gaussian-elimination',
} as const;

export type PracticeModuleId = typeof PRACTICE_MODULES[keyof typeof PRACTICE_MODULES];

export const VALID_PRACTICE_MODULES: readonly string[] = Object.values(PRACTICE_MODULES);

export function isValidPracticeModuleId(id: string): id is PracticeModuleId {
  return VALID_PRACTICE_MODULES.includes(id);
}
