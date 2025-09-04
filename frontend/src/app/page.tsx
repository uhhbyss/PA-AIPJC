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
    <div className="max-w-4xl mx-auto">
      {/* --- HEADER --- */}
      {/* Added more spacing and aligned items to the baseline */}
      <div className="flex flex-wrap justify-between items-baseline gap-4 mb-8">
        <h1 className="text-4xl font-bold text-white">
          Your Journal
        </h1>
        <div className="flex items-center gap-4">
          {/* --- AI TOGGLE --- */}
          <div className="flex items-center space-x-2 text-sm bg-slate-800/50 px-3 py-2 rounded-full">
            <label htmlFor="ai-toggle" className="text-gray-400">Local</label>
            <button id="ai-toggle" onClick={() => setIsCloudAI(!isCloudAI)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCloudAI ? 'bg-purple-600' : 'bg-gray-700'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCloudAI ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <label htmlFor="ai-toggle" className="text-white">Cloud ✨</label>
          </div>
          {/* --- ACTION BUTTONS --- */}
          {/* Added icons and improved styling for the main buttons */}
          <button
            onClick={handleFullAnalysis}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293z" clipRule="evenodd" /></svg>
            {isLoading ? 'Analyzing...' : 'Get Insight'}
          </button>
          <Link href="/write" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            New Entry
          </Link>
        </div>
      </div>

      {/* --- NOTIFICATION AREA --- */}
      {/* The animate-fade-in class will now work */}
      <div className="mb-6">
        {celebration && <CelebrationCard topic={celebration.topic} onDismiss={() => setCelebration(null)} />}
        {suggestion && <SuggestionCard suggestionText={suggestion.text} onDismiss={() => setSuggestion(null)} />}
        {error && <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-300 p-3 rounded-md text-center animate-fade-in">{error}</div>}
      </div>

      {/* --- ENTRY LIST --- */}
      <div className="space-y-4">
        {entries?.map((entry: IEntry) => (
          // --- UPGRADED ENTRY CARD ---
          // Added a "frosted glass" effect with backdrop-blur, a subtle border, and hover transitions
          <div
            key={entry.id}
            className="bg-slate-800/50 border border-slate-700 backdrop-blur-sm p-5 rounded-lg shadow-lg transition-all duration-300 hover:border-slate-500 hover:bg-slate-700/50"
          >
            <p className="text-xs text-slate-400 mb-2">{new Date(entry.date).toLocaleString()}</p>
            {/* Added more comfortable line spacing for the entry content */}
            <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
              <button
                onClick={() => entry.id && router.push(`/entry/${entry.id}`)}
                className="text-slate-400 hover:text-white text-sm font-semibold cursor-pointer transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => entry.id && handleDelete(entry.id)}
                className="text-red-500 hover:text-red-400 text-sm cursor-pointer transition-colors"
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