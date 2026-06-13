import { redirect } from 'next/navigation';
import DifficultySelector from '@/components/DifficultySelector';

const validModes = ['equation-transformation', 'gaussian-elimination', 'multivariable-equation-system'];

export default async function ModePage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;

  if (!validModes.includes(mode)) {
    redirect('/');
  }

  return <DifficultySelector mode={mode as 'equation-transformation' | 'gaussian-elimination' | 'multivariable-equation-system'} />;
}
