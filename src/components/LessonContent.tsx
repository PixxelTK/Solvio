'use client';

import { useCallback, useMemo } from 'react';
import type { Lesson } from '@/lib/content';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faList, faLightbulb, faPencilAlt,
  faNewspaper, faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { renderLatexText, renderRichText, renderInlineContent } from './ContentRenderer';
import { useI18n } from '@/i18n/I18nContext';

interface LessonContentProps {
  lesson: Lesson;
}

function sectionId(text: string, index?: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}\-]+/gu, '')
    .replace(/(^-|-$)/g, '');
  return slug || (index !== undefined ? `section-${index}` : '');
}

interface TocItem {
  id: string;
  label: string;
  number: number;
}

export default function LessonContent({ lesson }: LessonContentProps) {
  const { t } = useI18n();

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const tocItems: TocItem[] = useMemo(() => {
    const items: TocItem[] = [];
    let n = 0;
    for (const t of lesson.topics) {
      n++;
      items.push({ id: sectionId(t.title, n), label: t.title, number: n });
    }
    if (lesson.concepts.length) items.push({ id: 'concepts', label: t('lesson.concepts'), number: ++n });
    if (lesson.examples.length) items.push({ id: 'examples', label: t('lesson.workedExamples'), number: ++n });
    return items;
  }, [lesson, t]);

  return (
    <div className="mx-auto max-w-5xl w-[90%] py-6 sm:py-8">
      <div className="lg:grid lg:grid-cols-[1fr_264px] lg:gap-12">
        <div>
          <header className="mb-4 sm:mb-10">
            <p className="text-lg mb-1 text-blue-500 dark:text-blue-300">{lesson.subjectTitle}</p>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {lesson.title}
            </h1>
            <div className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {renderLatexText(lesson.description)}
            </div>
          </header>

          {/* ── Mobile Practice CTA ── */}
          {lesson.practiceModule && (
            <div className="mb-6 lg:hidden">
              <Link
                href={`/learn/${lesson.subject}/${lesson.id}/practice`}
                className="group flex items-center justify-between gap-3 rounded-2xl bg-linear-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 px-5 py-4 text-white hover:opacity-80 transition-all shadow-sm"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-100">{t('lesson.practice')}</p>
                  <p className="text-base font-semibold mt-0.5">{lesson.title}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
          )}

          {/* ── Topic sections ── */}
          {lesson.topics.map((topic, i) => (
            <section
              key={topic.title}
              id={sectionId(topic.title, i + 1)}
              className="mb-8 sm:mb-12 scroll-mt-24"
            >
              <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
                <span className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-indigo-50 text-xs sm:text-sm font-bold text-blue-500 dark:bg-indigo-950 dark:text-indigo-400">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                    {topic.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {renderLatexText(topic.description)}
                  </p>
                </div>
              </div>
              {topic.body && (
                <div className="rounded-xl sm:rounded-2xl px-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
                  {renderRichText(topic.body)}
                </div>
              )}
            </section>
          ))}

          {/* ── Concepts ── */}
          {lesson.concepts.length > 0 && (
            <section id="concepts" className="mb-12 scroll-mt-24">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-sm font-bold text-amber-500 dark:bg-amber-950 dark:text-amber-400">
                  <FontAwesomeIcon icon={faLightbulb} className="h-3.5 w-3.5" />
                </span>
                {t('lesson.concepts')}
              </h2>
              <div className="space-y-4">
                {lesson.concepts.map((concept) => (
                  <div
                    key={concept.title}
                    className="rounded-2xl bg-gray-100 px-5 py-5 dark:border-slate-800 dark:bg-slate-900 hover:shadow-sm transition-shadow"
                  >
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      {concept.title}
                    </h3>
                    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
                      {renderRichText(concept.body)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Worked Examples ── */}
          {lesson.examples.length > 0 && (
            <section id="examples" className="mb-12 scroll-mt-24">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-500 dark:bg-blue-950 dark:text-blue-400">
                  <FontAwesomeIcon icon={faPencilAlt} className="h-3.5 w-3.5" />
                </span>
                {t('lesson.workedExamples')}
              </h2>
              <div className="space-y-5">
                {lesson.examples.map((example) => (
                  <div
                    key={example.title}
                    className="rounded-2xl bg-gray-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      {example.title}
                    </h3>
                    <div className="mb-4 rounded-xl bg-gray-100 px-4 py-3.5 dark:bg-slate-800/50">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{t('lesson.problem')}</p>
                      <div className="text-sm text-slate-800 dark:text-slate-200">
                        {renderInlineContent(example.problem)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('lesson.solutionSteps')}</p>
                      <div className="space-y-2">
                        {example.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-3 text-sm">
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-500 dark:bg-blue-950 dark:text-blue-400">
                              {i + 1}
                            </span>
                            <div className="text-slate-700 dark:text-slate-300 pt-0.5">
                              {renderInlineContent(step)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl bg-green-200 px-4 py-3 dark:bg-green-950/30">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">{t('lesson.answer')}</p>
                      <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                        {renderInlineContent(example.solution)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Mobile Related Topics ── */}
          {lesson.relatedTopics.length > 0 && (
            <div className="mb-12 lg:hidden">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faNewspaper} className="h-3 w-3 text-blue-500" />
                {t('lesson.related')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {lesson.relatedTopics.map((related) => (
                  <Link
                    key={related.path}
                    href={related.path}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 no-underline hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-slate-100 transition-colors"
                  >
                    {related.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ──────── Desktop Sidebar ──────── */}
        {tocItems.length > 0 && (
          <aside className="hidden lg:block">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faList} className="h-3 w-3 text-indigo-500" />
                  {t('lesson.onThisPage')}
                </h3>
                <nav className="space-y-0.5">
                  {tocItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id)}
                      className="block w-full text-left text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors py-1.5 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <span className="text-xs text-slate-400 mr-2 font-mono">{item.number}.</span>
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* ── Desktop Practice ── */}
              {lesson.practiceModule && (
                <section>
                  <Link
                    href={`/learn/${lesson.subject}/${lesson.id}/practice`}
                    className="group flex items-center justify-between gap-3 rounded-2xl bg-linear-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 px-4 py-3 text-white hover:opacity-80 transition-all"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-green-100">{t('lesson.practice')}</p>
                      <p className="text-base font-semibold mt-0.5">{lesson.title}</p>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                      <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </section>
              )}

              {/* ── Desktop Related Topics ── */}
              {lesson.relatedTopics.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faNewspaper} className="h-3 w-3 text-blue-500" />
                    {t('lesson.related')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lesson.relatedTopics.map((related) => (
                      <Link
                        key={related.path}
                        href={related.path}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 no-underline hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-slate-100 transition-colors"
                      >
                        {related.title}
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
