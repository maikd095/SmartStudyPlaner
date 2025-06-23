import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, CheckSquare, ListTodo } from "lucide-react";

interface EventPopupProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEventCreated?: () => void;
}

const EventPopup: React.FC<EventPopupProps> = ({ open, onOpenChange, onEventCreated }) => {
    const [title, setTitle] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [eventType, setEventType] = useState("study");
    const [isFullDay, setIsFullDay] = useState(false);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // Standardwerte beim Öffnen
    useEffect(() => {
        if (open) {
            // Aktuelles Datum als Standardwert
            const today = new Date().toISOString().split('T')[0];
            setStartDate(today);
            setEndDate(today);
            setStartTime("09:00");
            setEndTime("10:00");
            setIsFullDay(false);
            setFormErrors({});
        }
    }, [open]);

    // Endzeit automatisch anpassen wenn Startzeit geändert wird
    useEffect(() => {
        if (startTime) {
            const [hours, minutes] = startTime.split(':').map(Number);
            const endHours = hours + 1;
            const endTimeStr = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            if (endHours < 24) {
                setEndTime(endTimeStr);
            }
        }
    }, [startTime]);

    // Enddatum automatisch anpassen wenn Startdatum geändert wird
    useEffect(() => {
        if (startDate && (!endDate || new Date(endDate) < new Date(startDate))) {
            setEndDate(startDate);
        }
    }, [startDate]);

    // Validierung der Eingaben
    const validateForm = () => {
        const errors: { [key: string]: string } = {};

        if (!title.trim()) {
            errors.title = "Bitte geben Sie einen Titel ein.";
        }

        if (!startDate) {
            errors.startDate = "Bitte wählen Sie ein Startdatum.";
        }

        if (!endDate) {
            errors.endDate = "Bitte wählen Sie ein Enddatum.";
        }

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            errors.dateRange = "Das Startdatum muss vor oder am Enddatum liegen.";
        }

        if (!isFullDay) {
            if (!startTime) {
                errors.startTime = "Bitte wählen Sie eine Startzeit.";
            }

            if (!endTime) {
                errors.endTime = "Bitte wählen Sie eine Endzeit.";
            }

            // Überprüfung der Zeiten nur wenn es ein eintägiges Event ist
            if (startDate && endDate && startDate === endDate && startTime && endTime) {
                const [startHour, startMinute] = startTime.split(':').map(Number);
                const [endHour, endMinute] = endTime.split(':').map(Number);

                if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
                    errors.timeRange = "Die Startzeit muss vor der Endzeit liegen.";
                }
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateEvent = () => {
        console.log("Aktuelle Formularwerte:", { title, startDate, endDate, startTime, endTime, eventType, isFullDay });

        if (!validateForm()) {
            const errorMessage = Object.values(formErrors).join("\n");
            alert(errorMessage || "Bitte füllen Sie alle Felder korrekt aus.");
            return;
        }

        // Nutzer-ID aus dem localStorage holen
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            alert("Fehlende Nutzerinformationen. Bitte erneut einloggen.");
            return;
        }

        const user = JSON.parse(storedUser);

        // Prüfe ob userId vorhanden ist
        const userId = user.userId || user.id;
        if (!userId) {
            alert("Keine gültige User-ID gefunden. Bitte erneut einloggen.");
            return;
        }

        const newEvent = {
            title: title.trim(),
            startDate: startDate,
            endDate: endDate,
            startTime: isFullDay ? null : startTime,
            endTime: isFullDay ? null : endTime,
            type: eventType,
            isFullDay: isFullDay,
            user: {
                userId: userId  // <- Korrigiert: userId statt id
            }
        };

        console.log("Sende Event an Backend:", newEvent);

        fetch("http://localhost:8080/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newEvent)
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        try {
                            const json = JSON.parse(text);
                            throw new Error(json.error || text || `Server-Fehler: ${response.status}`);
                        } catch (e) {
                            throw new Error(text || `Server-Fehler: ${response.status}`);
                        }
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log("Event erfolgreich erstellt:", data);
                setTitle("");
                setStartDate("");
                setEndDate("");
                setStartTime("");
                setEndTime("");
                setEventType("study");
                onOpenChange(false);
                if (onEventCreated) onEventCreated();
            })
            .catch(error => {
                console.error("Fehler beim Erstellen des Events:", error);
                alert(error.message);
            });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white w-full max-w-md p-0 rounded-xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-gray-900">Add Event</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="event" className="w-full">
                    <TabsList className="grid grid-cols-2 mb-4 mx-6">
                        <TabsTrigger value="event" className="flex items-center justify-center space-x-2">
                            <CheckSquare size={16} />
                            <span>Calendar Event</span>
                        </TabsTrigger>
                        <TabsTrigger value="todo" className="flex items-center justify-center space-x-2">
                            <ListTodo size={16} />
                            <span>To-Do</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="event" className="px-6 pb-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                                <Input
                                    placeholder="Enter event title"
                                    className={`w-full border-gray-300 ${formErrors.title ? "border-red-500" : ""}`}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                                {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className={`w-full pl-10 py-2 border rounded-md ${formErrors.date ? "border-red-500" : "border-gray-300"}`}
                                            value={startDate}
                                            onChange={(e) => {
                                                console.log("Date selected:", e.target.value);
                                                setStartDate(e.target.value);
                                            }}
                                        />
                                        <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                        {formErrors.date && <p className="text-xs text-red-500 mt-1">{formErrors.date}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className={`w-full pl-10 py-2 border rounded-md ${formErrors.date ? "border-red-500" : "border-gray-300"}`}
                                            value={endDate}
                                            onChange={(e) => {
                                                console.log("Date selected:", e.target.value);
                                                setEndDate(e.target.value);
                                            }}
                                        />
                                        <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                        {formErrors.date && <p className="text-xs text-red-500 mt-1">{formErrors.date}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="fullDay"
                                    checked={isFullDay}
                                    onChange={(e) => setIsFullDay(e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <label htmlFor="fullDay" className="text-sm font-medium text-gray-700">
                                    All Day
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            className={`w-full pl-10 py-2 border rounded-md ${formErrors.startTime ? "border-red-500" : "border-gray-300"}`}
                                            value={startTime}
                                            onChange={(e) => {
                                                console.log("Start time:", e.target.value);
                                                setStartTime(e.target.value);
                                            }}
                                        />
                                        <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                        {formErrors.startTime && <p className="text-xs text-red-500 mt-1">{formErrors.startTime}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            className={`w-full pl-10 py-2 border rounded-md ${formErrors.endTime ? "border-red-500" : "border-gray-300"}`}
                                            value={endTime}
                                            onChange={(e) => {
                                                console.log("End time:", e.target.value);
                                                setEndTime(e.target.value);
                                            }}
                                        />
                                        <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                        {formErrors.endTime && <p className="text-xs text-red-500 mt-1">{formErrors.endTime}</p>}
                                    </div>
                                </div>
                            </div>
                            {formErrors.timeRange && (
                                <p className="text-xs text-red-500">{formErrors.timeRange}</p>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                                <Select onValueChange={setEventType} value={eventType}>
                                    <SelectTrigger className="w-full border-gray-300 bg-white">
                                        <SelectValue placeholder="Select event type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="study">Study</SelectItem>
                                        <SelectItem value="meeting">Meeting</SelectItem>
                                        <SelectItem value="deadline">Deadline</SelectItem>
                                        <SelectItem value="learning session">Learning Session</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button className="bg-[#002366] hover:bg-[#001a4d] text-white" onClick={handleCreateEvent}>
                                    Create Event
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="todo" className="px-6 pb-6">
                        <p className="text-sm text-gray-500">To-Do functionality coming soon.</p>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default EventPopup;