// Small notices in the corner after a save or an error.
// They disappear on their own after a few seconds.

import { createContext, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function toast({ title, description, variant }) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className={
              item.variant === "destructive"
                ? "rounded-lg border border-red-500 bg-card px-4 py-3 shadow-md"
                : "rounded-lg border border-border bg-card px-4 py-3 shadow-md"
            }
          >
            <p className="font-medium">{item.title}</p>
            {item.description ? (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
