import { useRouter } from "next/navigation";

interface SolvioLogoProps {
    className?: string;
}

function SolvioLogo({ className = 'text-lg lg:text-xl' }: SolvioLogoProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push("/")}
            className={`cursor-pointer py-2 rounded-xl transition-colors hover:opacity-80`}
        >
            <h1 className={`${className} font-bold`}><span className='font-light'>Solvio</span> Math</h1>
        </button>
    )
}

export default SolvioLogo