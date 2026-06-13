import { redirect } from 'next/navigation';
import GameScreenWrapper from '@/components/GameScreenWrapper';

const validModes = ['equation-transformation', 'gaussian-elimination', 'multivariable-equation-system'];
const validDifficulties = ['beginner', 'easy', 'intermediate', 'advanced', 'random'];

export default async function GamePage({
  params,
}: {
  params: Promise<{ mode: string; difficulty: string }>;
}) {
  const { mode, difficulty } = await params;

  if (!validModes.includes(mode) || !validDifficulties.includes(difficulty)) {
    redirect('/');
  }

  return (
    <GameScreenWrapper
      mode={mode as 'equation-transformation' | 'gaussian-elimination' | 'multivariable-equation-system'}
      difficulty={difficulty as 'beginner' | 'easy' | 'intermediate' | 'advanced' | 'random'}
    />
  );
}
