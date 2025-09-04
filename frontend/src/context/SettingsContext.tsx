'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type AiMode = 'auto' | 'reframing' | 'emotional_exploration' | 'action_oriented';

interface SettingsContextType {
    aiMode: AiMode;
    setAiMode: (mode: AiMode) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [aiMode, setAiMode] = useState<AiMode>('auto');

    // Load saved mode from localStorage on initial load
    useEffect(() => {
        const savedMode = localStorage.getItem('aiMode') as AiMode;
        if (savedMode) {
            setAiMode(savedMode);
        }
    }, []);

    // Save mode to localStorage whenever it changes
    const handleSetAiMode = (mode: AiMode) => {
        setAiMode(mode);
        localStorage.setItem('aiMode', mode);
    };

    return (
        <SettingsContext.Provider value={{ aiMode, setAiMode: handleSetAiMode }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};