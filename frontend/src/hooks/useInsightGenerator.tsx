'use client';

import { useState } from 'react';
import { db } from '@/lib/db'; // Make sure the db is imported
import { useSettings } from '@/context/SettingsContext';

interface Suggestion {
    text: string;
}

export const useInsightGenerator = () => {
    const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { aiMode } = useSettings();

    const generateInsight = async (isCloud: boolean, currentText?: string) => {
        setIsLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            let entriesToAnalyze = await db.entries.orderBy('date').reverse().limit(10).toArray();

            if (currentText && currentText.trim() !== '') {
                const tempEntry = { content: currentText, date: new Date() };
                entriesToAnalyze.unshift(tempEntry as any);
            }

            if (entriesToAnalyze.length < 3) {
                setError("You need at least 3 entries (including current text) for an analysis.");
                setIsLoading(false);
                return;
            }

            const response = await fetch('http://localhost:5001/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: entriesToAnalyze, useCloudAI: isCloud, aiMode: aiMode }),
            });

            if (!response.ok) throw new Error("Server response wasn't OK.");
            const data = await response.json();
            const detectedLoop = data.detectedLoop;

            if (detectedLoop) {
                setSuggestion({ text: detectedLoop.suggestionText });

                // --- RESTORED DATABASE LOGIC ---
                // This is the critical part that was missing.
                // It logs the detected loop as 'active' in our database.
                const existingLoop = await db.activeLoops.get({ topic: detectedLoop.topic });

                if (existingLoop) {
                    // If the loop is already being tracked, just update when we last saw it.
                    // We also ensure its status is 'active' in case it was re-detected after being resolved.
                    await db.activeLoops.update(existingLoop.id!, {
                        lastSeenDate: new Date(),
                        status: 'active'
                    });
                } else {
                    // If it's a brand new loop, add it to the database.
                    await db.activeLoops.add({
                        topic: detectedLoop.topic,
                        startDate: new Date(),
                        lastSeenDate: new Date(),
                        status: 'active',
                    });
                }
                // --- END OF RESTORED LOGIC ---

            } else {
                setError("No specific patterns were detected in your recent entries. Keep writing!");
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred. Is the backend server running?");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        suggestion,
        isLoading,
        error,
        generateInsight,
        setSuggestion,
        setError
    };
};