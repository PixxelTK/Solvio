'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleRight } from '@fortawesome/free-solid-svg-icons';
import SolvioLogo from './SolvioLogo';

function labelFromSlug(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function NavHeader() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const breadcrumbs: { label: string; href: string }[] = [
  ];

  if (segments.length >= 2 && segments[0] === 'learn') {
    const subject = segments[1];
    const subjectLabel = subject === 'linear-algebra' ? 'Linear Algebra' : labelFromSlug(subject);
    const topic = segments[2];

    if (topic) {
      const topicLabel = labelFromSlug(topic);

      if (segments.length > 3) {
        breadcrumbs.push({ label: subjectLabel, href: `/learn/${subject}/${topic}` });
        breadcrumbs.push({ label: topicLabel, href: `/learn/${subject}/${topic}` });
        breadcrumbs.push({ label: 'Practice', href: `/learn/${subject}/${topic}/practice` });

        if (segments.length > 4 && segments[3] === 'practice') {
          const dif = labelFromSlug(segments[4]);
          breadcrumbs.push({ label: dif, href: `/learn/${subject}/${topic}/practice/${segments[4]}` });
        }
      } else {
        breadcrumbs.push({ label: subjectLabel, href: `/learn/${subject}/${topic}` });
        breadcrumbs.push({ label: topicLabel, href: `/learn/${subject}/${topic}` });
      }
    }
  }

  return (
    <header className="sm:sticky top-0 z-50 py-2 bg-gray-100/50 dark:bg-slate-900/50 backdrop-blur-2xl">
      <div className="mx-auto flex flex-wrap max-w-5xl w-[90%] items-center gap-x-3">
        <SolvioLogo/>
        {breadcrumbs.length > 1 && (
          <nav className="flex flex-wrap items-center gap-x-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href + crumb.label} className="flex items-center gap-1.5">
                {i > 0 && <FontAwesomeIcon icon={faAngleRight} className="h-3 w-3 shrink-0" />}
                {i < breadcrumbs.length - 1 ? (
                  <Link href={crumb.href} className="hover:text-slate-700 no-underline dark:hover:text-slate-300">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-700 dark:text-slate-300">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
