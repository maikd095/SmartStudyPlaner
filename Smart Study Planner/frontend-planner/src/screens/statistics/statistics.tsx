// All imports incl. https://ui.shadcn.com
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, TrendingUp, Target, Star, Zap, AlertCircle, Calendar, BookOpen, BarChart3, Award } from "lucide-react";
import AppSideBar, { SidebarPage } from "@/components/ui/SideBar";
import type { AppPage } from "../MainContainer";

interface StatisticsProps {
    onLogout: () => void;
    onPageChange: (page: AppPage) => void;
}

// All needed fields for a module
interface Module {
    id: number;
    name: string;
    hoursRequired: number;
    alreadyStudied: number;
    deadline: string;
    ects: number;
    difficulty: string;
}

// All needed fields for an event
interface Event {
    id: number;
    title: string;
    type: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    isFullDay: boolean;
    sessionUsed: number | null;
}

// needed values for statisics page
interface StudyStats {
    averageStudyTime: string;
    averageSessionDuration: string;
    totalStudyHours: number;
    completedSessions: number;
    totalSessions: number;
    subjectData: Array<{
        name: string;
        hours: number;
        required: number;
        progress: number;
        color: string;
    }>;
    weeklyData: Array<{
        day: string;
        hours: number;
    }>;
    trends: {
        weekendProductivity: number;
        mostProductiveDay: string;
        currentStreak: number;
        completionRate: number;
        totalEcts: number;
        completedEcts: number;
    };
    monthlyData: Array<{
        month: string;
        hours: number;
    }>;
}

