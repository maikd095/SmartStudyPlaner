// All imports incl. https://ui.shadcn.com
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegisterScreenProps {
    onRegisterSuccess: () => void;
    onSwitchToLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Needed fields for a new user
        const newUser = { email, username, password, firstName, lastName };

        try {
            // Register API-Call
            const response = await fetch("https://study-planner-online-275553834411.europe-west3.run.app/api/users/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newUser),
            });

            if (response.ok) {
                onRegisterSuccess();
            } else {
                const errorText = await response.text();
                setError(errorText || "Registration failed");
            }
        } catch (err) {
            console.error(err);
            setError("Backend Error!");
        }
    };

    //Layout
    return (
        <div className="flex items-center justify-center h-screen bg-[#f4f4f7] font-sans">
            <div className="bg-white p-8 rounded-xl shadow-md w-96">
                <h1 className="text-2xl font-bold text-center text-[#002366] mb-6">
                    Smart Study Planner
                </h1>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="focus:ring-2 focus:ring-[#002366]" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="focus:ring-2 focus:ring-[#002366]" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-gray-700">Username</Label>
                        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="focus:ring-2 focus:ring-[#002366]" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="focus:ring-2 focus:ring-[#002366]" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-700">Password</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="focus:ring-2 focus:ring-[#002366]" />
                    </div>

                    <Button type="submit" className="w-full bg-[#002366] hover:bg-[#001a4d] text-white">
                        Register
                    </Button>

                    <div className="text-sm text-center pt-2">
                        Already have an account? <button type="button" className="text-[#002366] underline" onClick={onSwitchToLogin}>Login</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterScreen;
