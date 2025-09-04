'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type IEntry } from '@/lib/db';
import { useState } from 'react';
import SuggestionCard from '@/components/SuggestionCard'; // Import the new component

// Define a type for the suggestion object we expect from the API
type Suggestion = {
  type: string;
  text: string;
};

const HomePage: React.FC = () => {
  const entries = useLiveQuery(() =>
    db.entries.orderBy('date').reverse().toArray()
  );

  // State variables for the AI feature
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCloudAI, setIsCloudAI] = useState<boolean>(false);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await db.entries.delete(id);
      } catch (error) {
        console.error("Failed to delete entry:", error);
      }
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const recentEntries = await db.entries.orderBy('date').reverse().limit(10).toArray();
      if (recentEntries.length < 3) {
        setError("You need at least 3 entries to get an analysis.");
        setIsLoading(false);
        return;
      }
      const response = await fetch('http://localhost:5001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Add the isCloudAI flag to the payload
        body: JSON.stringify({ entries: recentEntries, useCloudAI: isCloudAI }),
      });
      if (!response.ok) throw new Error("Server response wasn't ok.");
      const data = await response.json();
      if (data.suggestion) {
        setSuggestion(data.suggestion);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Journal</h1>
        <div className="flex gap-4">
          <div className="flex items-center space-x-2 text-sm">
            <label htmlFor="ai-toggle" className="text-gray-400">Local AI</label>
            <button
              id="ai-toggle"
              onClick={() => setIsCloudAI(!isCloudAI)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCloudAI ? 'bg-purple-600' : 'bg-gray-600'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCloudAI ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <label htmlFor="ai-toggle" className="text-gray-200">Cloud AI</label>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : 'Get Insight ✨'}
          </button>
          <Link href="/write" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">
            + New Entry
          </Link>
        </div>
      </div>



      {/* --- NEW: Display Suggestion or Error --- */}
      <div className="mb-6">
        {suggestion && (
          <SuggestionCard
            suggestionText={suggestion.text}
            onDismiss={() => setSuggestion(null)}
          />
        )}
        {error && (
          <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-300 p-3 rounded-md text-center">
            {error}
          </div>
        )}
      </div>

      {/* --- Existing Entry List --- */}
      <div className="space-y-4">
        {entries && entries.length > 0 ? (
          entries.map((entry: IEntry) => (
            <div key={entry.id} className="bg-gray-800 p-4 rounded-md shadow-lg">
              <p className="text-gray-400 text-sm mb-2">
                {new Date(entry.date).toLocaleString()}
              </p>
              <p className="whitespace-pre-wrap">
                {entry.content}
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
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;