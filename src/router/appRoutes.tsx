/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router";
import ProtectedRoute from "./protect_router";
import { ROLES, STAFF_ROLES } from "@/constants/roles";

const BlankLayout   = lazy(() => import("@core/layouts/BlankLayout"));
const AdminLayoutPage = lazy(() => import("@layouts/AdminLayoutPage"));
const StudentLayout  = lazy(() => import("@/layouts/StudentLayout"));
const TeacherLayout  = lazy(() => import("@/layouts/TeacherLayout"));

const ErrorPage = lazy(() => import("@views/misc/Error"));

// Hub hệ sinh thái
const AtlasHub = lazy(() => import("@views/atlas/AtlasHub"));

// Admin
const Dashboard       = lazy(() => import("@views/dashboard/Dashboard"));
const ManageUsers     = lazy(() => import("@views/dashboard/admin/manage_users"));
const AdminParseLogsPage = lazy(() => import("@views/dashboard/admin/parselogs/AdminParseLogsPage"));
const AdminApiKeyPage    = lazy(() => import("@views/dashboard/admin/apisettings/AdminApiKeyPage"));

// Student pages
const StudentAspx           = lazy(() => import("@views/dashboard/student/Student_Aspx"));
const StudentProfile        = lazy(() => import("@views/dashboard/student/profile"));
const StudentSubjectsPage   = lazy(() => import("@views/dashboard/student/subjects/StudentSubjects"));
const StudentAssignmentExam  = lazy(() => import("@views/dashboard/student/assignments/StudentAssignmentExam"));
const StudentChatbotPage        = lazy(() => import("@views/dashboard/student/chatbot/StudentChatbot"));
const StudentAdvisorPage        = lazy(() => import("@views/dashboard/student/chatbot/StudentAdvisor"));
const ChatModeLayout            = lazy(() => import("@views/dashboard/teacher/chatbot/ChatModeLayout"));
const StudentSubjectDetailPage  = lazy(() => import("@views/dashboard/student/subjects/StudentSubjectDetail"));
const StudentSchedulePage       = lazy(() => import("@views/dashboard/student/schedule/StudentSchedule"));
const NotificationsPage         = lazy(() => import("@views/dashboard/notifications/NotificationsPage"));

// Teacher pages
const TeacherAspx          = lazy(() => import("@views/dashboard/teacher/Teacher_Aspx"));
const TeacherSubjectList      = lazy(() => import("@views/dashboard/teacher/subjects/TeacherSubjectList"));
const ClassAnalyticsPage      = lazy(() => import("@views/dashboard/teacher/analytics/ClassAnalyticsPage"));
const SubjectAnalyticsPage    = lazy(() => import("@views/dashboard/teacher/analytics/SubjectAnalyticsPage"));
const TeacherProfile       = lazy(() => import("@views/dashboard/teacher/profile"));
const TeacherChatPage      = lazy(() => import("@views/dashboard/teacher/chatbot/TeacherAITutors"));
const TeacherAdvisorPage   = lazy(() => import("@views/dashboard/teacher/chatbot/TeacherAdvisor"));
const TeacherAssignmentsPage  = lazy(() => import("@views/dashboard/teacher/assignments/TeacherAssignments"));
const TeacherAssignmentDetail = lazy(() => import("@views/dashboard/teacher/assignments/TeacherAssignmentDetail"));
const TeacherExamView      = lazy(() => import("@views/dashboard/teacher/exams/TeacherExamView"));
const TeacherSubjectFiles  = lazy(() => import("@views/dashboard/teacher/subjects/TeacherSubjectFiles"));
const TeacherSubjectExams  = lazy(() => import("@views/dashboard/teacher/subjects/exams"));
const ClassStudentsPage    = lazy(() => import("@views/dashboard/teacher/class"));
const TeacherAdvisorDashboard      = lazy(() => import("@views/dashboard/teacher/advisor/TeacherAdvisorDashboard"));
const TeacherAdvisorStudentDetail  = lazy(() => import("@views/dashboard/teacher/advisor/TeacherAdvisorStudentDetail"));

