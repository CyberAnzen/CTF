// src/components/Sidebar.jsx
import React, { useState } from "react";
import {
  Home,
  User,
  FileText,
  Settings,
  Calendar,
  BarChart,
  Plus,
  X,
  ChevronRight,
  Copy,
  Users,
  LogOut,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL_W;
export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activeItem,
  setActiveItem,
}) {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(user?._id || "748589549");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLogout = () => {
    navigate("/logout");
  };

  const menuItems = [
    { name: "Dashboard", icon: <Home /> },
    { name: "User Profile", icon: <User /> },
    { name: "Team", icon: <Users /> },
    // { name: "Documents", icon: <FileText /> },
    { name: "Setting", icon: <Settings /> },
    // { name: "Schedule", icon: <Calendar /> },
    // { name: "Report", icon: <BarChart /> },
  ];

  const loading = !user; // true when user not loaded

  return (
    <>
      <div
        className={`fixed z-30  left-1 top-27 w-64 lg:w-72 h-[84vh] bg-black/50 shadow transform transition-transform duration-300 ease-in-out border border-[#00ffff]/25 rounded-2xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:block`}
      >
        <div className="p-4 border-b border-[#00ffff]/30">
          <div className="flex items-center space-x-2">
            {/* Avatar */}
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse" />
            ) : (
              <img
                src={`${BACKEND_URL}/public${user?.profile?.avator}`}
                alt="avatar"
                className="w-10 h-10 rounded-full"
              />
            )}

            <div className="flex flex-col gap-0.5">
              {/* Username */}
              {loading ? (
                <div className="w-36 h-4 rounded bg-gray-700 animate-pulse" />
              ) : (
                <h4 className="text-sm font-semibold text-[#00ffff]">
                  {user?.username || "James CameraMan"}
                </h4>
              )}

              {/* ID + copy */}
              <p className="flex items-center justify-center gap-1.5 lg:text-[10px] sm:text-[8px] text-gray-300 relative">
                {loading ? (
                  <div className="w-40 h-3 rounded bg-gray-700 animate-pulse" />
                ) : (
                  <>
                    {user?._id || "748589549"}
                    <Copy
                      onClick={handleCopy}
                      className="cursor-pointer hover:text-[#00ffff]/50"
                      size={12}
                    />
                    {copied && (
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs text-black font-medium bg-[#00ff00] px-2 py-0.5 rounded shadow">
                        Copied!
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            className="md:hidden absolute top-4 right-4 text-gray-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-4 px-2 space-y-2 text-gray-300">
          {loading
            ? // show skeleton rows while loading
              Array.from({ length: menuItems.length }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="flex items-center px-4 py-2 transition-colors"
                >
                  <div className="mr-3 w-5 h-5 rounded bg-gray-700 animate-pulse" />
                  <div className="h-3 w-32 rounded bg-gray-700 animate-pulse" />
                </div>
              ))
            : // normal menu when loaded
              menuItems.map((item) => (
                <div
                  key={item.name}
                  onClick={() => setActiveItem(item.name)}
                  className={`flex items-center px-4 py-2 cursor-pointer transition-colors ${
                    activeItem === item.name
                      ? "text-[#00ffff] bg-[#00ffff]/10"
                      : "hover:text-[#00ffff] hover:bg-[#00ffff]/5"
                  }`}
                >
                  <div className="mr-3">{item.icon}</div>
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 w-full px-4">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-medium bg-[#ff0040]/20 text-[#ff0040] hover:bg-[#ff0040]/40 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Click-outside overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Navbar */}
      <div className="md:hidden absolute top-1 left-0 z-20 bg-black/50 rounded-2xl p-2 h-12 w-10 shadow mt-20">
        <button onClick={() => setSidebarOpen(true)}>
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>
    </>
  );
}
