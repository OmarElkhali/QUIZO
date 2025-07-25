
import { Quiz } from '@/types/quiz';

export const mockQuizzes: Quiz[] = [
  {
    id: '1',
    title: 'Introduction to Computer Science',
    description: 'Basic concepts of algorithms, data structures, and programming fundamentals.',
    questions: [
      {
        id: 'q1',
        text: 'What is an algorithm?',
        options: [
          { id: 'a', text: 'A programming language', isCorrect: false },
          { id: 'b', text: 'A step-by-step procedure for solving a problem', isCorrect: true },
          { id: 'c', text: 'A type of data structure', isCorrect: false },
          { id: 'd', text: 'A computer hardware component', isCorrect: false }
        ],
        explanation: 'An algorithm is a step-by-step procedure for solving a problem or accomplishing a task. It\'s a set of instructions that describe how to process information.',
      },
      // More questions would be here
    ],
    createdAt: '2023-05-15',
    completionRate: 75,
    duration: '20 min',
    participants: 3,
  },
  {
    id: '2',
    title: 'Organic Chemistry Basics',
    description: 'Fundamental principles of organic molecules, reactions, and mechanisms.',
    questions: [],
    createdAt: '2023-06-02',
    completionRate: 45,
    duration: '30 min',
    participants: 1,
  },
];
