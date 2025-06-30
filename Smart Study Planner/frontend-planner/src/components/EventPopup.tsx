// All imports incl. https://ui.shadcn.com
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, CheckSquare } from "lucide-react";


//All props it needs
interface EventPopupProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEventCreated?: () => void;
}

//
const EventPopup: React.FC<EventPopupProps> = ({ open, onOpenChange, onEventCreated }) => {
    const [title, setTitle] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [isFullDay, setIsFullDay] = useState(false);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // Initial values
    useEffect(() => {
        if (open) {
            const today = new Date().toISOString().split('T')[0];
            setStartDate(today);
            setEndDate(today);
            setStartTime("09:00");
            setEndTime("10:00");
            setIsFullDay(false);
            setFormErrors({});
        }
    }, [open]);

    // Adjust end time when the start time changes
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

    // Adjust the end date when the start date changes
    useEffect(() => {
        if (startDate && (!endDate || new Date(endDate) < new Date(startDate))) {
            setEndDate(startDate);
        }
    }, [startDate]);

    // Validation of  user input
    const validateForm = () => {
        const errors: { [key: string]: string } = {};

        if (!title.trim()) {
            errors.title = "Please enter a title";
        }

        if (!startDate) {
            errors.startDate = "Please choose a start date.";
        }

        if (!endDate) {
            errors.endDate = "Please choose an end date";
        }

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            errors.dateRange = "The start date has to be before the end date!";
        }

        if (!isFullDay) {
            if (!startTime) {
                errors.startTime = "Please choose a start time";
            }

            if (!endTime) {
                errors.endTime = "Please choose an end time";
            }

            // Check times only for single-day events
            if (startDate && endDate && startDate === endDate && startTime && endTime) {
                const [startHour, startMinute] = startTime.split(':').map(Number);
                const [endHour, endMinute] = endTime.split(':').map(Number);

                if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
                    errors.timeRange = "The start time hast to be before the end time!";
                }
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateEvent = () => {

        // show error message when one validation check is false

        if (!validateForm()) {
            const errorMessage = Object.values(formErrors).join("\n");
            alert(errorMessage || "Please fill in all fields correctly");
            return;
        }

        // get user-ID from local storage
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            alert("Log in again!");
            return;
        }

        const user = JSON.parse(storedUser);

        // Check if user-ID is known
        const userId = user.userId || user.id;
        if (!userId) {
            alert("No valid user-ID");
            return;
        }

        // Fields of a newEvent
        const newEvent = {
            title: title.trim(),
            startDate: startDate,
            endDate: endDate,
            startTime: isFullDay ? null : startTime,
            endTime: isFullDay ? null : endTime,
            isFullDay: isFullDay,
            user: {
                userId: userId
            }
        };

        // Create event with API-call
        fetch("https://study-planner-online-275553834411.europe-west3.run.app/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newEvent)
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        try {
                            const json = JSON.parse(text);
                            throw new Error(json.error || text || `Server-Error: ${response.status}`);
                        } catch (e) {
                            throw new Error(text || `Server-Error: ${response.status}`);
                        }
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log("Event created successfully", data);
                setTitle("");
                setStartDate("");
                setEndDate("");
                setStartTime("");
                setEndTime("");
                onOpenChange(false);
                if (onEventCreated) onEventCreated();
            })
            .catch(error => {
                console.error("Error while creating event:", error);
                alert(error.message);
            });
    };

    //Layout of popup
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

                            {!isFullDay && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                className={`w-full pl-10 py-2 border rounded-md ${formErrors.startTime ? "border-red-500" : "border-gray-300"}`}
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
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
                                                onChange={(e) => setEndTime(e.target.value)}
                                            />
                                            <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                            {formErrors.endTime && <p className="text-xs text-red-500 mt-1">{formErrors.endTime}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {formErrors.timeRange && (
                                <p className="text-xs text-red-500">{formErrors.timeRange}</p>
                            )}


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


                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default EventPopup;