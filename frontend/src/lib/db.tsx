import Dexie, { type Table } from 'dexie';

export interface IEntry {
    id?: number; // optional (for new entries)
    content: string;
    date: Date;
}

export class MySubClassedDexie extends Dexie {
    entries!: Table<IEntry>;

    constructor() {
        super('aiJournalApp');
        this.version(1).stores({
            entries: '++id, content, date',
        });
    }
}

export const db = new MySubClassedDexie();