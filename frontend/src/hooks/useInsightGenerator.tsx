'use client';

import { useState } from 'react';
import { db } from '@/lib/db';

interface Suggestion {
    text: string;
}

export const useInsightGenerator = () => {
    const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // The main analysis function, now accepting optional current text
    const generateInsight = async (isCloud: boolean, currentText?: string) => {
        setIsLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            let entriesToAnalyze = await db.entries.orderBy('date').reverse().limit(10).toArray();

            // If currentText is provided, add it to the beginning of our analysis pool
            if (currentText && currentText.trim() !== '') {
                const tempEntry = { content: currentText, date: new Date() };
                entriesToAnalyze.unshift(tempEntry as any); // Add to the front
            }

            if (entriesToAnalyze.length < 3) {
                setError("You need at least 3 entries (including current text) for an analysis.");
                setIsLoading(false);
                return;
            }

            const response = await fetch('http://localhost:5001/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: entriesToAnalyze, useCloudAI: isCloud }),
            });

            if (!response.ok) throw new Error("Server response wasn't OK.");
            const data = await response.json();
            const detectedLoop = data.detectedLoop;

            if (detectedLoop) {
                setSuggestion({ text: detectedLoop.suggestionText });
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