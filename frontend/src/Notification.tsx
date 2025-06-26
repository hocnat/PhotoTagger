import React, { useEffect } from "react";
import { NotificationState } from "./types";

interface NotificationProps extends NotificationState {
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type = "success",
  onClose,
}) => {
  useEffect(() => {
    if (!message || type === "error") {
      return;
    }

    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Disappears after 3 seconds

    return () => clearTimeout(timer);
  }, [message, type, onClose]);

  if (!message) {
    return null;
  }

  const notificationClass = `notification ${type}`;

  return (
    <div className={notificationClass}>
      <p>{message}</p>
      <button
        type="button"
        className="notification-close-btn"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
};

export default Notification;
