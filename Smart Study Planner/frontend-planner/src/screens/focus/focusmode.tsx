import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppSideBar, { SidebarPage } from "@/components/ui/SideBar";
import { Pause, Play, X, Maximize } from "lucide-react";
import type { AppPage } from "../MainContainer";

interface FocusModeProps {
    onLogout: () => void;
    onPageChange: (page: AppPage) => void;
}

const FocusMode: React.FC<FocusModeProps> = ({ onLogout, onPageChange }) => {
    const [activePage, setActivePage] = useState<SidebarPage>("focus");
    const [sessionLength, setSessionLength] = useState(55);
    const [sessionName, setSessionName] = useState("Study Java");
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Mock session data for autocomplete
    const todaysSessions = [
        "Study Java",
        "Study Python",
        "Study React",
        "Study Mathematics",
        "Read Documentation",
        "Code Review",
        "Planning Session"
    ];

    // Fullscreen functionality
    const enterFullscreen = async () => {
        try {
            if (containerRef.current && containerRef.current.requestFullscreen) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            }
        } catch (error) {
            console.log("Fullscreen not supported or blocked");
            setIsFullscreen(true); // Fallback to CSS fullscreen
        }
    };

    const exitFullscreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        setIsFullscreen(false);
    };

    // Handle fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Session name autocomplete
    const handleSessionNameChange = (value: string) => {
        setSessionName(value);
        if (value.length > 0) {
            const filtered = todaysSessions.filter(session =>
                session.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setShowSuggestions(false);
        }
    };

    // Timer logic
    useEffect(() => {
        if (isActive && !isPaused && timeLeft > 0 && !intervalRef.current) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isActive, isPaused, timeLeft]);

    useEffect(() => {
        if (timeLeft <= 0 && isActive) {
            finishSession();
        }
    }, [timeLeft]);

    const handlePageChange = (page: SidebarPage) => {
        setActivePage(page);
        onPageChange(page as AppPage);
    };

    const startFocusSession = async () => {
        setTimeLeft(sessionLength * 60);
        setIsActive(true);
        setIsPaused(false);
        await enterFullscreen();
    };

    const pauseSession = () => setIsPaused(!isPaused);

    const finishSession = () => {
        setIsActive(false);
        setIsPaused(false);
        setTimeLeft(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        exitFullscreen();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate plant growth progress (0 to 1)
    const growthProgress = isActive ? 1 - (timeLeft / (sessionLength * 60)) : 0;

    // Plant component with growth animation
    const PlantComponent: React.FC<{ progress: number; isTimer?: boolean }> = ({ progress, isTimer = false }) => {
        const height = isTimer ? 300 : 150;
        const scale = isTimer ? 1.5 : 1;

        return (
            <div className={`flex justify-center items-end ${isTimer ? 'mb-8' : 'mb-4'}`}>
                <svg
                    width={120 * scale}
                    height={height}
                    viewBox="0 0 120 200"
                    className="transition-all duration-1000"
                >
                    {/* Seed/Soil */}
                    <ellipse cx="60" cy="190" rx="25" ry="10" fill="#8B4513" opacity="0.8" />
                    <circle cx="60" cy="185" r="8" fill="#4A5D23" opacity={progress === 0 ? 1 : 0.3} />

                    {/* Stem */}
                    {progress > 0.1 && (
                        <rect
                            x="58"
                            y={190 - (progress * 80)}
                            width="4"
                            height={progress * 80}
                            fill="#228B22"
                            className="transition-all duration-1000"
                        />
                    )}

                    {/* First leaves */}
                    {progress > 0.3 && (
                        <>
                            <ellipse
                                cx="45"
                                cy={170 - (progress * 40)}
                                rx="15"
                                ry="8"
                                fill="#32CD32"
                                className="animate-pulse"
                                transform={`rotate(-30 45 ${170 - (progress * 40)})`}
                            />
                            <ellipse
                                cx="75"
                                cy={175 - (progress * 40)}
                                rx="15"
                                ry="8"
                                fill="#32CD32"
                                className="animate-pulse"
                                transform={`rotate(30 75 ${175 - (progress * 40)})`}
                            />
                        </>
                    )}

                    {/* Second set of leaves */}
                    {progress > 0.6 && (
                        <>
                            <ellipse
                                cx="40"
                                cy={150 - (progress * 30)}
                                rx="18"
                                ry="10"
                                fill="#228B22"
                                className="animate-pulse"
                                transform={`rotate(-45 40 ${150 - (progress * 30)})`}
                            />
                            <ellipse
                                cx="80"
                                cy={155 - (progress * 30)}
                                rx="18"
                                ry="10"
                                fill="#228B22"
                                className="animate-pulse"
                                transform={`rotate(45 80 ${155 - (progress * 30)})`}
                            />
                        </>
                    )}

                    {/* Flower/Fruit */}
                    {progress > 0.9 && (
                        <circle
                            cx="60"
                            cy={130 - (progress * 20)}
                            r="12"
                            fill="#FF69B4"
                            className="animate-bounce"
                        />
                    )}

                    {/* Sparkles for completed growth */}
                    {progress >= 1 && (
                        <>
                            <circle cx="30" cy="120" r="2" fill="#FFD700" className="animate-ping" />
                            <circle cx="90" cy="130" r="2" fill="#FFD700" className="animate-ping" style={{ animationDelay: '0.5s' }} />
                            <circle cx="60" cy="100" r="2" fill="#FFD700" className="animate-ping" style={{ animationDelay: '1s' }} />
                        </>
                    )}
                </svg>
            </div>
        );
    };

    // Fullscreen mode render
    if (isFullscreen) {
        return (
            <div ref={containerRef} className="fixed inset-0 bg-gradient-to-br from-green-50 to-blue-50 z-50 overflow-hidden">
                <div className="flex flex-col items-center justify-center h-full relative p-8">
                    {/* Exit fullscreen button */}
                    <Button
                        onClick={exitFullscreen}
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    {/* Plant with growth animation */}
                    <PlantComponent progress={growthProgress} isTimer={true} />

                    {/* Timer display */}
                    <div className="text-8xl font-bold text-gray-800 mb-8 font-mono">
                        {formatTime(timeLeft)}
                    </div>

                    {/* Session name */}
                    <div className="text-3xl text-gray-600 mb-12 font-medium">
                        {sessionName}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-6">
                        <Button
                            onClick={pauseSession}
                            variant="outline"
                            size="lg"
                            className="flex items-center gap-3 px-8 py-4 text-xl"
                        >
                            {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                            {isPaused ? 'Resume' : 'Pause'}
                        </Button>
                        <Button
                            onClick={finishSession}
                            variant="destructive"
                            size="lg"
                            className="px-8 py-4 text-xl"
                        >
                            Finish
                        </Button>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-12 w-96 bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-green-500 h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${growthProgress * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Normal mode render
    return (
        <div className="flex h-screen bg-gray-50">
            <AppSideBar
                activePage={activePage}
                onPageChange={handlePageChange}
                onLogout={onLogout}
            />

            <div className="flex-1 p-8">
                <Card className="max-w-2xl mx-auto">
                    <CardContent className="p-8">
                        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                            Focus Mode
                        </h1>

                        {!isActive ? (
                            <div className="space-y-8">
                                {/* Plant seed visualization */}
                                <PlantComponent progress={0} />

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Length (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            value={sessionLength}
                                            onChange={(e) => setSessionLength(Math.max(1, Number(e.target.value)))}
                                            className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            min="1"
                                            max="180"
                                        />
                                    </div>

                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Session Name
                                        </label>
                                        <input
                                            type="text"
                                            value={sessionName}
                                            onChange={(e) => handleSessionNameChange(e.target.value)}
                                            onFocus={() => sessionName.length > 0 && setShowSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                            className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="Enter session name"
                                        />

                                        {/* Autocomplete suggestions */}
                                        {showSuggestions && suggestions.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                                {suggestions.map((suggestion, index) => (
                                                    <div
                                                        key={index}
                                                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                        onClick={() => {
                                                            setSessionName(suggestion);
                                                            setShowSuggestions(false);
                                                        }}
                                                    >
                                                        {suggestion}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    onClick={startFocusSession}
                                    className="w-full py-4 text-xl font-semibold bg-green-600 hover:bg-green-700 flex items-center justify-center gap-3"
                                >
                                    <Maximize className="h-5 w-5" />
                                    Start Focus Session
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center space-y-8">
                                <PlantComponent progress={growthProgress} />

                                <div className="text-6xl font-bold text-gray-800 font-mono">
                                    {formatTime(timeLeft)}
                                </div>

                                <div className="text-xl text-gray-600 font-medium">
                                    {sessionName}
                                </div>

                                <div className="flex gap-4 justify-center">
                                    <Button
                                        onClick={pauseSession}
                                        variant="outline"
                                        className="flex items-center gap-2 px-6 py-3"
                                    >
                                        {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                                        {isPaused ? 'Resume' : 'Pause'}
                                    </Button>
                                    <Button
                                        onClick={finishSession}
                                        variant="destructive"
                                        className="px-6 py-3"
                                    >
                                        Finish
                                    </Button>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-6">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${growthProgress * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FocusMode;