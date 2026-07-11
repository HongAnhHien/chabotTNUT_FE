import { type FC } from 'react';
import AdvisorChatPage from '@/views/dashboard/teacher/chatbot/AdvisorChatPage';

const TeacherAdvisor: FC = () => (
  <AdvisorChatPage role="teacher" homePath="/teacher/dashboard" chatBasePath="/teacher/chat/advisor" />
);

export default TeacherAdvisor;
