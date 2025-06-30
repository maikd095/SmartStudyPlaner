// All imports incl. https://ui.shadcn.com
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Calendar, BarChart2, Clock, Settings, LogOut, Lock } from "lucide-react";

// Define all sites in app
export type SidebarPage = "dashboard" | "calendar" | "focus" | "statistics" | "progress" | "settings";

// props that the App Side Bar expects to receive
interface AppSideBarProps {
  activePage: SidebarPage;
  onPageChange: (page: SidebarPage) => void;
  onLogout: () => void;
}
// Side Bar component
const AppSideBar: React.FC<AppSideBarProps> = ({
  activePage,
  onPageChange,
  onLogout
}) => {

  //get userID for Backend
  const [userName, setUserName] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored).firstName : "...";
  });

  useEffect(() => {
    //get firstname for the AppSideBar to see the user's name at all time
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const userId = JSON.parse(storedUser).id;
    fetch(`https://study-planner-online-275553834411.europe-west3.run.app/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUserName(data.firstName);
      })
      .catch(err => {
        console.error("Error while loading user:", err);
      });
  }, []);

  // Define shown named
  const navItems = [
    { id: "dashboard" as SidebarPage, label: "Dashboard", icon: <Home size={18} /> },
    { id: "calendar" as SidebarPage, label: "Calendar View", icon: <Calendar size={18} /> },
    { id: "focus" as SidebarPage, label: "Focus Mode", icon: <Lock size={18} /> },
    { id: "statistics" as SidebarPage, label: "Statistics", icon: <BarChart2 size={18} /> },
    { id: "progress" as SidebarPage, label: "Progress", icon: <Clock size={18} /> },
    { id: "settings" as SidebarPage, label: "Settings", icon: <Settings size={18} /> }
  ];


  //Layout of SideBar
  return (
    <div className="w-64 bg-[#002366] text-white flex flex-col justify-between p-4 h-full">
      <div>
        <h1 className="text-2xl font-bold mb-8">Smart Study Planner</h1>
        <nav className="flex flex-col space-y-4">
          {navItems.map((item) => (
            <Button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`justify-start w-full ${activePage === item.id
                ? "bg-white text-[#002366] font-semibold shadow-sm"
                : "text-white border-white hover:text-[#002366] hover:bg-white"
                }`}
              variant={activePage === item.id ? "ghost" : "outline"}
            >
              <span className="mr-2">{item.icon}</span> {item.label}
            </Button>
          ))}
        </nav>
      </div>
      <div>
        <Button
          onClick={onLogout}
          className="w-full font-bold bg-white text-red-500 hover:bg-red-100"
        >
          <LogOut size={18} className="mr-2" /> Logout
        </Button>
        <div className="flex items-center space-x-2 mt-4">
          <div className="bg-white text-[#002366] w-8 h-8 rounded-full flex items-center justify-center font-medium">
            {userName.charAt(0)}
          </div>
          <span>Hi, {userName}!</span>
          <Settings size={18} className="ml-auto cursor-pointer" onClick={() => onPageChange("settings")} />
        </div>
      </div>
    </div>
  );
};

export default AppSideBar;
