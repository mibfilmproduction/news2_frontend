import React, { useEffect, ReactNode } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

// Roles allowed into the admin panel
export const ADMIN_ROLES = ["admin", "editor"];

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Auth + role check: both admin and editor can access the admin panel
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user || !ADMIN_ROLES.includes(user.role)) {
      navigate("/login");
    }
  }, [navigate]);
  
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;