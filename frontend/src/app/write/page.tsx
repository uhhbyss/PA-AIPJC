'use client';

import JournalEditor from '@/components/JournalEditor';
import { db } from '@/lib/db';

const WritePage = () => {
    // Define the save handler for creating a new entry
    const handleCreate = async (content: string) => {
        await db.entries.add({
            content: content,
            date: new Date(),
        });
    };

    return (
        <JournalEditor
            onSave={handleCreate}
            pageTitle="What's on your mind?"
        />
    );
};

export default WritePage;