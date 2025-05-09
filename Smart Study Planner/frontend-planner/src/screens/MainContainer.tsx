import React, { useState } from "react";
import Dashboard from "./dashboard/dashboard";
import SignInScreen from "./signinscreen/signinscreen";
import CalendarView from "./calendar";

// Definiere die möglichen Seiten in der App
export type AppPage = "dashboard" | "calendar" | "statistics" | "progress" | "settings";

const MainContainer: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handlePageChange = (page: AppPage) => {
    setCurrentPage(page);
  };

  // Wenn nicht eingeloggt, zeige Login-Screen
  if (!isLoggedIn) {
    return <SignInScreen onLogin={handleLogin} />;
  }

  // Wenn eingeloggt, zeige die entsprechende Seite
  return (
    <>
      {currentPage === "dashboard" && <Dashboard onLogout={handleLogout} onPageChange={handlePageChange} />}
      {currentPage === "calendar" && <CalendarView onLogout={handleLogout} onPageChange={handlePageChange} />}
      {/* Weitere Seiten hier hinzufügen */}
    </>
  );
};

export default MainContainer;