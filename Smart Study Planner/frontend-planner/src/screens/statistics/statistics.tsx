import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, TrendingUp, Target, Star, Zap } from "lucide-react";
import AppSideBar, { SidebarPage } from "@/components/ui/SideBar";
import type { AppPage } from "../MainContainer";

interface StatisticsProps {
    onLogout: () => void;
    onPageChange: (page: AppPage) => void;
}

const Statistics: React.FC<StatisticsProps> = ({ onLogout, onPageChange }) => {
    const [activePage, setActivePage] = useState<SidebarPage>("statistics");

    // Neue Funktion, die sowohl lokalen State als auch übergeordneten State aktualisiert
    const handlePageChange = (page: SidebarPage) => {
        setActivePage(page);
        onPageChange(page as AppPage);
    };

    // Mock data - in real app this would come from API
    const studyData = {
        averageStudyTime: "5 h 30 m",
        averageSessionDuration: "1 h 10 m",
        averageDeviation: "+ 5 m",
        subjectData: [
            { name: "Finance", hours: 8, color: "#002366" },
            { name: "Strategy", hours: 6, color: "#1e40af" },
            { name: "Macro", hours: 5, color: "#60a5fa" }
        ],
        weeklyData: [
            { day: "Mon", hours: 4 },
            { day: "Tue", hours: 6 },
            { day: "Wed", hours: 5 },
            { day: "Thu", hours: 7 },
            { day: "Fri", hours: 4 },
            { day: "Sat", hours: 3 },
            { day: "Sun", hours: 6 }
        ],
        trends: {
            weekendProductivity: 10,
            mostProductiveDay: "Wednesday",
            improvement: 8,
            currentStreak: 4
        }
    };

    const maxHours = Math.max(...studyData.subjectData.map(s => s.hours));

    return (
        <div className="flex h-screen font-sans bg-[#f2f3f7]">
            {/* Wiederverwendbare Sidebar-Komponente mit übergebenem onLogout-Handler */}
            <AppSideBar
                activePage={activePage}
                onPageChange={handlePageChange}
                userName="Max"
                onLogout={onLogout}
            />

            {/* Main Content */}
            <div className="flex-1 bg-[#f2f3f7] p-8 overflow-y-auto">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-[#002366] mb-2">Statistics</h2>
                    <p className="text-gray-600">Understand Your Study Habits</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                    {/* Average Study Time Card */}
                    <Card className="bg-white border border-gray-300 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-gray-800">Average Study Time / Day</h3>
                                <Clock className="text-[#002366] w-5 h-5" />
                            </div>
                            <div className="text-3xl font-bold text-[#002366] mb-4">
                                {studyData.averageStudyTime}
                            </div>

                            {/* Weekly Chart */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end h-16 bg-gray-50 p-3 rounded-lg">
                                    {studyData.weeklyData.map((day, index) => (
                                        <div key={day.day} className="flex flex-col items-center">
                                            <div
                                                className="bg-[#002366] rounded-t w-3 mb-1"
                                                style={{ height: `${(day.hours / 8) * 40}px` }}
                                            ></div>
                                            <span className="text-xs text-gray-500">{day.day}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Study Time by Subject */}
                    <Card className="bg-white border border-gray-300 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-gray-800">Study Time by Module</h3>
                                <Target className="text-[#002366] w-5 h-5" />
                            </div>

                            <div className="space-y-4">
                                {studyData.subjectData.map((subject, index) => (
                                    <div key={subject.name}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                                            <span className="text-sm text-gray-500">{subject.hours} h</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="h-3 rounded-full"
                                                style={{
                                                    width: `${(subject.hours / maxHours) * 100}%`,
                                                    backgroundColor: subject.color
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="flex space-x-4 mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-[#002366] rounded"></div>
                                    <span className="text-xs text-gray-500">This</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-gray-300 rounded"></div>
                                    <span className="text-xs text-gray-500">Goal</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-gray-100 rounded"></div>
                                    <span className="text-xs text-gray-500">Last</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Session Stats */}
                    <Card className="bg-white border border-gray-300 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 mb-2">Average Session Duration</h4>
                                    <div className="text-2xl font-bold text-[#002366] mb-3">
                                        {studyData.averageSessionDuration}
                                    </div>
                                    <div className="flex items-center justify-center w-12 h-12 border-4 border-[#002366] rounded-full">
                                        <Clock className="w-5 h-5 text-[#002366]" />
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 mb-2">Average Deviation From Planned</h4>
                                    <div className="text-2xl font-bold text-green-600 mb-3">
                                        {studyData.averageDeviation}
                                    </div>
                                    <div className="flex items-center justify-center w-12 h-12 border-4 border-gray-300 rounded-full relative">
                                        <div className="absolute inset-0 border-4 border-gray-300 rounded-full"></div>
                                        <div className="absolute inset-0 border-t-4 border-green-600 rounded-full transform rotate-45"></div>
                                        <span className="text-lg font-bold text-gray-400">×</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trends Card */}
                    <Card className="bg-white border border-gray-300 rounded-2xl md:col-span-2 xl:col-span-1">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-gray-800">Your Trends</h3>
                                <TrendingUp className="text-[#002366] w-5 h-5" />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 text-sm font-semibold">ℹ</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            You're {studyData.trends.weekendProductivity}% more productive on weekends
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <Star className="w-4 h-4 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            Most productive day: <span className="font-semibold">{studyData.trends.mostProductiveDay}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            +{studyData.trends.improvement}% improvement compared to last week
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            {studyData.trends.currentStreak}-day streak this week
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