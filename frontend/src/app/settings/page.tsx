'use client';

import React, { useState } from 'react';
import { db } from '@/lib/db';
import { seedEntries } from '@/lib/seedData';
import { useSettings } from '@/context/SettingsContext';

const AIModeButton = ({ mode, currentMode, setMode, children }: any) => {
    const isActive = mode === currentMode;
    return (
        <button
            onClick={() => setMode(mode)}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${isActive
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
        >
            {children}
        </button>
    );
};



const SettingsPage: React.FC = () => {
    const [message, setMessage] = useState<string | null>(null);
    const { aiMode, setAiMode } = useSettings();

    const handleSeedDatabase = async () => {
        const isConfirmed = window.confirm(
            "Are you sure? This will DELETE all your current entries and loops and replace them with test data."
        );

        if (isConfirmed) {
            try {
                setMessage("Wiping database...");
                await db.entries.clear();
                await db.activeLoops.clear();

                setMessage("Adding sample entries...");
                await db.entries.bulkAdd(seedEntries);

                setMessage(`Success! ${seedEntries.length} sample entries have been added to your journal.`);
            } catch (error) {
                console.error("Failed to seed database:", error);
                setMessage("An error occurred. Check the console for details.");
            }
        }
    };

    const handleDeleteAll = async () => {
        const isConfirmed = window.confirm(
            "ARE YOU SURE?\n\nThis will permanently delete all of your journal entries and AI-detected thought loops. This action cannot be undone."
        );

        if (isConfirmed) {
            try {
                setMessage("Deleting all data...");
                await db.entries.clear();
                await db.activeLoops.clear();
                setMessage("All your data has been successfully deleted.");
            } catch (error) {
                console.error("Failed to delete all data:", error);
                setMessage("An error occurred. Could not delete all data.");
            }
        }
    };



    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Settings & Privacy</h1>
            <div className="bg-gray-800 p-6 rounded-md shadow-lg space-y-4 mb-8">
                <h2 className="text-2xl font-semibold">Our Commitment to Your Privacy</h2>
                <p>
                    All of your journal entries are stored locally on your device using your browser's IndexedDB storage. Your data is never sent to a central server, and we have no access to your personal thoughts.
                </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg space-y-4 mb-8">
                <h2 className="text-2xl font-semibold font-heading">AI Response Style</h2>
                <p className="text-slate-400">
                    Choose the kind of insights you'd like to receive. This will tailor the AI's suggestions to your preferred style of reflection.
                </p>
                <div className="flex flex-wrap gap-3">
                    <AIModeButton mode="auto" currentMode={aiMode} setMode={setAiMode}>Auto (Default)</AIModeButton>
                    <AIModeButton mode="reframing" currentMode={aiMode} setMode={setAiMode}>Reframing</AIModeButton>
                    <AIModeButton mode="emotional_exploration" currentMode={aiMode} setMode={setAiMode}>Exploration</AIModeButton>
                    <AIModeButton mode="action_oriented" currentMode={aiMode} setMode={setAiMode}>Action-Oriented</AIModeButton>
                </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg space-y-4 mb-8">
                <h2 className="text-2xl font-semibold font-heading">Data Management</h2>
                <p className="text-slate-400 ">
                    You are in complete control of your data. You can delete all your journal entries and analysis history at any time.
                </p>
                <div>
                    <button
                        onClick={handleDeleteAll}
                        className="px-6 py-2 bg-red-800 hover:bg-red-700 text-white rounded-md font-bold transition-colors"
                    >
                        Delete All Entries & Data
                    </button>
                </div>
            </div>

            {/* ---Testing Tools Section --- */}
            <div className="bg-yellow-900/30 border border-yellow-500 p-6 rounded-md shadow-lg space-y-4">
                <h2 className="text-2xl font-semibold text-yellow-300">Developer Tools</h2>
                <p className="text-yellow-400">
                    Use this button to populate your journal with a large set of sample data. This is useful for testing the 'Thought Constellation' visualization.
                </p>
                <p className="font-bold text-red-400">Warning: This will delete all your current entries.</p>
                <button
                    onClick={handleSeedDatabase}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-bold"
                >
                    Seed Database with Test Data
                </button>
                {message && <p className="mt-4 text-green-300">{message}</p>}
            </div>
        </div>
    );
}

export default SettingsPage;