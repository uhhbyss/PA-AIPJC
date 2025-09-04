'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInsightGenerator } from '@/hooks/useInsightGenerator'; // Import the hook
import SuggestionCard from './SuggestionCard'; // Import the card

interface JournalEditorProps {
    initialContent?: string;
    onSave: (content: string) => Promise<void>;
    pageTitle: string;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ initialContent = '', onSave, pageTitle }) => {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    // --- NEW: Add the insight generator hook here too ---
    const {
        suggestion,
        isLoading: isAnalyzing, // Rename to avoid conflict with isSaving
        error,
        generateInsight,
        setSuggestion
    } = useInsightGenerator();

    // A local state for the cloud AI toggle on this page
    const [isCloudAI, setIsCloudAI] = useState<boolean>(false);

    useEffect(() => {
        setContent(initialContent);
    }, [initialContent]);

    const handleSave = async () => {
        if (content.trim() === '') return;
        setIsSaving(true);
        await onSave(content);
        setIsSaving(false);
        router.push('/');
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* --- NEW: Display for suggestion/error messages --- */}
            <div className="mb-4">
                {suggestion && <SuggestionCard suggestionText={suggestion.text} onDismiss={() => setSuggestion(null)} />}
                {error && <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-300 p-3 rounded-md text-center">{error}</div>}
            </div>

            <h1 className="text-3xl font-bold mb-6">{pageTitle}</h1>
            <textarea
                className="w-full h-96 p-4 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing..."
            />

            {/* --- NEW: Button container for all actions --- */}
            <div className="mt-4 flex justify-between items-center">
                <div className="flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isAnalyzing}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-gray-500"
                    >
                        {isSaving ? 'Saving...' : 'Save Entry'}
                    </button>
                    <button
                        onClick={() => generateInsight(isCloudAI, content)} // Pass current text
                        disabled={isSaving || isAnalyzing}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md disabled:bg-gray-500"
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Get Insight'}
                    </button>
                </div>

                {/* --- NEW: AI Toggle --- */}
                <div className="flex items-center space-x-2 text-sm">
                    <label htmlFor="ai-toggle" className="text-gray-400">Local</label>
                    <button
                        id="ai-toggle"
                        onClick={() => setIsCloudAI(!isCloudAI)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCloudAI ? 'bg-purple-600' : 'bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCloudAI ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <label htmlFor="ai-toggle" className="text-gray-200">Cloud</label>
                </div>
            </div>
        </div>
    );
};

export default JournalEditor;