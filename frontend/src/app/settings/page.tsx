import React from 'react';

const SettingsPage: React.FC = () => {
    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Settings & Privacy</h1>
            <div className="bg-gray-800 p-6 rounded-md shadow-lg space-y-4">
                <h2 className="text-2xl font-semibold">Our Commitment to Your Privacy</h2>
                <p>
                    This journaling application is built with a "privacy-first" principle.
                </p>
                <p>
                    <strong>All of your journal entries are stored locally on your device</strong> using your browser's built-in IndexedDB storage.
                </p>
                <p>
                    Your data is never sent to a central server, and we have no access to your personal thoughts or entries. You are in complete control. The AI analysis features are designed to process data temporarily to provide insights without permanently storing your entries elsewhere.
                </p>
            </div>
        </div>
    );
}

export default SettingsPage;