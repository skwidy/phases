export type LearnStep = {
  name: string;
  text: string;
};

export type LearnQuote = {
  text: string;
  source: string;
};

export type LearnLink = {
  label: string;
  route: string;
};

export type LearnLesson = {
  id: string;
  number: number;
  title: string;
  minutes: number;
  key_idea: string;
  body: string[];
  quote: LearnQuote | null;
  with_phases: {
    title: string;
    text: string;
    link: LearnLink | null;
  };
  try: string;
  steps?: LearnStep[];
};

export type LessonRowStatus = 'read' | 'current' | 'unread';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function quoteFrom(value: unknown): LearnQuote | null {
  if (!isRecord(value)) return null;
  if (typeof value.text !== 'string' || typeof value.source !== 'string') return null;
  return { text: value.text, source: value.source };
}

function linkFrom(value: unknown): LearnLink | null {
  if (!isRecord(value)) return null;
  if (typeof value.label !== 'string' || typeof value.route !== 'string') return null;
  if (value.label.trim() === '' || value.route.trim() === '') return null;
  return { label: value.label, route: value.route };
}

function stepsFrom(value: unknown): LearnStep[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const steps = value.flatMap((item) => {
    if (!isRecord(item) || typeof item.name !== 'string' || typeof item.text !== 'string') return [];
    return [{ name: item.name, text: item.text }];
  });
  return steps.length > 0 ? steps : undefined;
}

function lessonFrom(value: unknown): LearnLesson | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || value.id.trim() === '') return null;
  if (typeof value.number !== 'number' || typeof value.minutes !== 'number') return null;
  if (typeof value.title !== 'string' || typeof value.key_idea !== 'string' || typeof value.try !== 'string') return null;
  if (!Array.isArray(value.body) || !value.body.every((paragraph) => typeof paragraph === 'string')) return null;
  if (!isRecord(value.with_phases)) return null;
  if (typeof value.with_phases.title !== 'string' || typeof value.with_phases.text !== 'string') return null;

  const lesson: LearnLesson = {
    id: value.id,
    number: value.number,
    title: value.title,
    minutes: value.minutes,
    key_idea: value.key_idea,
    body: value.body,
    quote: quoteFrom(value.quote),
    with_phases: {
      title: value.with_phases.title,
      text: value.with_phases.text,
      link: linkFrom(value.with_phases.link),
    },
    try: value.try,
  };
  const steps = stepsFrom(value.steps);
  if (steps) lesson.steps = steps;
  return lesson;
}

export function parseLessons(value: unknown): LearnLesson[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const lesson = lessonFrom(item);
    return lesson ? [lesson] : [];
  });
}

export function seriesProgress<T extends { id: string }>(lessons: readonly T[], read: readonly string[]) {
  const readIds = new Set(read);
  const done = lessons.filter((lesson) => readIds.has(lesson.id)).length;
  const pending = lessons.find((lesson) => !readIds.has(lesson.id)) ?? null;
  return { done, total: lessons.length, pending };
}

export function lessonRowStatus(
  id: string,
  lessons: readonly { id: string }[],
  read: readonly string[],
): LessonRowStatus {
  if (read.includes(id)) return 'read';
  const { done, pending } = seriesProgress(lessons, read);
  if (done > 0 && pending?.id === id) return 'current';
  return 'unread';
}
