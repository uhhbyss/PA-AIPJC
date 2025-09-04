'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface JournalEditorProps {
    initialContent?: string;
    onSave: (content: string) => Promise<void>;
    pageTitle: string;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ initialContent = '', onSave, pageTitle }) => {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    // Update content (for editing)
    useEffect(() => {
        setContent(initialContent);
    }, [initialContent]);

    const handleSave = async () => {
        if (content.trim() === '') return;
        setIsSaving(true);
        await onSave(content);
        setIsSaving(false);
        router.push('/'); // Go to homepage after any save
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">{pageTitle}</h1>
            <textarea
                className="w-full h-96 p-4 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing..."
            />
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-gray-500"
            >
                {isSaving ? 'Saving...' : 'Save Entry'}
            </button>
        </div>
    );
};

export default JournalEditor;