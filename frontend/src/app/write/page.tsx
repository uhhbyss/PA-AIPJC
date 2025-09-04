'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';

const WritePage: React.FC = () => {
    const [content, setContent] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const router = useRouter();

    const handleSave = async () => {
        if (content.trim() === '') return;

        setIsSaving(true);
        try {
            await db.entries.add({
                content: content,
                date: new Date(),
            });
            router.push('/');
        } catch (error) {
            console.error("Failed to save entry:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">What's on your mind?</h1>
            <textarea
                className="w-full h-64 p-4 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
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
}

export default WritePage;