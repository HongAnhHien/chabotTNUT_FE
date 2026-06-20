import { LayoutDashboard, Users, MapPin } from "lucide-react";
import { type NavLink, type NavGroup, type UserRole } from "./INavProps";

// ─── Section label keys (dùng với t()) ───────────────────────────────────────
export const sectionLabelKeys: Record<string, string> = {
  app: "nav.section.app",
  manage: "nav.section.manage",
  learning: "nav.section.learning",
  data: "nav.section.data",
  system: "nav.section.system",
  settings: "nav.section.settings",
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminNavLinks: NavLink[] = [
  {
    title: "nav.dashboard",
    section: "app",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    checkRoll: ["admin"],
  },
  {
    title: "nav.users",
    section: "manage",
    icon: Users,
    checkRoll: ["admin"],
    href: "/admin/dashboard/manage-users",
  },
  {
    title: "nav.locations",
    section: "manage",
    icon: MapPin,
    checkRoll: ["admin"],
    href: "/admin/dashboard/manage-locations",
  },
];


export const userNavLinks: NavLink[] = [
 
  {
    title: "nav.locations",
    section: "manage",
    icon: MapPin,
    checkRoll: ["user"],
    href: "/user/dashboard/manage-locations",
  },
];
// ─── Teacher (placeholder, bổ sung sau) ──────────────────────────────────────
export const teacherNavLinks: NavLink[] = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const navLinks: NavLink[] = [
  ...adminNavLinks,
  ...userNavLinks,
];

export const getNavLinksByRole = (role: UserRole): NavLink[] => {
  switch (role) {
    case "admin":
      return adminNavLinks;
    case "user":
      return userNavLinks;
  
  }
};

export const getNavGroupsByRole = (role: UserRole): NavGroup[] => {
  const links = getNavLinksByRole(role);
  const map = new Map<string, NavGroup>();

  for (const link of links) {
    if (!map.has(link.section)) {
      map.set(link.section, {
        section: link.section,
        label: sectionLabelKeys[link.section] ?? link.section,
        items: [],
      });
    }
    map.get(link.section)!.items.push(link);
  }

  return Array.from(map.values());
};

export const getFilteredLinks = (role: UserRole) =>
  navLinks.filter((l) => l.checkRoll.includes(role));
