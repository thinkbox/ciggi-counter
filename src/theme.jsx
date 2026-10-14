// Light and dark colours. The choice starts from the operating system
// and lasts for this visit. `createContext` shares that choice with any
// component under ThemeProvider without passing it as a parameter.

import { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./components/ui.jsx";

const ThemeContext = createContext({ theme: "light", toggle() {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function toggle() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="absolute top-4 right-4"
      data-testid="button-theme-toggle"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
