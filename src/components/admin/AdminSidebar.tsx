import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Settings,
  Users,
  FileText,
  Video,
  Images,
  Tag,
  LayoutDashboard,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageCircle,
  Film,
  Tv,
  Briefcase,
  MonitorSmartphone
} from "lucide-react";
import logo from '@/assets/logo.png';
import { useAuth } from '@/hooks/useAuth';

type SidebarItem = {
  title: string;
  icon: React.ElementType;
  href?: string;
  hasSubmenu?: boolean;
  submenu?: { title: string; href: string; slug?: string }[];
  children?: { title: string; href: string }[];
  roles?: string[];
};

// Removed category type as it's no longer needed for the sidebar

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    roles: ["admin"],
  },
  {
    title: "Articles",
    icon: FileText,
    href: "/admin/articles",
    roles: ["admin", "editor"],
  },
  {
    title: "Videos",
    icon: Video,
    href: "/admin/videos",
    roles: ["admin"],
  },
  {
    title: "Live TV",
    icon: Tv,
    href: "/admin/live-tv",
    roles: ["admin"],
  },
  {
    title: "Short Posts",
    icon: MessageCircle,
    href: "/admin/short-posts",
    roles: ["admin", "editor"],
  },
  {
    title: "Reels",
    icon: Film,
    href: "/admin/reels",
    roles: ["admin", "editor"],
  },
  {
    title: "Categories",
    icon: Tag,
    href: "/admin/categories",
    roles: ["admin"],
  },
  {
    title: "Sports",
    icon: MonitorSmartphone,
    href: "/admin/sports",
    roles: ["admin"],
  },
  {
    title: "Photos",
    icon: Images,
    href: "/admin/photos",
    roles: ["admin"],
  },
  {
    title: "Advertisements",
    icon: MonitorSmartphone,
    href: "/admin/advertisements",
    roles: ["admin"],
  },
  {
    title: "Comments",
    icon: MessageSquare,
    href: "/admin/comments",
    roles: ["admin", "editor"],
  },
  {
    title: "Contact Messages",
    icon: Mail,
    href: "/admin/contact",
    roles: ["admin"],
  },
  {
    title: "Careers",
    icon: Briefcase,
    href: "/admin/careers",
    roles: ["admin"],
  },
  {
    title: "Users",
    icon: Users,
    href: "/admin/users",
    roles: ["admin"],
  },
  {
    title: "Analytics",
    icon: FileText,
    href: "/admin/analytics",
    roles: ["admin"],
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/admin/settings",
    roles: ["admin"],
  },
];

const AdminSidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useAuth();
  const userRole = user?.role || "user";

  // State to track which submenus are open
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  // Filter items by the current user's role
  const visibleItems = sidebarItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  // Category fetching removed as it's no longer needed

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto hidden md:block">
      <div className="p-4">
        <div className="py-8 border-b border-gray-200">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Logo" width={149} height={150} />
          </Link>
        </div>
        <nav className="mt-8 space-y-1">
          {visibleItems.map((item, index) => (
            <div key={item.title}>
              {item.hasSubmenu ? (
                <div>
                  <button
                    onClick={() => setOpenSubmenus(prev => ({
                      ...prev,
                      [item.title]: !prev[item.title]
                    }))}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md transition-colors",
                      openSubmenus[item.title]
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.title}
                    </div>
                    {openSubmenus[item.title] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {openSubmenus[item.title] && (
                    <div className="pl-10 mt-1 space-y-1">
                      {item.submenu && item.submenu.length > 0 ? (
                        item.submenu.map((subitem) => (
                          <Link
                            key={subitem.href}
                            to={subitem.href}
                            className={cn(
                              "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                              location.pathname === subitem.href
                                ? "bg-primary/10 text-primary"
                                : "text-gray-600 hover:text-primary hover:bg-primary/5"
                            )}
                          >
                            {subitem.title}
                          </Link>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          No items found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.href || '#'}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    location.pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:text-primary hover:bg-primary/5"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
