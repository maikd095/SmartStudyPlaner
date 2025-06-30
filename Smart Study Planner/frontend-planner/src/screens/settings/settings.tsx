// All imports incl. https://ui.shadcn.com
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import AppSideBar, { SidebarPage } from "@/components/ui/SideBar";
import type { AppPage } from "../MainContainer";

interface SettingsProps {
    onLogout: () => void;
    onPageChange: (page: AppPage) => void;
}

// Initializing fields with standard values. Could be left out because of API-Call
const Settings: React.FC<SettingsProps> = ({ onLogout, onPageChange }) => {
    const [activePage, setActivePage] = useState<SidebarPage>("settings");

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");

    const [studyLength, setStudyLength] = useState(50);
    const [breakDuration, setBreakDuration] = useState(15);
    const [preferredStartTime, setPreferredStartTime] = useState("09:00:00");
    const [preferredEndTime, setPreferredEndTime] = useState("20:00:00");
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [creationDate, setCreationDate] = useState("01.01.1900");
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = localStorage.getItem("user");
                if (!userData) return;
                // Get user ID
                const parsedUser = JSON.parse(userData);
                const userId = parsedUser?.id;
                if (!userId) return;

                //Load Data with API-call
                const response = await fetch(`https://study-planner-online-275553834411.europe-west3.run.app/api/users/settings?userId=${userId}`);
                if (!response.ok) throw new Error("Error with API");

                const user = await response.json();

                setFirstName(user.firstName || "");
                setLastName(user.lastName || "");
                setEmail(user.email || "");
                setStudyLength(user.prefSessionLength || 50);
                setBreakDuration(user.prefBreakLength || 15);
                setNotificationsEnabled(user.enableNotifications || false);
                setDarkMode(user.darkMode || false);
                setPreferredStartTime(user.prefStartTime);
                setPreferredEndTime(user.prefEndTime);
                setCreationDate(user.creationDate);
            } catch (err) {
                console.error("Error with loading user data:", err);
            }
        };

        fetchUserData();
    }, []);


    const handlePageChange = (page: SidebarPage) => {
        setActivePage(page);
        onPageChange(page as AppPage);
    };

    const handleSaveChanges = async () => {
        const userData = localStorage.getItem("user");
        if (!userData) return;

        const user = JSON.parse(userData);

        // User-Schema when updated
        const updatedUser = {
            userId: user.id,
            email: email,
            firstName,
            lastName,
            prefStartTime: preferredStartTime,
            prefEndTime: preferredEndTime,
            prefSessionLength: studyLength,
            prefBreakLength: breakDuration,
            enableNotifications: notificationsEnabled,
            darkMode,
        };

        // Update API
        const response = await fetch("https://study-planner-online-275553834411.europe-west3.run.app/api/users/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedUser),
        });

        if (response.ok) {
            console.log("Settings saved");
        } else {
            console.error("Error while saving");
        }
    };


    const handleDeleteAccount = () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            onLogout();
        }
    };

    // to be implemented
    const handleChangePassword = () => {
    };

    //Layout

    return (
        <div className="flex h-screen font-sans bg-[#f2f3f7]">
            <AppSideBar
                activePage={activePage}
                onPageChange={handlePageChange}
                onLogout={onLogout}
            />

            <div className="flex-1 bg-[#f2f3f7] p-8 overflow-y-auto">
                <h2 className="text-3xl font-bold mb-6">Settings</h2>

                <div className="grid gap-8">
                    <Card className="bg-white border border-gray-300 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-2xl font-bold mb-6 text-gray-800">Account</h3>

                                    <div className="flex justify-center mb-6">
                                        <div className="relative">
                                            <div className="w-32 h-32 rounded-full overflow-hidden bg-[#002366]">
                                                <img
                                                    src="/api/placeholder/128/128"
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-center mb-4">
                                        {firstName} {lastName}
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="firstName">First name</Label>
                                            <Input
                                                id="firstName"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="lastName">Last name</Label>
                                            <Input
                                                id="lastName"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="email">E-Mail</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <Label className="block mb-2">Password</Label>
                                            <div className="flex space-x-4">
                                                <Button
                                                    onClick={handleChangePassword}
                                                    className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-100"
                                                >
                                                    Change Password
                                                </Button>
                                                <Button
                                                    onClick={handleDeleteAccount}
                                                    className="bg-white border border-red-300 text-red-600 hover:bg-red-50"
                                                >
                                                    Delete Account
                                                </Button>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-xs text-gray-500 mt-4">
                                                Created: {new Date(creationDate).toLocaleDateString()}
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-2xl font-bold mb-6 text-gray-800">Learning Preferences</h3>

                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <Label>Study session length</Label>
                                                <span className="text-gray-700">{studyLength} m</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="15"
                                                max="180"
                                                value={studyLength}
                                                onChange={(e) => setStudyLength(parseInt(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <Label>Preferred break duration</Label>
                                                <span className="text-gray-700">{breakDuration} m</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="5"
                                                max="30"
                                                value={breakDuration}
                                                onChange={(e) => setBreakDuration(parseInt(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>

                                        <div>
                                            <Label className="block mb-2">Preferred Start Time</Label>

                                            <Input
                                                id="preferredStartTime"
                                                value={preferredStartTime}
                                                onChange={(e) => setPreferredStartTime(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-2">Preferred End Time</Label>
                                            <Input
                                                id="preferredEndTime"
                                                value={preferredEndTime}
                                                onChange={(e) => setPreferredEndTime(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="notifications">Enable notifications</Label>
                                            <Switch
                                                id="notifications"
                                                checked={notificationsEnabled}
                                                onCheckedChange={setNotificationsEnabled}
                                                className="bg-gray-300 data-[state=checked]:bg-blue-600 shadow-inner transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold my-6 text-gray-800">Appearance</h3>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="darkMode">Dark mode</Label>
                                            <Switch
                                                id="darkMode"
                                                checked={darkMode}
                                                onCheckedChange={setDarkMode}
                                                className="bg-gray-300 data-[state=checked]:bg-blue-600 shadow-inner transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <Button
                                    onClick={handleSaveChanges}
                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Settings;


