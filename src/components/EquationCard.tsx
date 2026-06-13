import MathDisplay from "./MathDisplay";

export function EquationCard({
  title,
  latex,
  size = "text-3xl sm:text-5xl",
}: {
  title: string;
  latex: string;
  size?: string;
}) {
  return (
    <div className="w-full shadow-2xl sm:shadow-none shadow-black/10 bg-gray-100/70 dark:bg-slate-900/70 backdrop-blur-lg sm:backdrop-blur-none rounded-2xl sm:bg-gray-100 sm:dark:bg-slate-900 px-4 py-4">
      <div className="text-xs uppercase text-slate-400 text-center mt-2">
        {title}
      </div>

      <MathDisplay
        latex={latex}
        className={size}
      />
    </div>
  );
}