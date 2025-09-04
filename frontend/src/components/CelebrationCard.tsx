import React from 'react';

interface CelebrationCardProps {
    topic: string;
    onDismiss: () => void;
}

const CelebrationCard: React.FC<CelebrationCardProps> = ({ topic, onDismiss }) => {
    return (
        <div className="bg-green-900/50 border-2 border-green-500 p-4 rounded-lg shadow-lg relative mb-6 animate-fade-in">
            <button
                onClick={onDismiss}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                aria-label="Dismiss message"
            >
                &times;
            </button>
            <h3 className="text-lg font-semibold text-green-300 mb-2">Celebrating Your Progress 🌟</h3>
            <p className="text-gray-200">
                It's been a while since you've written about **"{topic}"**.
                That's a huge step. Take a moment to recognize your own progress and growth.
            </p>
        </div>
    );
};

export default CelebrationCard;