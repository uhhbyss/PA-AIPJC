'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type IEntry } from '@/lib/db';
import { useState } from 'react';
import SuggestionCard from '@/components/SuggestionCard';
import CelebrationCard from '@/components/CelebrationCard';
import { useRouter } from 'next/navigation'

type Suggestion = {
  text: string;
};

type Celebration = {
  topic: string;
};

const HomePage: React.FC = () => {
  const router = useRouter();
  const entries = useLiveQuery(() => db.entries.orderBy('date').reverse().toArray());

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCloudAI, setIsCloudAI] = useState<boolean>(false);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      await db.entries.delete(id);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    setCelebration(null);

    // --- RESOLUTION DETECTION LOGIC ---
    // const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 0.001 * 24 * 60 * 60 * 1000);
    const activeLoops = await db.activeLoops.where('status').equals('active').toArray();

    for (const loop of activeLoops) {
      if (loop.lastSeenDate < sevenDaysAgo) {
        // Double-check: has the topic really not appeared in recent entries?
        const recentMention = await db.entries
          .where('date').above(sevenDaysAgo)
          .and(entry => entry.content.toLowerCase().includes(loop.topic))
          .first();

        if (!recentMention) {
          // It's resolved!
          await db.activeLoops.update(loop.id!, { status: 'resolved' });
          setCelebration({ topic: loop.topic });
          setIsLoading(false);
          return; // Show the celebration and stop.
        }
      }
    }

    // --- LOOP DETECTION LOGIC (IF NO RESOLUTIONS FOUND) ---
    try {
      const recentEntries = await db.entries.orderBy('date').reverse().limit(10).toArray();
      if (recentEntries.length < 3) {
        setError("You need at least 3 journal entries for an analysis.");
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: recentEntries, useCloudAI: isCloudAI }),
      });
      if (!response.ok) throw new Error("Server response wasn't OK.");

      const data = await response.json();
      const detectedLoop = data.detectedLoop;

      if (detectedLoop) {
        // setSuggestion({ text: detectedLoop.suggestionText });

        // --- DATABASE UPDATE LOGIC ---
        const existingLoop = await db.activeLoops.get({ topic: detectedLoop.topic });

        // NEW: Check the status of the existing loop
        if (existingLoop) {
          // If the loop was already resolved, don't show a new suggestion.
          // This creates a "cooldown" period. Instead, show a gentle message.
          if (existingLoop.status === 'resolved') {
            setError(`It looks like '${detectedLoop.topic}' is on your mind again. That's okay, progress isn't always a straight line.`);
          } else {
            // If it's still active, just update its last seen date and show the suggestion.
            await db.activeLoops.update(existingLoop.id!, { lastSeenDate: new Date() });
            setSuggestion({ text: detectedLoop.suggestionText });
          }
        } else {
          // If it's a brand new loop, add it and show the suggestion.
          await db.activeLoops.add({
            topic: detectedLoop.topic,
            startDate: new Date(),
            lastSeenDate: new Date(),
            status: 'active',
          });
          setSuggestion({ text: detectedLoop.suggestionText });
        }
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
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 text-sm">
            <label htmlFor="ai-toggle" className="text-gray-400">Local AI</label>
            <button id="ai-toggle" onClick={() => setIsCloudAI(!isCloudAI)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCloudAI ? 'bg-purple-600' : 'bg-gray-600'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCloudAI ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <label htmlFor="ai-toggle" className="text-gray-200">Cloud AI</label>
          </div>
          <button onClick={handleAnalyze} disabled={isLoading} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">
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

// debugging only
if (typeof window !== 'undefined') {
  (window as any).db = db;
}

export default HomePage;