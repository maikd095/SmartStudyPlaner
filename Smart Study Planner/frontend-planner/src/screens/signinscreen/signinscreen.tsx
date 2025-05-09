import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignInScreenProps {
  onLogin: () => void;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ onLogin }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-[#f4f4f7] font-sans">
      <div className="bg-white p-8 rounded-xl shadow-md w-96">
        <h1 className="text-2xl font-bold text-center text-[#002366] mb-6">
          Smart Study Planner
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">
              Email
            </Label>
            <Input
              type="email"
              id="email"
              required
              className="focus:ring-2 focus:ring-[#002366]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">
              Password
            </Label>
            <Input
              type="password"
              id="password"
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
        </form>
      </div>
    </div>
  );
};

export default SignInScreen;
