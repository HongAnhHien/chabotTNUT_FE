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
const CmsMaterials = lazy(() => import("@views/cms/CmsMaterials"));
const LabanMap = lazy(() => import("@views/laban/LabanMap"));
const AtlasOverview = lazy(() => import("@views/laban/AtlasOverview"));
const CompetencyMap = lazy(() => import("@views/laban/CompetencyMap"));
const NoiTruManage = lazy(() => import("@views/noitru/NoiTruManage"));
const DiemDanhManage = lazy(() => import("@views/diemdanh/DiemDanhManage"));
const EnrollFace = lazy(() => import("@views/diemdanh/EnrollFace"));
const QuetDienThoai = lazy(() => import("@views/diemdanh/QuetDienThoai"));
const WebGISView = lazy(() => import("@views/webgis/WebGISView"));
const PlatformImpactPage = lazy(() => import("@views/danhgia/PlatformImpactPage"));
const InfraCalcPage = lazy(() => import("@views/hatang/InfraCalcPage"));
const ElearningCatalog = lazy(() => import("@views/elearning/ElearningCatalog"));

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
const StudentCvhtDashboard      = lazy(() => import("@views/dashboard/student/cvht/StudentCvhtDashboard"));
const ChatModeLayout            = lazy(() => import("@views/dashboard/teacher/chatbot/ChatModeLayout"));
const StudentSubjectDetailPage  = lazy(() => import("@views/dashboard/student/subjects/StudentSubjectDetail"));
const StudentBaiGiangViewer     = lazy(() => import("@views/dashboard/student/baigiang/StudentBaiGiangViewer"));
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
const TeacherLoTrinh       = lazy(() => import("@views/dashboard/teacher/lotrinh/TeacherLoTrinh"));
const TeacherBaiGiang      = lazy(() => import("@views/dashboard/teacher/baigiang/TeacherBaiGiang"));
const TeacherBangDiem      = lazy(() => import("@views/dashboard/teacher/bangdiem/TeacherBangDiem"));
const TeacherNganHang      = lazy(() => import("@views/dashboard/teacher/nganhang/TeacherNganHang"));
const TeacherBaiGiangEditor = lazy(() => import("@views/dashboard/teacher/baigiang/TeacherBaiGiangEditor"));
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

  // ── CMS học liệu (cán bộ) ──
  {
    path: "/cms",
    element: (
      <ProtectedRoute allowedRoles={STAFF_ROLES}>
        <CmsMaterials />
      </ProtectedRoute>
    ),
  },

  // ── La bàn nghề nghiệp — Bản đồ CTĐT (mọi vai đã đăng nhập) ──
  {
    path: "/laban",
    element: (
      <ProtectedRoute>
        <LabanMap />
      </ProtectedRoute>
    ),
  },
  {
    path: "/laban/atlas",
    element: (
      <ProtectedRoute>
        <AtlasOverview />
      </ProtectedRoute>
    ),
  },
  {
    path: "/laban/giao-thong",
    element: (
      <ProtectedRoute>
        <CompetencyMap />
      </ProtectedRoute>
    ),
  },

  // ── Quản lý nội trú (Trường / Admin — dữ liệu cá nhân SV) ──
  {
    path: "/noitru",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.TRUONG, ROLES.ADMIN]}>
        <NoiTruManage />
      </ProtectedRoute>
    ),
  },

  // ── Điểm danh thông minh (Giảng viên / Khoa / Trường / Admin) ──
  {
    path: "/diem-danh",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.KHOA, ROLES.TRUONG, ROLES.ADMIN]}>
        <DiemDanhManage />
      </ProtectedRoute>
    ),
  },
  {
    // SV tự đăng ký khuôn mặt của chính mình (mã SV khoá theo tài khoản Portal); cán bộ vẫn vào được để hỗ trợ.
    path: "/diem-danh/enroll",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.TEACHER, ROLES.KHOA, ROLES.TRUONG, ROLES.ADMIN]}>
        <EnrollFace />
      </ProtectedRoute>
    ),
  },
  {
    path: "/diem-danh/quet/:buoiId",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.KHOA, ROLES.TRUONG, ROLES.ADMIN]}>
        <QuetDienThoai />
      </ProtectedRoute>
    ),
  },

  // ── WebGIS Atlas TNUT (mọi vai) ──
  {
    path: "/webgis",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.TEACHER, ROLES.KHOA, ROLES.TRUONG, ROLES.ADMIN]}>
        <WebGISView />
      </ProtectedRoute>
    ),
  },

  // ── Đánh giá hiệu quả nền tảng (mọi vai) ──
  {
    path: "/danh-gia",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.TEACHER, ROLES.KHOA, ROLES.TRUONG, ROLES.ADMIN]}>
        <PlatformImpactPage />
      </ProtectedRoute>
    ),
  },

  // ── Tính toán hạ tầng & ROI (chỉ quản trị) ──
  {
    path: "/tinh-toan-ha-tang",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
        <InfraCalcPage />
      </ProtectedRoute>
    ),
  },

  // ── RIAT E-learning (mọi vai đã đăng nhập) ──
  {
    path: "/elearning",
    element: (
      <ProtectedRoute>
        <ElearningCatalog />
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
      { path: "bai-giang/:id",     element: <StudentBaiGiangViewer /> },
      { path: "schedule",         element: <StudentSchedulePage /> },
      { path: "cvht",             element: <StudentCvhtDashboard /> },
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
      { path: "subjects/:maMon/lo-trinh",    element: <TeacherLoTrinh /> },
      { path: "subjects/:maMon/bai-giang",   element: <TeacherBaiGiang /> },
      { path: "subjects/:maMon/bang-diem",   element: <TeacherBangDiem /> },
      { path: "subjects/:maMon/ngan-hang",   element: <TeacherNganHang /> },
      { path: "bai-giang/:id",               element: <TeacherBaiGiangEditor /> },
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
