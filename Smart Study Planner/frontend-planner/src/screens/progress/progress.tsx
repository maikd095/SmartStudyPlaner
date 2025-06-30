// All imports

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, BookOpen, Calendar, Clock, Edit } from "lucide-react";
import AppSideBar, { SidebarPage } from "@/components/ui/SideBar";
import EditModulePopup from "@/components/EditModulePopup";
import type { AppPage } from "../MainContainer";

interface ProgressProps {
    onLogout: () => void;
    onPageChange: (page: AppPage) => void;
}

// All needed fields for an event

interface EventItem {
    id: number;
    title: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    type: string;
    isFullDay: boolean;
    sessionUsed?: number | null;
}
// All needed fields for a module

interface ModuleItem {
    id: number;
    name: string;
    hoursRequired: number;
    deadline: string;
    ects: number;
    alreadyStudied: number;
    difficulty: string;
}

// Initialize

const Progress: React.FC<ProgressProps> = ({ onLogout, onPageChange }) => {
    const [activePage, setActivePage] = useState<SidebarPage>("progress");
    const [completedLearningSessions, setCompletedLearningSessions] = useState<EventItem[]>([]);
    const [modules, setModules] = useState<ModuleItem[]>([]);
    const [editModulePopupOpen, setEditModulePopupOpen] = useState<boolean>(false);
    const [selectedModule, setSelectedModule] = useState<ModuleItem | null>(null);

    const handlePageChange = (page: SidebarPage) => {
        setActivePage(page);
        onPageChange(page as AppPage);
    };

    const handleEditModule = (module: ModuleItem) => {
        setSelectedModule(module);
        setEditModulePopupOpen(true);
    };

    const handleModuleUpdated = () => {
        // Refresh modules after update
        fetchModules();
    };

    // Call API for completion of a session

    const handleSessionCompletion = async (sessionId: number, completed: boolean) => {
        try {
            const completionValue = completed ? 1 : 0;

            const response = await fetch(`https://study-planner-online-275553834411.europe-west3.run.app/api/events/${sessionId}/completion?completed=${completionValue}`, {

                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {

                setCompletedLearningSessions(prev =>
                    prev.map(session =>
                        session.id === sessionId
                            ? { ...session, sessionUsed: completionValue }
                            : session
                    )
                );

                // Refresh modules to show updated study time
                fetchModules();


            } else {
                console.error('Failed to update session completion');
            }
        } catch (error) {
            console.error('Error updating session completion:', error);
        }
    };
    // Calculate days for the deadline

    const getDaysUntilDeadline = (deadline: string): number => {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const timeDiff = deadlineDate.getTime() - today.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    };

    //colours for difficulty

    const getDifficultyColor = (difficulty: string): string => {
        switch (difficulty.toLowerCase()) {
            case 'easy':
                return 'bg-green-100 text-green-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'hard':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Fetch modules from API
    const fetchModules = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const response = await fetch(`https://study-planner-online-275553834411.europe-west3.run.app/api/module?userId=${user.id}`);

            if (response.ok) {
                const data = await response.json();
                setModules(data);
            } else {
                console.error('Failed to fetch modules');
            }
        } catch (error) {
            console.error("Error fetching modules:", error);
        }
    };

    // Fetch events from API
    const fetchEvents = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const response = await fetch(`https://study-planner-online-275553834411.europe-west3.run.app/api/events?userId=${user.id}`);

            const data = await response.json();

            // Filter for completed learning sessions
            const now = new Date();
            const completedSessions = data
                .filter((event: EventItem) => {
                    const eventDateTime = new Date(`${event.startDate}T${event.startTime}`);
                    return event.type === "learning session" && eventDateTime < now && event.sessionUsed == null;
                })
                .sort((a: EventItem, b: EventItem) => {
                    const aDate = new Date(`${a.startDate}T${a.startTime}`);
                    const bDate = new Date(`${b.startDate}T${b.startTime}`);
                    return bDate.getTime() - aDate.getTime();
                })
                .map((session: EventItem) => ({
                    ...session,
                    sessionUsed: session.sessionUsed || null

                }));

            setCompletedLearningSessions(completedSessions);
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    };

    useEffect(() => {
        fetchModules();
        fetchEvents();
    }, []);

    //Layout

    return (
        <div className="flex h-screen font-sans bg-[#f2f3f7]">
            <AppSideBar
                activePage={activePage}
                onPageChange={handlePageChange}
                onLogout={onLogout}
            />

            <div className="flex-1 bg-[#f2f3f7] p-8 overflow-y-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-[#002366] mb-2">Progress</h2>

                        </div>
                    </div>
                </div>

                {/* Modules Overview */}
                <Card className="bg-white border border-gray-300 rounded-2xl mb-6">
                    <CardContent className="p-0">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-[#002366] flex items-center">
                                <BookOpen className="w-5 h-5 mr-2" />
                                Your Modules
                            </h3>
                            <p className="text-gray-600 text-sm">Overview of all your study modules</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left p-4 font-semibold text-gray-700">Module Name</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">ECTS</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Hours Required</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Already Studied</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Progress</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Deadline</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Days Left</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Difficulty</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modules.map((module, index) => {
                                        const progressPercentage = module.hoursRequired > 0
                                            ? Math.round((module.alreadyStudied / module.hoursRequired) * 100)
                                            : 0;
                                        const daysLeft = getDaysUntilDeadline(module.deadline);
                                        const isOverdue = daysLeft < 0;
                                        const isUrgent = daysLeft <= 7 && daysLeft >= 0;

                                        return (
                                            <tr
                                                key={module.id}
                                                className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
                                            >
                                                <td className="p-4">
                                                    <span className="font-medium text-gray-900">{module.name}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {module.ects} ECTS
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center text-gray-700">
                                                        <Clock className="w-4 h-4 mr-1" />
                                                        {module.hoursRequired}h
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-gray-700">{module.alreadyStudied}h</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-20 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-[#002366] h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {progressPercentage}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center text-gray-700">
                                                        <Calendar className="w-4 h-4 mr-1" />
                                                        {new Date(module.deadline).toLocaleDateString("de-DE")}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isOverdue
                                                        ? 'bg-red-100 text-red-800'
                                                        : isUrgent
                                                            ? 'bg-orange-100 text-orange-800'
                                                            : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days`}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                                                        {module.difficulty}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => handleEditModule(module)}
                                                        className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-[#002366] hover:text-white transition-all duration-200"
                                                        title="Edit module"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Empty state if no modules */}
                        {modules.length === 0 && (
                            <div className="p-8 text-center">
                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No modules found</p>
                                <p className="text-gray-400 text-sm">Add your study modules to track your progress</p>

                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Completed Learning Sessions Table */}
                <Card className="bg-white border border-gray-300 rounded-2xl">
                    <CardContent className="p-0">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-[#002366]">Completed Learning Sessions</h3>
                            <p className="text-gray-600 text-sm">Your past learning session history</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left p-4 font-semibold text-gray-700">Session Title</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Start Time</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">End Time</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Duration</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Completed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {completedLearningSessions.map((session, index) => {
                                        const startDateTime = new Date(`${session.startDate}T${session.startTime}`);
                                        const endDateTime = new Date(`${session.endDate}T${session.endTime}`);
                                        const duration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)); // Duration in minutes

                                        return (
                                            <tr
                                                key={session.id}
                                                className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
                                            >
                                                <td className="p-4">
                                                    <span className="font-medium text-gray-900">{session.title}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-gray-700">
                                                        {startDateTime.toLocaleDateString("de-DE")}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-gray-700">
                                                        {startDateTime.toLocaleTimeString("de-DE", {
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-gray-700">
                                                        {endDateTime.toLocaleTimeString("de-DE", {
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-gray-700">
                                                        {Math.floor(duration / 60)}h {duration % 60}m
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => handleSessionCompletion(session.id, true)}
                                                            className={`p-2 rounded-full transition-all duration-200 ${session.sessionUsed === 1
                                                                ? 'bg-green-100 text-green-600 ring-2 ring-green-500'
                                                                : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500'
                                                                }`}
                                                            title="Session completed"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSessionCompletion(session.id, false)}
                                                            className={`p-2 rounded-full transition-all duration-200 ${session.sessionUsed === 0
                                                                ? 'bg-red-100 text-red-600 ring-2 ring-red-500'
                                                                : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                                                                }`}
                                                            title="Session not completed"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Empty if no completed sessions */}

                        {completedLearningSessions.length === 0 && (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">📚</span>
                                </div>
                                <p className="text-gray-500 text-lg">No completed learning sessions</p>
                                <p className="text-gray-400 text-sm">Your completed learning sessions will appear here</p>

                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit Module Popup */}
            <EditModulePopup
                open={editModulePopupOpen}
                onOpenChange={setEditModulePopupOpen}
                onModuleUpdated={handleModuleUpdated}
                module={selectedModule}
            />
        </div>
    );
};

export default Progress;