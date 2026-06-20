/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { type RouteObject } from "react-router";
import ProtectedRoute from "./protect_router";
// import { useAuthStore } from '@/views/pages/stores/auth_store';
import HorizontalLayout from "@/layouts/HorizontalLayout";

const BlankLayout = lazy(() => import("@core/layouts/BlankLayout"));
const VerticalLayout = lazy(() => import("@layouts/VerticalLayout"));

const Home = lazy(() => import('@views/home/Home'));
const ErrorPage = lazy(() => import("@views/misc/Error"));

// Dashboard
const Dashboard = lazy(() => import("@views/dashboard/Dashboard"));

// Admin
const ManageUsers = lazy(() => import("@views/dashboard/admin/manage_users"));
const ManageLocations = lazy(
  () => import("@views/dashboard/admin/manage_locations"),
);

// Profile
const MyProfile      = lazy(() => import("@views/pages/profile/my_profile"));
const StudentProfile = lazy(() => import("@views/dashboard/student/profile"));
const StudentAspx    = lazy(() => import("@views/dashboard/student/Student_Aspx"));
const TeacherAspx    = lazy(() => import("@views/dashboard/teacher/Teacher_Aspx"));
const TeacherProfile      = lazy(() => import("@views/dashboard/teacher/profile"));
const ClassStudentsPage   = lazy(() => import("@views/dashboard/teacher/class"));
const TeacherChatPage          = lazy(() => import("@views/dashboard/teacher/chatbot/TeacherAITutors"));
const TeacherAssignmentsPage   = lazy(() => import("@views/dashboard/teacher/assignments/TeacherAssignments"));
const TeacherAssignmentDetail  = lazy(() => import("@views/dashboard/teacher/assignments/TeacherAssignmentDetail"));
const StudentAssignmentsPage   = lazy(() => import("@views/dashboard/student/assignments/StudentAssignments"));
const StudentAssignmentExam    = lazy(() => import("@views/dashboard/student/assignments/StudentAssignmentExam"));
const StudentSubjectsPage      = lazy(() => import("@views/dashboard/student/subjects/StudentSubjects"));

// Layout tự động lấy role từ store — dùng cho route chung mọi user đã đăng nhập
// const AuthLayout = () => {
//   const role = useAuthStore((s) => s.user?.role) as 'admin' | undefined;
//   return <VerticalLayout userRole={role} />;
// };

export const appRoutes: RouteObject[] = [
  // Landing
  {
    path: "/",
    element: (
      <BlankLayout>
        <Home />
      </BlankLayout>
    ),
  },

  // Admin only
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <VerticalLayout userRole="admin" />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        children: [
          { index: true, element: <Dashboard /> },
          { path: "manage-users", element: <ManageUsers /> },
          { path: "manage-locations", element: <ManageLocations /> },
        ],
      },
    ],
  },

  {
    path: "/user",
    element: (
      <ProtectedRoute allowedRoles={["user"]}>
        <VerticalLayout userRole="user" />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        children: [{ path: "manage-locations", element: <ManageLocations /> }],
      },
    ],
  },

  // Authenticated — mọi role
  {
    path: "/me",
    element: (
      <ProtectedRoute>
        <HorizontalLayout />
      </ProtectedRoute>
    ),
    children: [{ path: "profile", element: <MyProfile /> }],
  },

  // Student pages
  {
    path: "/student/dashboard",
    element: (
      <ProtectedRoute>
        <BlankLayout>
          <StudentAspx />
        </BlankLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/profile",
    element: (
      <ProtectedRoute>
        <BlankLayout>
          <StudentProfile />
        </BlankLayout>
      </ProtectedRoute>
    ),
  },

  // Teacher pages
  {
    path: "/teacher/dashboard",
    element: (
      <ProtectedRoute>
        <BlankLayout>
          <TeacherAspx />
        </BlankLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/teacher/profile",
    element: (
      <ProtectedRoute>
        <BlankLayout>
          <TeacherProfile />
        </BlankLayout>
      </ProtectedRoute>
    ),
  },

  // Teacher — AI chatbot
  {
    path: "/teacher/chat",
    element: (
      <ProtectedRoute>
        <BlankLayout>
          <TeacherChatPage />
        </BlankLayout>
      </ProtectedRoute>
    ),
  },

  // Teacher — class student list
  {
    path: "/teacher/courses/:idToHoc/students",
    element: (
      <ProtectedRoute>
        <BlankLayout>
          <ClassStudentsPage />
        </BlankLayout>
      </ProtectedRoute>
    ),
  },

  // Teacher — assignment management
  {
    path: "/teacher/assignments",
    element: (
      <ProtectedRoute>
        <BlankLayout>
          <TeacherAssignmentsPage />
        </BlankLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/teacher/assignments/:id",
    element: (
      <ProtectedRoute>
        <BlankLayout>
          <TeacherAssignmentDetail />
        </BlankLayout>
      </ProtectedRoute>
    ),
  },

  // Student — subject list
  {
    path: "/student/subjects",
    element: (
      <ProtectedRoute>
        <BlankLayout>
          <StudentSubjectsPage />
        </BlankLayout>
      </ProtectedRoute>
    ),
  },

  // Student — assignments
  {
    path: "/student/assignments",
    element: (
      <ProtectedRoute>
        <BlankLayout>
          <StudentAssignmentsPage />
        </BlankLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/assignments/:id",
    element: (
      <ProtectedRoute>
        <BlankLayout>
          <StudentAssignmentExam />
        </BlankLayout>
      </ProtectedRoute>
    ),
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
