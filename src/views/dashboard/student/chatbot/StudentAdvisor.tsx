import { type FC } from 'react';
import AdvisorChatPage from '@/views/dashboard/teacher/chatbot/AdvisorChatPage';

const StudentAdvisor: FC = () => (
  <AdvisorChatPage role="student" homePath="/student/dashboard" chatBasePath="/student/chat/advisor" />
);

export default StudentAdvisor;
