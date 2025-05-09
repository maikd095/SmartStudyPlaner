// CalendarView.tsx
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppSideBar, { SidebarPage } from "@/components/ui/SideBar";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { AppPage } from "../MainContainer";
import EventPopup from "@/components/EventPopup";

interface CalendarViewProps {
  onLogout: () => void;
  onPageChange?: (page: AppPage) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onLogout, onPageChange }) => {
  const [activePage, setActivePage] = useState<SidebarPage>("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isEventPopupOpen, setIsEventPopupOpen] = useState(false);

  const fetchEvents = () => {
    fetch("http://localhost:8080/api/events")
      .then((res) => res.json())
      .then((data) => {
        console.log('Raw data from backend:', data); // Debug log
        const converted: CalendarEvent[] = data.map((event: any) => ({
          id: String(event.id),
          title: event.title,
          date: event.date,
          start_time: event.startTime, // startTime
          end_time: event.endTime,     // endTime
          type: event.type
        }));
        console.log('Converted events:', converted); // Debug log
        setEvents(converted);
      })
      .catch((err) => console.error("Fehler beim Laden der Events:", err));
  };


  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePageChange = (page: SidebarPage) => {
    setActivePage(page);
    if (onPageChange) onPageChange(page as AppPage);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) =>
    date.getDate() === selectedDate.getDate() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getFullYear() === selectedDate.getFullYear();

  // Helper function to compare dates without time
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  };

  const hasEvents = (date: Date) =>
    events.some(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });

  const getDayEvents = (date: Date) =>
    events.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const calendarDays = generateCalendarDays();
  const selectedDayEvents = getDayEvents(selectedDate);

  return (
    <div className="flex h-screen font-sans bg-[#f2f3f7]">
      <AppSideBar
        activePage={activePage}
        onPageChange={handlePageChange}
        userName="Max"
        onLogout={onLogout}
      />

      <div className="flex-1 bg-[#f2f3f7] p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Calendar</h2>
          <div className="flex space-x-4">
            <Button onClick={goToToday} className="border-[#002366] text-[#002366] hover:bg-[#002366] hover:text-white">
              Today
            </Button>
            <div className="flex space-x-2">
              <Button size="icon" onClick={goToPreviousMonth} className="border-[#002366] text-[#002366] hover:bg-[#002366] hover:text-white">
                <ChevronLeft size={18} />
              </Button>
              <Button size="icon" onClick={goToNextMonth} className="border-[#002366] text-[#002366] hover:bg-[#002366] hover:text-white">
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>

        <div className="text-xl font-medium mb-6">{formatDate(currentDate)}</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-2 bg-white border border-gray-300 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-7 text-sm font-medium bg-gray-100">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr border-t border-gray-200">
              {calendarDays.map((day, i) => (
                <div key={i} className={`border-b border-r border-gray-200 min-h-24 ${!day ? 'bg-gray-50' : ''}`}>
                  {day && (
                    <div className="h-full cursor-pointer hover:bg-blue-50 p-1" onClick={() => setSelectedDate(day)}>
                      <div className="flex justify-between items-start">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm
                          ${isToday(day) ? 'bg-[#002366] text-white' : ''}
                          ${isSelected(day) && !isToday(day) ? 'bg-blue-100 text-[#002366]' : ''}
                        `}>
                          {day.getDate()}
                        </div>
                        {hasEvents(day) && <div className="w-2 h-2 rounded-full bg-[#002366]"></div>}
                      </div>

                      <div className="mt-1 space-y-1 overflow-hidden max-h-20">
                        {getDayEvents(day).slice(0, 2).map(event => (
                          <div key={event.id} className={`text-xs p-1 rounded truncate
                            ${event.type === 'study' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                          `}>
                            {event.start_time?.slice(0, 5)} {event.title}
                          </div>
                        ))}
                        {getDayEvents(day).length > 2 && (
                          <div className="text-xs text-gray-500 pl-1">
                            + {getDayEvents(day).length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-white border border-gray-300 rounded-2xl">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {selectedDayEvents.length > 0 ? (
                <div className="space-y-3">
                {selectedDayEvents.map(event => (
                  <div key={event.id} className={`p-3 rounded-lg border-l-4
                    ${event.type === 'study' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'}
                  `}>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-600">
                      {event.start_time?.substring(0, 5)} - {event.end_time?.substring(0, 5)}
                    </div>
                  </div>
                ))}
              </div>
              
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No events scheduled for this day
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <Button className="w-full bg-[#002366] hover:bg-[#001a4d] text-white" onClick={() => setIsEventPopupOpen(true)}>
                <Plus size={16} className="mr-2" /> Add Event
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <EventPopup open={isEventPopupOpen} onOpenChange={setIsEventPopupOpen} onEventCreated={fetchEvents} />
    </div>
  );
};

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start_time: string;  // These names should match what we're getting from the backend
  end_time: string;    // after the conversion in fetchEvents
  type: "study" | "meeting" | "deadline" | "other";
}

export default CalendarView;