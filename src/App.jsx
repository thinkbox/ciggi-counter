// The shell around every screen: theme, notices, the page, and the
// bottom navigation. Addresses look like /#/history. The part after # is
// handled here in the browser, so the server only has to serve this app
// once.

import { BarChart3, History, LayoutDashboard } from "lucide-react";
import { Link, Route, Router, Switch, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Dashboard } from "./pages/Dashboard.jsx";
import { HistoryPage } from "./pages/History.jsx";
import { NotFound } from "./pages/NotFound.jsx";
import { PackReviewPage } from "./pages/PackReview.jsx";
import { StatsPage } from "./pages/Stats.jsx";
import { ThemeProvider, ThemeToggle } from "./theme.jsx";
import { ToastProvider } from "./toast.jsx";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

function BottomNav() {
  const [location] = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {NAV.map((item) => {
          const active = location === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <button
                type="button"
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={
                  active
                    ? "flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-primary"
                    : "flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-muted-foreground"
                }
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Pages() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/stats" component={StatsPage} />
      <Route path="/packs/review" component={PackReviewPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router hook={useHashLocation}>
          <div className="relative min-h-screen pb-20">
            <ThemeToggle />
            <Pages />
            <BottomNav />
          </div>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}
