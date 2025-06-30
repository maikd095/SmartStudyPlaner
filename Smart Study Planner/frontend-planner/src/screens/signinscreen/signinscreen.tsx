// All imports incl. https://ui.shadcn.com
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignInScreenProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

// Initialize values
const SignInScreen: React.FC<SignInScreenProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Verify user credentials with API-call
      const response = await fetch("https://study-planner-online-275553834411.europe-west3.run.app/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password })
        ,
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({
          id: data.userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        }));
        onLogin();
      } else {
        const errorData = await response.text();
        setError(errorData || "Log in failed");
      }
    } catch (err) {
      setError("Error with backend");
      console.error(err);
    }
  };


  // Layout
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
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="focus:ring-2 focus:ring-[#002366]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">Password</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="focus:ring-2 focus:ring-[#002366]"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#002366] hover:bg-[#001a4d] text-white"
          >
            Login
          </Button>

          <div className="text-sm text-center pt-2">
            Don't have an account? <button type="button" className="text-[#002366] underline" onClick={onSwitchToRegister}>Register</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignInScreen;
