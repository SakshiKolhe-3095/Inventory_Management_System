// client/src/components/Notification.jsx
import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// 1. Create a Context for the notification system
const NotificationContext = createContext(null);

// 2. Notification Provider Component
export const NotificationProvider = ({ children }) => {
    const [message, setMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const messageTimeoutRef = useRef(null);

    // This function will be exposed via context
    const showTimedMessage = useCallback((msg, duration = 3000) => {
        if (messageTimeoutRef.current) {
            clearTimeout(messageTimeoutRef.current);
        }
        setMessage(msg);
        setShowMessage(true);
        messageTimeoutRef.current = setTimeout(() => {
            setShowMessage(false);
            setMessage('');
        }, duration);
    }, []);

    const contextValue = {
        showTimedMessage,
    };

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
            {/* 3. The Notification UI Component (rendered by the provider) */}
            <div
                className={`fixed top-5 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg transition-opacity duration-500 z-50 ${
                    showMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'
                }`}
                style={{ minWidth: '250px', textAlign: 'center' }}
            >
                {message}
            </div>
        </NotificationContext.Provider>
    );
};

// 4. Custom Hook to easily use the notification system
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};