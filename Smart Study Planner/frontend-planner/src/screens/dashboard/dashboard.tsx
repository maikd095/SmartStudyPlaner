// All imports incl. https://ui.shadcn.com
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppSideBar, { SidebarPage } from "@/components/ui/SideBar";
import type { AppPage } from "../MainContainer";

// Props that the dashboard expects to receive
interface DashboardProps {
  onLogout: () => void;
  onPageChange: (page: AppPage) => void;
}

// Fields/columns of an event object
interface EventItem {
  id: number;
  title: string;
  startDate: string;
  startTime: string;
  endTime: string;
  type: string;
  sessionUsed?: number;
}

// Dashboard component
const Dashboard: React.FC<DashboardProps> = ({ onLogout, onPageChange }) => {
  const [activePage, setActivePage] = useState<SidebarPage>("dashboard");
  const [events, setEvents] = useState<EventItem[]>([]);

  // handle navigation between pages
  const handlePageChange = (page: SidebarPage) => {
    setActivePage(page);
    onPageChange(page as AppPage);
  };

  // Fetch events for the next events
  useEffect(() => {
    const fetchEvents = async () => {
      // get user ID
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch(`https://study-planner-online-275553834411.europe-west3.run.app/api/events?userId=${user.id}`);
      const data = await response.json();
      setEvents(data);
    };

    fetchEvents();
  }, []);

  // calculating total learning hours for this and last week
  const calculateStudyHours = (weekOffset: number = 0) => {
    const now = new Date();
    const currentWeekStart = new Date(now);
    const currentWeekEnd = new Date(now);

    const dayOfWeek = now.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    currentWeekStart.setDate(now.getDate() - daysToSubtract - (weekOffset * 7));
    currentWeekStart.setHours(0, 0, 0, 0);

    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    // Filter events that are learning sessions and were completed this week
    const completedLearningSessions = events.filter(event => {
      if (event.type !== "learning session" || event.sessionUsed !== 1) return false;
      const eventDate = new Date(`${event.startDate}T${event.startTime}`);
      return eventDate >= currentWeekStart && eventDate <= currentWeekEnd;
    });

    // Calculate total duration in minutes
    const totalMinutes = completedLearningSessions.reduce((total, session) => {
      if (!session.startTime || !session.endTime) return total;

      const startTime = new Date(`2000-01-01T${session.startTime}`);
      const endTime = new Date(`2000-01-01T${session.endTime}`);
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = durationMs / (1000 * 60);
      return total + durationMinutes;
    }, 0);

    return Math.round((totalMinutes / 60) * 10) / 10;
  };

  // Calculate learning hours for this and last week
  const thisWeekHours = calculateStudyHours(0);
  const lastWeekHours = calculateStudyHours(1);

  // progress bar, with max. 60 hours
  const maxHours = 60;
  const thisWeekPercentage = Math.min((thisWeekHours / maxHours) * 100, 100);
  const lastWeekPercentage = Math.min((lastWeekHours / maxHours) * 100, 100);

  // Other upcoming 3 events
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

  // Next 3 learning sessions
  const displayableLearningSessions = events
    .filter(event => {
      const now = new Date();
      const eventDateTime = new Date(`${event.startDate}T${event.startTime}`);
      return eventDateTime > now && event.type === "learning session";
    })
    .sort((a, b) => {
      const aDate = new Date(`${a.startDate}T${a.startTime}`);
      const bDate = new Date(`${b.startDate}T${b.startTime}`);
      return aDate.getTime() - bDate.getTime();
    })
    .slice(0, 3);

  //Layout 
  return (
    <div className="flex h-screen font-sans bg-[#f2f3f7]">
      <AppSideBar
        activePage={activePage}
        onPageChange={handlePageChange}
        onLogout={onLogout}
      />

      <div className="flex-1 bg-[#f2f3f7] p-8 overflow-y-auto">
        <h2 className="text-3xl font-bold mb-6">Overview</h2>

        {/* 4 dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card 1: Next learning sessions */}
          <Card className="bg-white border border-gray-300 rounded-2xl h-60">
            <CardContent className="pt-0 px-4">
              <h3 className="font-bold text-lg mb-2">Next Learning Sessions</h3>
              {displayableLearningSessions.length === 0 ? (
                <p className="text-gray-500 text-sm">No upcoming Learning sessions.</p>
              ) : (
                <ul className="list-none space-y-3 text-sm text-gray-800">
                  {displayableLearningSessions.map((event) => {
                    const formattedDate = new Date(`${event.startDate}T${event.startTime}`);
                    const dateString = `${formattedDate.toLocaleDateString("de-DE")}  ${formattedDate.toLocaleTimeString("de-DE", {
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

          {/* Card 2: Next events */}
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

          {/* Card 3: Progress bar */}
          <Card className="bg-white border border-gray-300 rounded-2xl">
            <CardContent className="pt-0 px-4">
              <h3 className="font-bold text-lg mb-4">Weekly Study Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-700 font-medium">This Week</p>
                  <div className="w-full bg-gray-200 h-4 rounded-full">
                    <div
                      className="bg-[#002366] h-4 rounded-full transition-all duration-300"
                      style={{ width: `${thisWeekPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">{thisWeekHours}h</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Last Week</p>
                  <div className="w-full bg-gray-200 h-4 rounded-full">
                    <div
                      className="bg-blue-400 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${lastWeekPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">{lastWeekHours}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Action buttons */}
          <Card className="bg-white border border-gray-300 rounded-2xl">
            <CardContent className="p-6 flex flex-col space-y-4">
              <h3 className="font-bold text-lg">Feed your Calendar</h3>
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
