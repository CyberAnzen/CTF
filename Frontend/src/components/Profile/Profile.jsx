import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import Sidebar from "./Sidebar";
import ProfileSettings from "./ProfileSettings";
import Team from "./Team";
import Dashboard from "./Dashboard";
// import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import Settings from "./Settings";

function Profile() {
  const navigate = useNavigate();
  const { loggedIn, User } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");
  // Redirect if not logged in
  useEffect(() => {
    if (!loggedIn && !User) {
      navigate("/login");
    }
  }, [loggedIn, User, navigate]);
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "auto";
  }, [sidebarOpen]);

  const renderContent = () => {
    switch (activeItem) {
      case "Dashboard":
        // return <Dashboard />;
        return (
          // <div className="px-0 min-h-screen font-sans flex items-center justify-center">
          //   <div className="text-center">
          //     <h2 className="text-2xl font-bold text-[#00ffff] mb-4">
          //       Dashboard
          //     </h2>
          //     <p className="text-[#00ffff]/60">
          //       Dashboard section coming soon...
          //     </p>
          //   </div>
          // </div>
          <Dashboard />
        );
      case "User Profile":
        return <ProfileSettings />;
      case "Team":
        return <Team />;
      case "Documents":
        return (
          <div className="px-0 min-h-screen font-sans flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#00ffff] mb-4">
                Documents
              </h2>
              <p className="text-[#00ffff]/60">
                Documents section coming soon...
              </p>
            </div>
          </div>
        );
      case "Setting":
        return <Settings />;
      case "Schedule":
        return (
          <div className="px-0 min-h-screen font-sans flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#00ffff] mb-4">
                Schedule
              </h2>
              <p className="text-[#00ffff]/60">
                Schedule section coming soon...
              </p>
            </div>
          </div>
        );
      case "Report":
        return (
          <div className="px-0 min-h-screen font-sans flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#00ffff] mb-4">
                Reports
              </h2>
              <p className="text-[#00ffff]/60">
                Reports section coming soon...
              </p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen  text-white flex">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      <main className="flex-1 overflow-x-hidden px-1 md:px-3 py-3 md:mt-0 md:ml-64 lg:ml-72">
        {renderContent()}
      </main>
    </div>
  );
}

export default Profile;
