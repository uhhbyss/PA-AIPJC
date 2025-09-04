import Dexie, { type Table } from 'dexie';

export interface IEntry {
    id?: number;
    content: string;
    date: Date;
}

// --- NEW: Interface for our loop tracking ---
export interface IActiveLoop {
    id?: number;
    topic: string;
    startDate: Date;
    lastSeenDate: Date;
    status: 'active' | 'resolved';
}

export class MySubClassedDexie extends Dexie {
    entries!: Table<IEntry>;
    // --- NEW: Define the activeLoops table ---
    activeLoops!: Table<IActiveLoop>;

    constructor() {
        super('aiJournalApp');
        // --- NEW: Update the schema version ---
        // Incrementing the version number tells Dexie to apply a schema change.
        this.version(2).stores({
            entries: '++id, content, date',
            // The '&' makes 'topic' a unique key to prevent duplicates.
            activeLoops: '++id, &topic, startDate, lastSeenDate, status',
        });
    }
}

export const db = new MySubClassedDexie();