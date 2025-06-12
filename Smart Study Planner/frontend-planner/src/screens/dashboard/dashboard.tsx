import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppSideBar, { SidebarPage } from "@/components/ui/SideBar";
import type { AppPage } from "../MainContainer";

interface DashboardProps {
  onLogout: () => void;
  onPageChange: (page: AppPage) => void;
}

interface EventItem {
  id: number;
  title: string;
  startDate: string;
  startTime: string;
  type: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onPageChange }) => {
  const [activePage, setActivePage] = useState<SidebarPage>("dashboard");
  const [events, setEvents] = useState<EventItem[]>([]);

  const handlePageChange = (page: SidebarPage) => {
    setActivePage(page);
    onPageChange(page as AppPage);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch(`http://localhost:8080/api/events?userId=${user.id}`);
      const data = await response.json();
      setEvents(data);
    };

    fetchEvents();
  }, []);

  const displayableEvents = events
    .filter(event => {
      const now = new Date();
      const eventDateTime = new Date(`${event.startDate}T${event.startTime}`);
      return eventDateTime > now && event.type !== "learning session";
    })
    .sort((a, b) => {
      const aDate = new Date(`${a.startDate}T${a.startTime}`);
      const bDate = new Date(`${b.startDate}T${b.startTime}`);
      return aDate.getTime() - bDate.getTime();
    })
    .slice(0, 3);



  return (
    <div className="flex h-screen font-sans bg-[#f2f3f7]">
      <AppSideBar
        activePage={activePage}
        onPageChange={handlePageChange}
        userName="Max"
        onLogout={onLogout}
      />

      <div className="flex-1 bg-[#f2f3f7] p-8 overflow-y-auto">
        <h2 className="text-3xl font-bold mb-6">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border border-gray-300 rounded-2xl h-60">
            <CardContent className="pt-0 px-4">
              <h3 className="font-bold text-lg mb-2">Next Learning Sessions</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">Finance</p>
                  <p className="text-gray-700">Chapter 3</p>
                  <p className="text-gray-600">📅 Apr 17 - 05:00 PM</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Strategy</p>
                  <p className="text-gray-700">Chapter 7</p>
                  <p className="text-gray-600">📅 Apr 17 - 06:00 PM</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-300 rounded-2xl h-60">
            <CardContent className="pt-0 px-4">
              <h3 className="font-bold text-lg mb-2">Upcoming Events</h3>
              {displayableEvents.length === 0 ? (
                <p className="text-gray-500 text-sm">No upcoming events.</p>
              ) : (
                <ul className="list-none space-y-3 text-sm text-gray-800">
                  {displayableEvents.map((event) => {
                    const formattedDate = new Date(`${event.startDate}T${event.startTime}`);
                    const dateString = `${formattedDate.toLocaleDateString("de-DE")} – ${formattedDate.toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}`;
                    return (
                      <li key={event.id} className="leading-snug">
                        <div className="font-medium text-gray-900">{event.title}</div>
                        <div className="text-xs text-gray-500">📅 {dateString}</div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-300 rounded-2xl">
            <CardContent className="pt-0 px-4">
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
              <Button
                className="bg-green-100 text-[#002366] font-semibold justify-start w-full"
                onClick={() => handlePageChange("focus")}
              >
                🌱 Start Focus Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
