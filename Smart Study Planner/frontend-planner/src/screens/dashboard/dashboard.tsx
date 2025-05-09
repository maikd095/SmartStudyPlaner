import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppSideBar, { SidebarPage } from "@/components/ui/SideBar";
import type { AppPage } from "../MainContainer";

interface DashboardProps {
  onLogout: () => void;
  onPageChange: (page: AppPage) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onPageChange }) => {
  const [activePage, setActivePage] = useState<SidebarPage>("dashboard");
  
  // Neue Funktion, die sowohl lokalen State als auch übergeordneten State aktualisiert
  const handlePageChange = (page: SidebarPage) => {
    setActivePage(page);
    onPageChange(page as AppPage);
  };

  return (
    <div className="flex h-screen font-sans bg-[#f2f3f7]">
      {/* Wiederverwendbare Sidebar-Komponente mit übergebenem onLogout-Handler */}
      <AppSideBar
        activePage={activePage}
        onPageChange={handlePageChange}
        userName="Max"
        onLogout={onLogout}
      />
      {/* Main Content */}
      <div className="flex-1 bg-[#f2f3f7] p-8 overflow-y-auto">
        <h2 className="text-3xl font-bold mb-6">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border border-gray-300 rounded-2xl h-fit">
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-2">Next Session</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">Finance</p>
                  <p className="text-gray-700">Chapter 3</p>
                  <p className="text-gray-600">📅 Apr 17 – 05:00 PM</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Strategy</p>
                  <p className="text-gray-700">Chapter 7</p>
                  <p className="text-gray-600">📅 Apr 17 – 06:00 PM</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-300 rounded-2xl h-fit">
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-2">Upcoming Tasks</h3>
              <ul className="list-none space-y-1 text-sm text-gray-800">
                <li>✅ Do a company research of Qualcomm <div className="text-xs text-gray-500">April 18</div></li>
                <li>✅ Review Lecture Slides – NPV & IRR <div className="text-xs text-gray-500">April 18</div></li>
                <li>✅ Sum up Chapter 4 – Risk and Return <div className="text-xs text-gray-500">April 19</div></li>
                <li>✅ Watch Tutorial on DCF Models <div className="text-xs text-gray-500">April 20</div></li>
              </ul>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-300 rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">Weekly Study Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-700 font-medium">This Week</p>
                  <div className="w-full bg-gray-200 h-4 rounded-full">
                    <div className="bg-[#002366] h-4 rounded-full" style={{ width: "70%" }}></div>
                  </div>
                  <p className="text-sm text-gray-600">20h</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Last Week</p>
                  <div className="w-full bg-gray-200 h-4 rounded-full">
                    <div className="bg-blue-400 h-4 rounded-full" style={{ width: "50%" }}></div>
                  </div>
                  <p className="text-sm text-gray-600">14h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-300 rounded-2xl">
            <CardContent className="p-6 flex flex-col space-y-4">
              <h3 className="font-bold text-lg">Feed your Calendar</h3>
              <Button 
                className="bg-blue-100 text-[#002366] font-semibold justify-start w-full"
              >
                ➕ New To-Do
              </Button>
              <Button 
                className="bg-blue-100 text-[#002366] font-semibold justify-start w-full"
                onClick={() => handlePageChange("calendar")}
              >
                ➕ New Calendar Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;