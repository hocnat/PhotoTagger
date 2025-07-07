import { useContext } from "react";
import { NotificationContext } from "context/NotificationContext";

/**
 * Custom hook to access the notification context.
 * Provides a simple way to show notifications from any component
 * wrapped in the NotificationProvider.
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
