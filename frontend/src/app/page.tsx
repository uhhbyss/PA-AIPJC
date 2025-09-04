'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type IEntry } from '@/lib/db';

const HomePage: React.FC = () => {
  const entries = useLiveQuery(() =>
    db.entries.orderBy('date').reverse().toArray()
  );

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await db.entries.delete(id);
      } catch (error) {
        console.error("Failed to delete entry:", error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Journal</h1>
        <Link href="/write" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">
          + New Entry
        </Link>
      </div>

      <div className="space-y-4">
        {entries && entries.length > 0 ? (
          entries.map((entry: IEntry) => (
            <div key={entry.id} className="bg-gray-800 p-4 rounded-md shadow-lg">
              <p className="text-gray-400 text-sm mb-2">
                {new Date(entry.date).toLocaleString()}
              </p>
              <p className="whitespace-pre-wrap">
                {entry.content.substring(0, 300)}
                {entry.content.length > 300 && '...'}
              </p>
              <button
                onClick={() => entry.id && handleDelete(entry.id)}
                className="text-red-500 hover:text-red-400 mt-2 text-sm"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-gray-800 rounded-md">
            <p>You have no entries yet.</p>
            <p>
              <Link href="/write" className="text-blue-400 hover:underline">
                Start by writing your first one!
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;