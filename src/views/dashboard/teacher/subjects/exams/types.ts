import type { ISavedExam, IExamQuestion } from '@/infra/api/interfaces/IChat';

export type ViewMode = 'list' | 'exam' | 'assignment';

export type ExamDetail = ISavedExam & { questions?: IExamQuestion[] };

export interface ConfirmCfg {
  title: string;
  body: string;
  confirmLabel: string;
  danger: boolean;
  onConfirm: () => void;
}