// Set initial values
const Statistics: React.FC<StatisticsProps> = ({ onLogout, onPageChange }) => {
    const [activePage, setActivePage] = useState<SidebarPage>("statistics");
    const [studyData, setStudyData] = useState<StudyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handlePageChange = (page: SidebarPage) => {
        setActivePage(page);
        onPageChange(page as AppPage);
    };

    // Fetch events and modules through API
    const fetchData = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            if (!user.id) {
                throw new Error('User not found');
            }

            // Fetch modules and events
            const [modulesResponse, eventsResponse] = await Promise.all([
                fetch(`https://study-planner-online-275553834411.europe-west3.run.app/api/module?userId=${user.id}`),
                fetch(`https://study-planner-online-275553834411.europe-west3.run.app/api/events?userId=${user.id}`)
            ]);

            if (!modulesResponse.ok || !eventsResponse.ok) {
                throw new Error('Failed to fetch data');
            }

            const modules: Module[] = await modulesResponse.json();
            const events: Event[] = await eventsResponse.json();

            // Process the data to generate statistics
            const processedStats = processStatistics(modules, events);
            setStudyData(processedStats);
            setError(null);
        } catch (err) {
            setError('Failed to load statistics data');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const processStatistics = (modules: Module[], events: Event[]): StudyStats => {
        // Filter study sessions
        const studySessions = events.filter(event =>
            event.type === 'learning session' ||
            event.type === 'study' ||
            event.type === 'learning' ||
            modules.some(module => event.title.toLowerCase().includes(module.name.toLowerCase()))
        );

        // Calculate total study hours from modules
        const totalStudyHours = modules.reduce((sum, module) => sum + module.alreadyStudied, 0);

        // Calculate session statistics
        const completedSessions = studySessions.filter(session => session.sessionUsed === 1).length;
        const totalSessions = studySessions.length;

        // Calculate average session duration
        const sessionsWithTime = studySessions.filter(session =>
            session.startTime && session.endTime && !session.isFullDay
        );

        let totalSessionMinutes = 0;
        sessionsWithTime.forEach(session => {
            const start = new Date(`2000-01-01T${session.startTime}`);
            const end = new Date(`2000-01-01T${session.endTime}`);
            const duration = (end.getTime() - start.getTime()) / (1000 * 60);
            if (duration > 0) {
                totalSessionMinutes += duration;
            }
        });

        const averageSessionMinutes = sessionsWithTime.length > 0 ?
            Math.round(totalSessionMinutes / sessionsWithTime.length) : 0;

        // Calculate weekly data (last 7 days)
        const weeklyData = calculateWeeklyData(studySessions);

        // Calculate monthly data (last 6 months)
        const monthlyData = calculateMonthlyData(studySessions);

        // Calculate subject data from modules
        const colors = ['#002366', '#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];
        const subjectData = modules.map((module, index) => ({
            name: module.name,
            hours: module.alreadyStudied,
            required: module.hoursRequired,
            progress: module.hoursRequired > 0 ? (module.alreadyStudied / module.hoursRequired) * 100 : 0,
            color: colors[index % colors.length]
        }));

        // Calculate trends
        const trends = calculateTrends(studySessions, weeklyData, modules);

        // Calculate average daily study time
        const daysWithStudy = weeklyData.filter(day => day.hours > 0).length;
        const averageDailyHours = daysWithStudy > 0 ?
            weeklyData.reduce((sum, day) => sum + day.hours, 0) / 7 : 0;

        return {
            averageStudyTime: formatHours(averageDailyHours),
            averageSessionDuration: formatMinutes(averageSessionMinutes),
            totalStudyHours,
            completedSessions,
            totalSessions,
            subjectData,
            weeklyData,
            monthlyData,
            trends: {
                ...trends,
                completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
            }
        };
    };

    const calculateWeeklyData = (sessions: Event[]) => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weeklyHours = new Array(7).fill(0);

        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

        sessions.forEach(session => {
            if (session.sessionUsed !== 1) return; // Only count completed sessions

            const sessionDate = new Date(session.startDate);
            const daysDiff = Math.floor((sessionDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff >= 0 && daysDiff < 7 && session.startTime && session.endTime) {
                const start = new Date(`2000-01-01T${session.startTime}`);
                const end = new Date(`2000-01-01T${session.endTime}`);
                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                if (hours > 0) {
                    weeklyHours[daysDiff] += hours;
                }
            }
        });

        return days.map((day, index) => ({
            day,
            hours: Math.round(weeklyHours[index] * 10) / 10
        }));
    };

    // bar chart for study sessions per month
    const calculateMonthlyData = (sessions: Event[]) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyHours = new Array(12).fill(0);

        const today = new Date();

        sessions.forEach(session => {
            if (session.sessionUsed !== 1) return; // Only count completed sessions

            const sessionDate = new Date(session.startDate);
            const monthsDiff = (today.getFullYear() - sessionDate.getFullYear()) * 12 +
                (today.getMonth() - sessionDate.getMonth());

            if (monthsDiff >= 0 && monthsDiff < 6 && session.startTime && session.endTime) {
                const start = new Date(`2000-01-01T${session.startTime}`);
                const end = new Date(`2000-01-01T${session.endTime}`);
                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                if (hours > 0) {
                    monthlyHours[5 - monthsDiff] += hours;
                }
            }
        });

        return months.map((month, index) => ({
            month,
            hours: Math.round(monthlyHours[index] * 10) / 10
        }));
    };

    const calculateTrends = (sessions: Event[], weeklyData: any[], modules: Module[]) => {
        // Weekend productivity (Sat + Sun vs weekdays)
        const weekendHours = weeklyData[5].hours + weeklyData[6].hours; // Sat + Sun
        const weekdayHours = weeklyData.slice(0, 5).reduce((sum, day) => sum + day.hours, 0);
        const weekendProductivity = weekdayHours > 0 ?
            Math.round(((weekendHours / 2) / (weekdayHours / 5) - 1) * 100) : 0;

        // Most productive day
        const maxHours = Math.max(...weeklyData.map(day => day.hours));
        const mostProductiveDay = weeklyData.find(day => day.hours === maxHours)?.day || 'Monday';

        // Calculate current streak
        const currentStreak = calculateStudyStreak(sessions);

        // Calculate ECTS statistics
        const totalEcts = modules.reduce((sum, module) => sum + module.ects, 0);
        const completedEcts = modules.reduce((sum, module) => {
            const progress = module.hoursRequired > 0 ? module.alreadyStudied / module.hoursRequired : 0;
            return sum + (progress >= 1 ? module.ects : 0);
        }, 0);

        return {
            weekendProductivity: Math.max(0, weekendProductivity),
            mostProductiveDay,
            currentStreak,
            totalEcts,
            completedEcts
        };
    };

    const calculateStudyStreak = (sessions: Event[]): number => {
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);

        for (let i = 0; i < 30; i++) { // Check last 30 days
            const dateStr = currentDate.toISOString().split('T')[0];
            const hasStudyOnDay = sessions.some(session =>
                session.startDate === dateStr && session.sessionUsed === 1
            );

            if (hasStudyOnDay) {
                streak++;
            } else if (i > 0) { // Don't break on today if no study yet
                break;
            }

            currentDate.setDate(currentDate.getDate() - 1);
        }

        return streak;
    };

    const formatHours = (hours: number): string => {
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);
        return `${wholeHours}h ${minutes}m`;
    };

    const formatMinutes = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen font-sans bg-[#f2f3f7]">
                <AppSideBar
                    activePage={activePage}
                    onPageChange={handlePageChange}
                    onLogout={onLogout}
                />
                <div className="flex-1 bg-[#f2f3f7] p-8 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002366] mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading statistics...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen font-sans bg-[#f2f3f7]">
                <AppSideBar
                    activePage={activePage}
                    onPageChange={handlePageChange}
                    onLogout={onLogout}
                />
                <div className="flex-1 bg-[#f2f3f7] p-8 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={fetchData}
                            className="px-4 py-2 bg-[#002366] text-white rounded-lg hover:bg-[#003399] transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!studyData) return null;

    // Layout
    // The layout and design of the statistics page was done by help of AI (claude.ai)
    return (
        <div className="flex h-screen font-sans bg-[#f2f3f7]">
            <AppSideBar
                activePage={activePage}
                onPageChange={handlePageChange}
                onLogout={onLogout}
            />

            <div className="flex-1 bg-[#f2f3f7] p-8 overflow-y-auto">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-[#002366] mb-2">Statistics</h2>
                    <p className="text-gray-600">Understand Your Study Habits</p>
                </div>

                {/* Key Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Total Study Hours */}
                    <Card className="bg-white border border-gray-300 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-700">Total Study Hours</h3>
                                <Clock className="text-[#002366] w-5 h-5" />
                            </div>
                            <div className="text-2xl font-bold text-[#002366]">
                                {studyData.totalStudyHours}h
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Across all modules</p>
                        </CardContent>
                    </Card>

                    {/* Completion Rate */}
                    <Card className="bg-white border border-gray-300 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-700">Completion Rate</h3>
                                <Target className="text-[#002366] w-5 h-5" />
                            </div>
                            <div className="text-2xl font-bold text-green-600">
                                {studyData.trends.completionRate}%
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                {studyData.completedSessions} of {studyData.totalSessions} sessions
                            </p>
                        </CardContent>
                    </Card>

                    {/* Study Streak */}
                    <Card className="bg-white border border-gray-300 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-700">Study Streak</h3>
                                <Zap className="text-[#002366] w-5 h-5" />
                            </div>
                            <div className="text-2xl font-bold text-orange-600">
                                {studyData.trends.currentStreak} days
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Keep it up! 🔥</p>
                        </CardContent>
                    </Card>

                    {/* ECTS Progress */}
                    <Card className="bg-white border border-gray-300 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-700">ECTS Progress</h3>
                                <Award className="text-[#002366] w-5 h-5" />
                            </div>
                            <div className="text-2xl font-bold text-purple-600">
                                {studyData.trends.completedEcts}/{studyData.trends.totalEcts}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">ECTS completed</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Weekly Study Hours Chart */}
                    <Card className="bg-white border border-gray-300 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-gray-800">Weekly Study Hours</h3>
                                <BarChart3 className="text-[#002366] w-5 h-5" />
                            </div>
                            <div className="text-2xl font-bold text-[#002366] mb-4">
                                {studyData.averageStudyTime} / day
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end h-32 bg-gray-50 p-4 rounded-lg">
                                    {studyData.weeklyData.map((day) => {
                                        const maxHours = Math.max(...studyData.weeklyData.map(d => d.hours)) || 1;
                                        const height = (day.hours / maxHours) * 80;
                                        return (
                                            <div key={day.day} className="flex flex-col items-center">
                                                <div className="flex flex-col items-center justify-end h-20">
                                                    <span className="text-xs text-gray-600 mb-1">
                                                        {day.hours}h
                                                    </span>
                                                    <div
                                                        className="bg-[#002366] rounded-t w-6"
                                                        style={{ height: `${Math.max(4, height)}px` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-gray-500 mt-2">{day.day}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Monthly Progress Chart */}
                    <Card className="bg-white border border-gray-300 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-gray-800">Monthly Progress</h3>
                                <Calendar className="text-[#002366] w-5 h-5" />
                            </div>
                            <div className="text-lg text-gray-600 mb-4">
                                Last 6 months overview
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end h-32 bg-gray-50 p-4 rounded-lg">
                                    {studyData.monthlyData.map((month) => {
                                        const maxHours = Math.max(...studyData.monthlyData.map(m => m.hours)) || 1;
                                        const height = (month.hours / maxHours) * 80;
                                        return (
                                            <div key={month.month} className="flex flex-col items-center">
                                                <div className="flex flex-col items-center justify-end h-20">
                                                    <span className="text-xs text-gray-600 mb-1">
                                                        {month.hours}h
                                                    </span>
                                                    <div
                                                        className="bg-[#002366] rounded-t w-8"
                                                        style={{ height: `${Math.max(4, height)}px` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Study Progress by Module */}
                    <Card className="bg-white border border-gray-300 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-gray-800">Module Progress</h3>
                                <BookOpen className="text-[#002366] w-5 h-5" />
                            </div>

                            <div className="space-y-4">
                                {studyData.subjectData.slice(0, 5).map((subject) => (
                                    <div key={subject.name}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-700 truncate">
                                                {subject.name}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {subject.hours}h / {subject.required}h
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="h-3 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${Math.min(100, subject.progress)}%`,
                                                    backgroundColor: subject.color
                                                }}
                                            ></div>
                                            {subject.progress > 100 && (
                                                <div className="text-xs text-green-600 mt-1">
                                                    {Math.round(subject.progress)}% complete
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {studyData.subjectData.length === 0 && (
                                <div className="text-center py-8">
                                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No modules found</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Study Insights */}
                    <Card className="bg-white border border-gray-300 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-gray-800">Study Insights</h3>
                                <TrendingUp className="text-[#002366] w-5 h-5" />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            Average session: {studyData.averageSessionDuration}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Based on {studyData.totalSessions} sessions
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Star className="w-4 h-4 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            Most productive: {studyData.trends.mostProductiveDay}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Your best study day this week
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            Weekend productivity: {studyData.trends.weekendProductivity}%
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Compared to weekdays
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Zap className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            Current streak: {studyData.trends.currentStreak} days
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Keep the momentum going!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Statistics;