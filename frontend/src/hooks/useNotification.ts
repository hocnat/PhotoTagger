import { useContext } from "react";
import { NotificationContext } from "context/NotificationContext";

/**
 * A simple consumer hook to access the notification context.
 * This abstracts away the `useContext` call and provides a clean, descriptive
 * API for showing notifications from any component within the `NotificationProvider`.
 * It also includes a runtime check to ensure it's used correctly within its provider.
 *
 * @returns The `showNotification` function provided by the NotificationContext.
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  // This check is a crucial safeguard. If a developer forgets to wrap a
  // component in the provider, this error will point them to the exact problem,
  // preventing hard-to-debug runtime errors where the context value is undefined.
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
