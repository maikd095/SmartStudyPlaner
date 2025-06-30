// All imports incl. https://ui.shadcn.com
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Clock, Calendar, Trash2 } from "lucide-react";

// Define neccessary columns/fields for an event of the backend
interface CalendarEvent {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    start_time: string;
    end_time: string;
    isFullDay: boolean;
}

// props that the EditEventPopup expects to receive
interface EditEventPopupProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEventUpdated?: () => void;
    event: CalendarEvent | null;
}


const EditEventPopup: React.FC<EditEventPopupProps> = ({
    open,
    onOpenChange,
    onEventUpdated,
    event
}) => {
    //Initialite constants
    const [title, setTitle] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [isFullDay, setIsFullDay] = useState(false);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // Standard values in form when event changes orpopup opens
    useEffect(() => {
        if (open && event) {
            setTitle(event.title);
            setStartDate(event.startDate);
            setEndDate(event.endDate);
            setStartTime(event.start_time || "09:00");
            setEndTime(event.end_time || "10:00");
            setIsFullDay(event.isFullDay);
            setFormErrors({});
        }
    }, [open, event]);

    // Adjust end time when the start time changes
    useEffect(() => {
        if (startTime && !isFullDay) {
            const [hours, minutes] = startTime.split(':').map(Number);
            const endHours = hours + 1;
            const endTimeStr = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            if (endHours < 24) {
                setEndTime(endTimeStr);
            }
        }
    }, [startTime, isFullDay]);

    // Adjust the end date when the start date changes
    useEffect(() => {
        if (startDate && (!endDate || new Date(endDate) < new Date(startDate))) {
            setEndDate(startDate);
        }
    }, [startDate]);

    //  Validation of  user input
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


    const handleUpdateEvent = () => {
        if (!event) return;

        // show error message when one validation check is false
        if (!validateForm()) {
            const errorMessage = Object.values(formErrors).join("\n");
            alert(errorMessage || "Please fill in all fields correctly");
            return;
        }

        // Define neccessary columns/fields for an updateEvent of the backend
        const updatedEvent = {
            title: title.trim(),
            startDate: startDate,
            endDate: endDate,
            startTime: isFullDay ? null : startTime,
            endTime: isFullDay ? null : endTime,
            isFullDay: isFullDay
        };

        console.log("Sending updated event to backend:", updatedEvent);

        //Send All information through API
        fetch(`https://study-planner-online-275553834411.europe-west3.run.app/api/events/${event.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedEvent)
        })
            .then(response => {
                // IF error;
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
            // If everything is correct
            .then(data => {
                console.log("Event updated sucessfully:", data);
                onOpenChange(false);
                if (onEventUpdated) onEventUpdated();
            })
            .catch(error => {
                console.error("Error while updating event:", error);
                alert(error.message);
            });
    };

    // Delete Event through API-call
    const handleDeleteEvent = () => {
        if (!event) return;

        const confirmDelete = window.confirm(`Are you sure you want to delete the event: "${event.title}"`);
        if (!confirmDelete) return;

        console.log("Deleting event:", event.id);

        fetch(`https://study-planner-online-275553834411.europe-west3.run.app/api/events/${event.id}`, {
            method: "DELETE"
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(text || `Server-Error: ${response.status}`);
                    });
                }
                return response.text();
            })
            .then(() => {
                console.log("Event deleted successfully");
                onOpenChange(false);
                if (onEventUpdated) onEventUpdated();
            })
            .catch(error => {
                console.error("Error while deleting event:", error);
                alert(error.message);
            });
    };

    if (!event) return null;


    // Layout of popup
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white w-full max-w-md p-0 rounded-xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-gray-900">Edit Event</DialogTitle>
                </DialogHeader>

                <div className="px-6 pb-6">
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
                                        className={`w-full pl-10 py-2 border rounded-md ${formErrors.startDate ? "border-red-500" : "border-gray-300"}`}
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                    <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                    {formErrors.startDate && <p className="text-xs text-red-500 mt-1">{formErrors.startDate}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        className={`w-full pl-10 py-2 border rounded-md ${formErrors.endDate ? "border-red-500" : "border-gray-300"}`}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                    <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                    {formErrors.endDate && <p className="text-xs text-red-500 mt-1">{formErrors.endDate}</p>}
                                </div>
                            </div>
                        </div>

                        {formErrors.dateRange && (
                            <p className="text-xs text-red-500">{formErrors.dateRange}</p>
                        )}

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


                        <div className="flex justify-between items-center pt-4">
                            <Button
                                variant="destructive"
                                onClick={handleDeleteEvent}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Delete
                            </Button>

                            <div className="flex space-x-2">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-[#002366] hover:bg-[#001a4d] text-white"
                                    onClick={handleUpdateEvent}
                                >
                                    Update Event
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditEventPopup;