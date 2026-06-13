'use client';

import { Lesson } from '@/lib/content';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faFlask } from '@fortawesome/free-solid-svg-icons';
import { renderLatexText } from './ContentRenderer';

interface TOCClientProps {
  subjects: { id: string; title: string }[];
  lessonsBySubject: Record<string, Lesson[]>;
}

function subjectIcon(subject: string) {
  switch (subject) {
    case 'algebra':
      return faBookOpen;
    case 'linear-algebra':
      return faFlask;
    default:
      return faBookOpen;
  }
}

export default function TOCClient({ subjects, lessonsBySubject }: TOCClientProps) {
  return (
    <div className="mx-auto max-w-5xl w-[90%] py-12">
      <div className="mb-10 text-center">
        <h1 className="text-5xl sm:text-7xl font-bold"><span className='font-light'>Solvio</span> Math</h1>
      </div>

      <div className="space-y-12">
        {subjects.map((subject, si) => {
          const lessons = lessonsBySubject[subject.id] || [];
          const chapterNum = si + 1;

          return (
            <section key={subject.id}>
              <div className="mb-4 flex items-center gap-3">
                <FontAwesomeIcon icon={subjectIcon(subject.id)} className="h-5 w-5 text-blue-300" />
                <h2 className="text-2xl font-semibold text-blue-500 dark:text-blue-300">
                  {subject.title}
                </h2>
              </div>
              <div className="space-y-3">
                {lessons.map((lesson, li) => {
                  const sectionNum = `${chapterNum}.${li + 1}`;
                  const href = lesson.comingSoon
                    ? undefined
                    : `/learn/${lesson.subject}/${lesson.id}`;

                  return (
                    <div
                      key={lesson.id}
                      className="flex gap-2 w-full rounded-2xl bg-gray-100 dark:bg-slate-900 px-4 py-4"
                    >
                      <span className="mt-0.5 min-w-8 text-sm font-mono text-slate-400 dark:text-slate-500">
                        {sectionNum}
                      </span>
                      <div className="flex-1 min-w-0">
                        {lesson.comingSoon ? (
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {lesson.title}
                          </span>
                        ) : (
                          <Link
                            href={href!}
                            className="text-lg font-bold text-slate-800 no-underline hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
                          >
                            {lesson.title}
                          </Link>
                        )}
                        <p className="text-slate-500 dark:text-slate-500 line-clamp-1">
                          {renderLatexText(lesson.description)}
                        </p>
                        {lesson.topics.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {lesson.topics.map(topic => (
                              <span
                                key={topic.title}
                                className="inline-block rounded bg-slate-100 px-2 py-0.5 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              >
                                {topic.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
