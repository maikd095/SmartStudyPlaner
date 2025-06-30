// All imports incl. https://ui.shadcn.com
import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppSideBar, { SidebarPage } from "@/components/ui/SideBar";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { AppPage } from "../MainContainer";
import EventPopup from "@/components/EventPopup";
import ModulePopup from "@/components/ModulePopup";
import EditEventPopup from "@/components/EditEventPopup";
import LoadingOverlay from "@/components/LoadingOverlay";

interface CalendarViewProps {
  onLogout: () => void;
  onPageChange?: (page: AppPage) => void;
}
//View types of calendar
type ViewType = 'day' | 'week' | 'month';


// Initialize parameters
const CalendarView: React.FC<CalendarViewProps> = ({ onLogout, onPageChange }) => {
  const [activePage, setActivePage] = useState<SidebarPage>("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isEventPopupOpen, setIsEventPopupOpen] = useState(false);
  const [isModulePopupOpen, setIsModulePopupOpen] = useState(false);
  const [isEditEventPopupOpen, setIsEditEventPopupOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewType, setViewType] = useState<ViewType>('month');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get userID
  const fetchEvents = useCallback(async (forceUpdate = false) => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const userId = JSON.parse(storedUser).id;

    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`https://study-planner-online-275553834411.europe-west3.run.app/api/events?userId=${userId}&t=${timestamp}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      //Map fields from backend
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


      setEvents(converted);

      if (forceUpdate) {
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error while loading event:", error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handlePageChange = (page: SidebarPage) => {
    setActivePage(page);
    if (onPageChange) onPageChange(page as AppPage);
  };

  // When clicking on event
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsEditEventPopupOpen(true);
  };

  // Reschesule button
  const handleReschedule = async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const userId = JSON.parse(storedUser).id;

    setIsRescheduling(true);

    try {
      console.log("Starting rescheduling process...");

      // API call for rescheduling
      const response = await fetch(`https://study-planner-online-275553834411.europe-west3.run.app/api/planning/user/${userId}`, {
        method: "POST"
      });

      if (response.ok) {
        console.log("Learning sessions scheduled successfully");

        await new Promise(resolve => setTimeout(resolve, 1000));

        // detch events after rescheduling
        await fetchEvents(true);

        setRefreshKey(prev => prev + 1);
        setSelectedDate(new Date());
      } else {
        const errorText = await response.text();
        console.error("Error details:", errorText);
      }
    } catch (error) {
      console.error("Reschedule error:", error);
    } finally {
      // End Loading after API-call is finished
      setIsRescheduling(false);
    }
  };

  const handleEventCreated = useCallback(async () => {
    await fetchEvents(true);
  }, [fetchEvents]);

  const handleEventUpdated = useCallback(async () => {
    await fetchEvents(true);
  }, [fetchEvents]);

  // Button in the right top corner
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


  // Calendar generation
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const days: (Date | null)[] = [];

    for (let i = 0; i < adjustedFirstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    return days;
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
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
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const eventStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const eventEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    return checkDate >= eventStartDate && checkDate <= eventEndDate;
  };

  const hasEvents = (date: Date) =>
    events.some(event => isEventOnDay(event, date));

  const getDayEvents = (date: Date) =>
    events.filter(event => isEventOnDay(event, date))
      .sort((a, b) => {
        // Show ful day events on top
        if (a.isFullDay && !b.isFullDay) return -1;
        if (!a.isFullDay && b.isFullDay) return 1;

        // Sort for time to be displayed
        if (!a.isFullDay && !b.isFullDay) {
          const timeA = a.start_time || '00:00';
          const timeB = b.start_time || '00:00';
          return timeA.localeCompare(timeB);
        }

        // Sort after title when there are mltiple full day events
        return a.title.localeCompare(b.title);
      });

  // Header titles
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
    <Card key={`time-view-${refreshKey}`} className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
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

      <div className="max-h-[600px] overflow-y-auto">
        {timeSlots.map((time, timeIndex) => (
          <div key={time} className={`grid ${viewType === 'day' ? 'grid-cols-2' : 'grid-cols-8'} border-b border-gray-100 hover:bg-gray-50`}>
            {/* Time column*/}
            <div className="p-3 text-xs text-gray-500 border-r border-gray-200 bg-gray-50 flex items-start w-20 flex-shrink-0">
              {time}
            </div>

            {/* day column */}
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

                    // Check if event is on multiple days
                    const eventStartDate = new Date(event.startDate);
                    const eventEndDate = new Date(event.endDate);
                    const isMultiDay = !isSameDay(eventStartDate, eventEndDate);

                    return (
                      <div
                        key={event.id}
                        className={`absolute left-1 right-1 rounded text-xs p-2 overflow-hidden z-10 cursor-pointer hover:opacity-80 transition-opacity
                          ${event.type === 'learning session' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}
                          ${event.isFullDay ? 'font-medium' : ''}
                        `}
                        style={{
                          height: `${height}px`,
                          top: `${topOffset}px`
                        }}
                        onClick={(e) => handleEventClick(event, e)}
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

  // Month view
  const renderMonthView = () => {
    const calendarDays = generateCalendarDays();
    const selectedDayEvents = getDayEvents(selectedDate);

    return (
      <div key={`month-view-${refreshKey}`} className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80
                              ${event.type === 'learning session' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                            `}
                            onClick={(e) => handleEventClick(event, e)}
                          >
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

        <Card className="bg-white border border-gray-300 rounded-2xl flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
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
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border-l-4 cursor-pointer hover:opacity-80 transition-opacity
                        ${event.type === 'learning session' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'}
                      `}
                      onClick={(e) => handleEventClick(event, e)}
                    >
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
          <div className="p-4 border-t border-gray-200 space-y-3 flex-shrink-0">
            <Button className="w-full bg-[#002366] hover:bg-[#001a4d] text-white" onClick={() => setIsEventPopupOpen(true)}>
              <Plus size={16} className="mr-2" /> Add Event
            </Button>

            {/* Import calendar button for monthly view */}
            <input
              type="file"
              accept=".ics"
              id="calendar-import-monthly"
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
                  await fetch("https://study-planner-online-275553834411.europe-west3.run.app/api/events/import", {
                    method: "POST",
                    body: formData
                  });
                  await handleEventCreated();
                } catch (error) {
                  console.error("Failed import:", error);
                }
              }}
            />
            <label htmlFor="calendar-import-monthly" className="w-full">
              <Button
                className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                asChild
              >
                <div className="flex items-center justify-center">
                  <span className="mr-2">📥</span> Import Calendar
                </div>
              </Button>
            </label>
          </div>
        </Card>
      </div>
    );
  };

  // Layout
  // Due to complex design, the calendar design was made with help of AI (claude.ai)
  return (
    <div className="flex h-screen font-sans bg-[#f2f3f7]">
      <AppSideBar
        activePage={activePage}
        onPageChange={handlePageChange}
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

            <Button
              onClick={handleReschedule}
              className="bg-[#002366] text-white hover:bg-[#001a4d]"
              disabled={isRescheduling}
            >
              {isRescheduling ? 'Rescheduling...' : 'Reschedule'}
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

        {/* Add event button for day/week views */}
        {viewType !== 'month' && (
          <div className="fixed bottom-8 right-8 flex flex-col items-end space-y-3">
            {/* Add event button */}
            <Button
              className="bg-[#002366] hover:bg-[#001a4d] text-white rounded-full w-14 h-14 shadow-lg"
              onClick={() => setIsEventPopupOpen(true)}
            >
              <Plus size={24} />
            </Button>

            {/* Import calendar button */}
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
                  await fetch("https://study-planner-online-275553834411.europe-west3.run.app/api/events/import", {
                    method: "POST",
                    body: formData
                  });
                  await handleEventCreated();
                } catch (error) {
                  console.error("Failed import:", error);
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

      {/* Loading overlay */}
      <LoadingOverlay
        isVisible={isRescheduling}
        message="Optimizing your study schedule..."
      />

      <EventPopup
        open={isEventPopupOpen}
        onOpenChange={setIsEventPopupOpen}
        onEventCreated={handleEventCreated}
      />
      <ModulePopup
        open={isModulePopupOpen}
        onOpenChange={setIsModulePopupOpen}
        onModuleCreated={handleEventCreated}
      />
      <EditEventPopup
        open={isEditEventPopupOpen}
        onOpenChange={setIsEditEventPopupOpen}
        onEventUpdated={handleEventUpdated}
        event={selectedEvent}
      />
    </div>
  );
};

// Needed fields/columns for an event
interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  start_time: string;
  end_time: string;
  type: "imported" | "learning session";
  isFullDay: boolean;
}

export default CalendarView;