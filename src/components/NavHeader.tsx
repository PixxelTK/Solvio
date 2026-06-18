'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleRight, faGlobe, faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import SolvioLogo from './SolvioLogo';

interface LocaleOption {
  code: string;
  label: string;
}

interface Breadcrumb {
  label: string;
  href: string;
}

const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: 'en', label: 'English' },
  { code: 'th', label: 'ไทย (Thai)' },
];

const LOCALE_CODES = SUPPORTED_LOCALES.map((l) => l.code);

function labelFromSlug(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function buildBreadcrumbs(segments: string[], locale: string, t: (key: string) => string): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [];
  const base = `/${locale}`;

  if (segments.length < 2 || segments[0] !== 'learn') return crumbs;

  const [, subject, topic, , difficulty] = segments;
  if (!topic) return crumbs;

  const subjectLabel = subject === 'linear-algebra' ? 'Linear Algebra' : labelFromSlug(subject);
  const topicLabel = labelFromSlug(topic);
  const topicHref = `${base}/learn/${subject}/${topic}`;

  crumbs.push({ label: subjectLabel, href: topicHref });
  crumbs.push({ label: topicLabel, href: topicHref });

  if (segments.length > 3) {
    crumbs.push({ label: t('nav.practice'), href: `${topicHref}/practice` });

    if (segments[3] === 'practice' && difficulty) {
      crumbs.push({
        label: labelFromSlug(difficulty),
        href: `${topicHref}/practice/${difficulty}`,
      });
    }
  }

  return crumbs;
}

interface LanguageOptionProps {
  locale: LocaleOption;
  isActive: boolean;
  onSelect: (code: string) => void;
}

function LanguageOption({ locale, isActive, onSelect }: LanguageOptionProps) {
  return (
    <button
      onClick={() => onSelect(locale.code)}
      className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left font-medium rounded-xl transition-colors cursor-pointer ${isActive
        ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/50'
        }`}
    >
      <span>{locale.label}</span>
      {isActive && <FontAwesomeIcon icon={faCheck} className="h-3 w-3 text-blue-600 dark:text-blue-400" />}
    </button>
  );
}

export default function NavHeader() {
  const pathname = usePathname();
  const { t } = useI18n();

  const rawSegments = pathname.split('/').filter(Boolean);
  const hasLocalePrefix = LOCALE_CODES.includes(rawSegments[0]);
  const segments = hasLocalePrefix ? rawSegments.slice(1) : rawSegments;
  const currentLocale = hasLocalePrefix ? rawSegments[0] : 'en';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    const newPathname = pathname.replace(/^\/(en|th)\b/, `/${newLocale}`);
    const finalPathname = newPathname.startsWith(`/${newLocale}`)
      ? newPathname
      : `/${newLocale}${newPathname}`;

    window.location.href = finalPathname + window.location.search + window.location.hash;
    setDropdownOpen(false);
  };

  const breadcrumbs = buildBreadcrumbs(segments, currentLocale, t);

  return (
    <header className="sm:sticky top-0 z-30 py-2 bg-gray-100/50 dark:bg-slate-900/50 backdrop-blur-2xl border-b border-slate-200/10 dark:border-slate-800/10">
      <div className="mx-auto flex max-w-5xl w-[90%] items-center justify-between gap-x-3">

        {/* Logo + Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-x-3 min-w-0">
          <SolvioLogo />
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

        {/* Language dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/30 dark:border-slate-700/30 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-all duration-200 shadow-sm cursor-pointer"
          >
            <FontAwesomeIcon icon={faGlobe} className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span className="uppercase text-xs font-semibold tracking-wider">{currentLocale}</span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 right-0 mt-2 w-40 rounded-2xl space-y-1.5 bg-white/90 dark:bg-slate-900/90 border border-slate-200/30 dark:border-slate-800/30 shadow-xl p-2">
              {SUPPORTED_LOCALES.map((locale) => (
                <LanguageOption
                  key={locale.code}
                  locale={locale}
                  isActive={currentLocale === locale.code}
                  onSelect={handleLanguageChange}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
