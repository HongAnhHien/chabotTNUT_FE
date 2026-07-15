export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  intent?: string;
  assignmentLink?: string;
  messageId?: string;
  feedback?: 'like' | 'dislike';
  examMeta?: {
    examId: string;
    sessionId: string;
    subjectId: string;
    dismissed?: boolean;
    confirmed?: boolean;
    savedExamId?: string;
  };
}