export const appRoutes: RouteObject[] = [
  // Landing
  { path: "/", element: <Navigate to="/login" replace /> },

  // ── Atlas Hub — trang chủ hệ sinh thái (mọi vai đã đăng nhập) ──
  {
    path: "/atlas",
    element: (
      <ProtectedRoute>
        <AtlasHub />
      </ProtectedRoute>
    ),
  },

  // ── Admin ──────────────────────────────────────────────
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayoutPage />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        children: [
          { index: true, element: <Dashboard /> },
          { path: "manage-users", element: <ManageUsers /> },
          { path: "parse-logs", element: <AdminParseLogsPage /> },
          { path: "api-settings", element: <AdminApiKeyPage /> },
        ],
      },
    ],
  },

  // ── Student — pages with sidebar layout ───────────────
  {
    path: "/student",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.ADMIN]}>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard",        element: <StudentAspx /> },
      { path: "subjects",             element: <StudentSubjectsPage /> },
      { path: "subjects/:maMon",   element: <StudentSubjectDetailPage /> },
      { path: "schedule",         element: <StudentSchedulePage /> },
      { path: "notifications",    element: <NotificationsPage /> },
      { path: "profile",          element: <StudentProfile /> },
      {
        path: "chat",
        element: <ChatModeLayout basePath="/student/chat" chatLabel="Chat môn học" />,
        children: [
          { index: true,             element: <StudentChatbotPage /> },
          { path: ":sessionId",      element: <StudentChatbotPage /> },
          { path: "advisor",         element: <StudentAdvisorPage /> },
          { path: "advisor/:sessionId", element: <StudentAdvisorPage /> },
        ],
      },
    ],
  },

  // Student exam — stays fullscreen, no layout
  {
    path: "/student/assignments/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.ADMIN]}>
        <BlankLayout>
          <StudentAssignmentExam />
        </BlankLayout>
      </ProtectedRoute>
    ),
  },

  // ── Teacher — pages with sidebar layout ───────────────
  {
    path: "/teacher",
    element: (
      <ProtectedRoute allowedRoles={STAFF_ROLES}>
        <TeacherLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard",           element: <TeacherAspx /> },
      { path: "subjects",            element: <TeacherSubjectList /> },
      { path: "profile",             element: <TeacherProfile /> },
      {
        path: "chat",
        element: <ChatModeLayout basePath="/teacher/chat" chatLabel="Chatbot trợ giảng" />,
        children: [
          { index: true,                element: <TeacherChatPage /> },
          { path: ":sessionId",         element: <TeacherChatPage /> },
          { path: "advisor",            element: <TeacherAdvisorPage /> },
          { path: "advisor/:sessionId", element: <TeacherAdvisorPage /> },
        ],
      },
      { path: "assignments",         element: <TeacherAssignmentsPage /> },
      { path: "assignments/:id",     element: <TeacherAssignmentDetail /> },
      { path: "notifications",       element: <NotificationsPage /> },
      { path: "exams/:id",           element: <TeacherExamView /> },
      { path: "subjects/:maMon/files",       element: <TeacherSubjectFiles /> },
      { path: "subjects/:maMon/exams",       element: <TeacherSubjectExams /> },
      { path: "subjects/:maMon/analytics",   element: <SubjectAnalyticsPage /> },
      { path: "courses/:idToHoc/students",   element: <ClassStudentsPage /> },
      { path: "courses/:idToHoc/analytics",  element: <ClassAnalyticsPage /> },
      { path: "advisor",         element: <TeacherAdvisorDashboard /> },
      { path: "advisor/:maSv",   element: <TeacherAdvisorStudentDetail /> },
    ],
  },

  // 404
  {
    path: "*",
    element: (
      <BlankLayout>
        <ErrorPage
          errorCode="404"
          title="Không tìm thấy trang"
          message="Trang bạn tìm kiếm không tồn tại."
        />
      </BlankLayout>
    ),
  },
];
