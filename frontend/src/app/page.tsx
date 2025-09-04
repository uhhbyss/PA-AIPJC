'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type IEntry } from '@/lib/db';
import { useState } from 'react';
import { useInsightGenerator } from '@/hooks/useInsightGenerator';
import SuggestionCard from '@/components/SuggestionCard';
import CelebrationCard from '@/components/CelebrationCard';

type Suggestion = {
  text: string;
};

type Celebration = {
  topic: string;
};

const HomePage: React.FC = () => {
  // fetches all entries and updates the list in real-time
  const entries = useLiveQuery(() =>
    db.entries.orderBy('date').reverse().toArray(),
    []
  );

  const router = useRouter();
  const [isCloudAI, setIsCloudAI] = useState<boolean>(false);
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  // --- Replaced old state with the new custom hook ---
  const {
    suggestion,
    isLoading,
    error,
    generateInsight,
    setSuggestion,
    setError
  } = useInsightGenerator();

  // Handler for deleting an entry
  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      await db.entries.delete(id);
    }
  };


  const handleFullAnalysis = async () => {
    // We clear all messages before starting a new analysis
    setError(null);
    setSuggestion(null);
    setCelebration(null);

    // --- 1. Check for Resolved Loops ---
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeLoops = await db.activeLoops.where('status').equals('active').toArray();

    for (const loop of activeLoops) {
      if (loop.lastSeenDate < sevenDaysAgo) {
        const recentMention = await db.entries
          .where('date').above(sevenDaysAgo)
          .and(entry => entry.content.toLowerCase().includes(loop.topic))
          .first();

        if (!recentMention) {
          await db.activeLoops.update(loop.id!, { status: 'resolved' });
          setCelebration({ topic: loop.topic });
          return; // Show celebration and stop
        }
      }
    }

    // --- 2. If no loops resolved, generate a new insight ---
    await generateInsight(isCloudAI);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Journal</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 text-sm">
            <label htmlFor="ai-toggle" className="text-gray-400">Local AI</label>
            <button id="ai-toggle" onClick={() => setIsCloudAI(!isCloudAI)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCloudAI ? 'bg-purple-600' : 'bg-gray-600'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCloudAI ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <label htmlFor="ai-toggle" className="text-gray-200">Cloud AI ✨</label>
          </div>
          <button
            onClick={handleFullAnalysis}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : 'Get Insight'}
          </button>
          <Link href="/write" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">+ New Entry</Link>
        </div>
      </div>

      <div className="mb-6">
        {celebration && <CelebrationCard topic={celebration.topic} onDismiss={() => setCelebration(null)} />}
        {suggestion && <SuggestionCard suggestionText={suggestion.text} onDismiss={() => setSuggestion(null)} />}
        {error && <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-300 p-3 rounded-md text-center">{error}</div>}
      </div>

      <div className="space-y-4">
        {entries?.map((entry: IEntry) => (
          <div key={entry.id} className="bg-gray-800 p-4 rounded-md shadow-lg">
            <p className="text-gray-400 text-sm mb-2">{new Date(entry.date).toLocaleString()}</p>
            <p className="whitespace-pre-wrap">{entry.content}</p>
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => entry.id && router.push(`/entry/${entry.id}`)}
                className="text-blue-400 hover:text-blue-300 text-sm font-semibold cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={() => entry.id && handleDelete(entry.id)}
                className="text-red-500 hover:text-red-400 text-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;