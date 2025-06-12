import React, { useState } from "react";
import Dashboard from "./dashboard/dashboard";
import SignInScreen from "./signinscreen/signinscreen";
import RegisterScreen from "./registerscreen/register";
import CalendarView from "./calendar";
import Settings from "./settings/settings";
import FocusMode from "./focus/focusmode";
import Statistics from "./statistics/statistics";

export type AppPage = "dashboard" | "calendar" | "focus" | "statistics" | "progress" | "settings";

const MainContainer: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handlePageChange = (page: AppPage) => {
    setCurrentPage(page);
  };

  if (!isLoggedIn) {
    return authMode === "login" ? (
      <SignInScreen
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthMode("register")}
      />
    ) : (
      <RegisterScreen
        onRegisterSuccess={() => setAuthMode("login")}
        onSwitchToLogin={() => setAuthMode("login")}
      />
    );
  }

  return (
    <>
      {currentPage === "dashboard" && (
        <Dashboard onLogout={handleLogout} onPageChange={handlePageChange} />
      )}
      {currentPage === "calendar" && (
        <CalendarView onLogout={handleLogout} onPageChange={handlePageChange} />
      )}
      {currentPage === "focus" && (
        <FocusMode onLogout={handleLogout} onPageChange={handlePageChange} />
      )}
      {currentPage === "statistics" && (
        <Statistics onLogout={handleLogout} onPageChange={handlePageChange} />
      )}
      {currentPage === "settings" && (
        <Settings onLogout={handleLogout} onPageChange={handlePageChange} />
      )}
    </>
  );
};

export default MainContainer;
