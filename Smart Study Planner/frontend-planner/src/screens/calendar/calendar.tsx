import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppSideBar, { SidebarPage } from "@/components/ui/SideBar";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { AppPage } from "../MainContainer";
import EventPopup from "@/components/EventPopup";
import ModulePopup from "@/components/ModulePopup";

interface CalendarViewProps {
  onLogout: () => void;
  onPageChange?: (page: AppPage) => void;
}

type ViewType = 'day' | 'week' | 'month';

const CalendarView: React.FC<CalendarViewProps> = ({ onLogout, onPageChange }) => {
  const [activePage, setActivePage] = useState<SidebarPage>("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isEventPopupOpen, setIsEventPopupOpen] = useState(false);
  const [isModulePopupOpen, setIsModulePopupOpen] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('month');

  const fetchEvents = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const userId = JSON.parse(storedUser).id;

    fetch(`http://localhost:8080/api/events?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('Raw data from backend:', data);
        const converted: CalendarEvent[] = data.map((event: any) => ({
          id: String(event.id),
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          start_time: event.startTime,
          end_time: event.endTime,
          type: event.type,
          isFullDay: event.isFullDay
        }));
        console.log('Converted events:', converted);
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

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') {
      newDate.setDate(currentDate.getDate() - 1);
    } else if (viewType === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') {
      newDate.setDate(currentDate.getDate() + 1);
    } else if (viewType === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
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
    // Adjust for Monday start (0 = Sunday, 1 = Monday)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const days: (Date | null)[] = [];

    for (let i = 0; i < adjustedFirstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    return days;
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    // Adjust to start on Monday (0 = Sunday, 1 = Monday)
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(start.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
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

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  };

  const isEventOnDay = (event: CalendarEvent, date: Date) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    // Normalize dates to compare only the date part, not time
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const eventStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const eventEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    return checkDate >= eventStartDate && checkDate <= eventEndDate;
  };

  const hasEvents = (date: Date) =>
    events.some(event => isEventOnDay(event, date));

  const getDayEvents = (date: Date) =>
    events.filter(event => isEventOnDay(event, date));

  const formatDateHeader = () => {
    if (viewType === 'day') {
      return currentDate.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } else if (viewType === 'week') {
      const weekDays = getWeekDays();
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.getDate()}.${start.getMonth() + 1} - ${end.getDate()}.${end.getMonth() + 1}.${end.getFullYear()}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  const renderTimeBasedView = (days: Date[]) => (
    <Card className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      {/* Header mit Wochentagen */}
      <div className={`grid ${viewType === 'day' ? 'grid-cols-2' : 'grid-cols-8'} text-sm font-medium bg-gray-100 border-b border-gray-200`}>
        <div className="p-3 text-center border-r border-gray-200 w-20 flex-shrink-0">
          Time
        </div>
        {days.map((day, i) => (
          <div key={i} className="p-3 text-center border-r border-gray-200 last:border-r-0 min-w-0 flex-1">
            <div className="font-medium text-gray-700">
              {day.toLocaleDateString('de-DE', { weekday: 'short' })}
            </div>
            <div className={`text-lg mt-1 w-8 h-8 flex items-center justify-center rounded-full mx-auto
              ${isToday(day) ? 'bg-[#002366] text-white' : ''}
              ${isSelected(day) && !isToday(day) ? 'bg-blue-100 text-[#002366]' : ''}
            `}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Zeitraster */}
      <div className="max-h-[600px] overflow-y-auto">
        {timeSlots.map((time, timeIndex) => (
          <div key={time} className={`grid ${viewType === 'day' ? 'grid-cols-2' : 'grid-cols-8'} border-b border-gray-100 hover:bg-gray-50`}>
            {/* Zeit-Spalte */}
            <div className="p-3 text-xs text-gray-500 border-r border-gray-200 bg-gray-50 flex items-start w-20 flex-shrink-0">
              {time}
            </div>

            {/* Tag-Spalten */}
            {days.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="border-r border-gray-200 last:border-r-0 hover:bg-blue-50 cursor-pointer relative min-w-0 flex-1"
                onClick={() => setSelectedDate(day)}
                style={{ minHeight: '60px' }}
              >
                {getDayEvents(day)
                  .filter(event => {
                    if (event.isFullDay) return timeIndex === 0;
                    const eventStartHour = parseInt(event.start_time?.split(':')[0] || '0');
                    return eventStartHour === timeIndex;
                  })
                  .map(event => {
                    const startHour = parseInt(event.start_time?.split(':')[0] || '0');
                    const startMinute = parseInt(event.start_time?.split(':')[1] || '0');
                    const endHour = parseInt(event.end_time?.split(':')[0] || '0');
                    const endMinute = parseInt(event.end_time?.split(':')[1] || '0');

                    const startInMinutes = startHour * 60 + startMinute;
                    const endInMinutes = endHour * 60 + endMinute;
                    const durationInMinutes = endInMinutes - startInMinutes;

                    const height = event.isFullDay ? 40 : Math.max((durationInMinutes / 60) * 60, 20);
                    const topOffset = event.isFullDay ? 10 : (startMinute / 60) * 60;

                    // Check if event spans multiple days
                    const eventStartDate = new Date(event.startDate);
                    const eventEndDate = new Date(event.endDate);
                    const isMultiDay = !isSameDay(eventStartDate, eventEndDate);

                    return (
                      <div
                        key={event.id}
                        className={`absolute left-1 right-1 rounded text-xs p-2 overflow-hidden z-10
                          ${event.type === 'study' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}
                          ${event.isFullDay ? 'font-medium' : ''}
                        `}
                        style={{
                          height: `${height}px`,
                          top: `${topOffset}px`
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {!event.isFullDay && (
                          <div className="text-xs opacity-90">
                            {event.start_time?.slice(0, 5)} - {event.end_time?.slice(0, 5)}
                          </div>
                        )}
                        {isMultiDay && (
                          <div className="text-xs opacity-75">
                            {eventStartDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - {eventEndDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                          </div>
                        )}
                      </div>
                    );
                  })
                }
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );

  const renderMonthView = () => {
    const calendarDays = generateCalendarDays();
    const selectedDayEvents = getDayEvents(selectedDate);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-2 bg-white border border-gray-300 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-7 text-sm font-medium bg-gray-100">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
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
                      {getDayEvents(day).slice(0, 2).map(event => {
                        const eventStartDate = new Date(event.startDate);
                        const eventEndDate = new Date(event.endDate);
                        const isMultiDay = !isSameDay(eventStartDate, eventEndDate);

                        return (
                          <div key={event.id} className={`text-xs p-1 rounded truncate
                            ${event.type === 'study' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                          `}>
                            {!event.isFullDay && event.start_time?.slice(0, 5)} {event.title}
                            {isMultiDay && <span className="text-xs opacity-75"> (Multi-day)</span>}
                          </div>
                        );
                      })}
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
                {selectedDayEvents.map(event => {
                  const eventStartDate = new Date(event.startDate);
                  const eventEndDate = new Date(event.endDate);
                  const isMultiDay = !isSameDay(eventStartDate, eventEndDate);

                  return (
                    <div key={event.id} className={`p-3 rounded-lg border-l-4
                      ${event.type === 'study' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'}
                    `}>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-gray-600">
                        {event.isFullDay ? (
                          isMultiDay ?
                            `${eventStartDate.toLocaleDateString('de-DE')} - ${eventEndDate.toLocaleDateString('de-DE')}` :
                            'All day'
                        ) : (
                          `${event.start_time?.substring(0, 5)} - ${event.end_time?.substring(0, 5)}`
                        )}
                      </div>
                      {isMultiDay && !event.isFullDay && (
                        <div className="text-xs text-gray-500 mt-1">
                          {eventStartDate.toLocaleDateString('de-DE')} - {eventEndDate.toLocaleDateString('de-DE')}
                        </div>
                      )}
                    </div>
                  );
                })}
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
    );
  };

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
            <Button
              onClick={() => setIsModulePopupOpen(true)}
              className="bg-[#002366] text-white hover:bg-[#001a4d]"
            >
              + Add Module
            </Button>
            {/* View Type Buttons */}
            <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
              {(['day', 'week', 'month'] as ViewType[]).map((view) => (
                <Button
                  key={view}
                  onClick={() => setViewType(view)}
                  className={`px-4 py-2 text-sm font-medium rounded-none border-0
                    ${viewType === view
                      ? 'bg-[#002366] text-white hover:bg-[#001a4d]'
                      : 'bg-white text-[#002366] hover:bg-gray-50'
                    }
                  `}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </Button>
              ))}
            </div>

            <Button onClick={goToToday} className="border-[#002366] text-[#002366] hover:bg-[#002366] hover:text-white">
              Today
            </Button>
            <div className="flex space-x-2">
              <Button size="icon" onClick={goToPrevious} className="border-[#002366] text-[#002366] hover:bg-[#002366] hover:text-white">
                <ChevronLeft size={18} />
              </Button>
              <Button size="icon" onClick={goToNext} className="border-[#002366] text-[#002366] hover:bg-[#002366] hover:text-white">
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>

        <div className={`text-xl font-medium mb-6 ${viewType === 'day' ? 'text-center' : ''}`}>{formatDateHeader()}</div>

        {viewType === 'month' && renderMonthView()}
        {viewType === 'week' && renderTimeBasedView(getWeekDays())}
        {viewType === 'day' && renderTimeBasedView([currentDate])}

        {/* Add Event Button for Day/Week Views */}
        {viewType !== 'month' && (
          <div className="fixed bottom-8 right-8 flex flex-col items-end space-y-3">
            {/* Add Event Button */}
            <Button
              className="bg-[#002366] hover:bg-[#001a4d] text-white rounded-full w-14 h-14 shadow-lg"
              onClick={() => setIsEventPopupOpen(true)}
            >
              <Plus size={24} />
            </Button>

            {/* Import Calendar Button */}
            <input
              type="file"
              accept=".ics"
              id="calendar-import"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                const storedUser = localStorage.getItem("user");
                if (!file || !storedUser) return;

                const userId = JSON.parse(storedUser).id;
                const formData = new FormData();
                formData.append("file", file);
                formData.append("userId", userId);

                try {
                  await fetch("http://localhost:8080/api/events/import", {
                    method: "POST",
                    body: formData
                  });
                  fetchEvents(); // Lade neue Events nach Import
                } catch (error) {
                  console.error("Import fehlgeschlagen:", error);
                }
              }}
            />
            <label htmlFor="calendar-import">
              <Button
                className="bg-[#002366] hover:bg-[#001a4d] text-white rounded-full w-14 h-14 shadow-lg"
                asChild
              >
                <div title="Import Calendar">📥</div>
              </Button>
            </label>
          </div>
        )}
      </div>

      <EventPopup open={isEventPopupOpen} onOpenChange={setIsEventPopupOpen} onEventCreated={fetchEvents} />
      <ModulePopup open={isModulePopupOpen} onOpenChange={setIsModulePopupOpen} onModuleCreated={fetchEvents} />
    </div>
  );
};

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  start_time: string;
  end_time: string;
  type: "study" | "meeting" | "deadline" | "other";
  isFullDay: boolean;
}

export default CalendarView;