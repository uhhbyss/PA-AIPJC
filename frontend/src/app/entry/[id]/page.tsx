'use client';

import { useParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import JournalEditor from '@/components/JournalEditor';

const EditEntryPage = () => {
    const params = useParams();
    const id = Number(params.id);

    // Get entry from database using ID
    const entry = useLiveQuery(() => db.entries.get(id), [id]);

    // Updating an existing entry
    const handleUpdate = async (content: string) => {
        await db.entries.update(id, { content });
    };

    if (!entry) {
        return <div className="text-center">Loading entry...</div>;
    }

    return (
        <JournalEditor
            initialContent={entry.content}
            onSave={handleUpdate}
            pageTitle="Edit Your Entry"
        />
    );
};

export default EditEntryPage;