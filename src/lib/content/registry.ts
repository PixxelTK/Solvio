import { Subject } from './types';

export const subjectsRegistry: Subject[] = [
  {
    id: 'algebra',
    order: 1,
    title: {
      en: 'Algebra',
      th: 'พีชคณิต',
    },
  },
  {
    id: 'linear-algebra',
    order: 2,
    title: {
      en: 'Linear Algebra',
      th: 'พีชคณิตเชิงเส้น',
    },
  },
];
