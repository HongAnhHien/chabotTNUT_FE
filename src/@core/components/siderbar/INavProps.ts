import { type LucideIcon } from 'lucide-react';

export type UserRole = 'admin' | 'user';

export type NavSection =
  | 'app'       // Tổng quan / trang chính
  | 'manage'    // Quản lý dữ liệu
  | 'learning'  // Học tập (dành cho student/teacher)
  | 'data'      // Dữ liệu & AI
  | 'system'    // Hệ thống, thông báo, báo cáo
  | 'settings'; // Cài đặt cá nhân

export interface NavChild {
  label: string;
  path: string;
}

export interface NavLink {
  title: string;
  section: NavSection;
  icon: LucideIcon;
  checkRoll: UserRole[];
  href?: string;
  children?: NavChild[];
  badge?: string | number;
}

export interface NavGroup {
  section: NavSection;
  label: string;
  items: NavLink[];
}

export interface SidebarProps {
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onClose?: () => void;
  userRole?: UserRole;
  currentPath?: string;
}
