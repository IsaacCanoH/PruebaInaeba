import { createContext, useContext, useState, useRef, useEffect } from "react";
import { CheckCircle, XCircle, Bell, Info, AlertTriangle } from "lucide-react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const notificationRef = useRef(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const unreadCount = notifications.filter((n) => !n.leida).length;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = (id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
    };

    const deleteNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const getNotificationIcon = (tipo) => {
        switch (tipo) {
            case "success": return <CheckCircle size={18} className="text-success" />;
            case "warning": return <AlertTriangle size={18} className="text-warning" />;
            case "error": return <XCircle size={18} className="text-danger" />;
            case "info": return <Info size={18} className="text-info" />;
            default: return <Bell size={18} className="text-muted" />;
        }
    };

    const getNotificationBadgeColor = (tipo) => {
        switch (tipo) {
            case "success": return "bg-success";
            case "warning": return "bg-warning";
            case "error": return "bg-danger";
            case "info": return "bg-info";
            default: return "bg-secondary";
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notificationRef,
                showNotifications,
                setShowNotifications,
                notifications,
                setNotifications,
                unreadCount,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                getNotificationIcon,
                getNotificationBadgeColor,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
