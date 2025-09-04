import React from 'react';

// Define the props the component will accept
interface SuggestionCardProps {
    suggestionText: string;
    onDismiss: () => void; // A function to handle closing the card
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestionText, onDismiss }) => {
    return (
        <div className="bg-blue-900/50 border-2 border-blue-500 p-4 rounded-lg shadow-lg relative mb-6 animate-fade-in">
            <button
                onClick={onDismiss}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                aria-label="Dismiss suggestion"
            >
                &times; {/* This is a simple 'X' icon */}
            </button>
            <h3 className="text-lg font-semibold text-blue-300 mb-2">An Insight For You</h3>
            <p className="text-gray-200">{suggestionText}</p>
        </div>
    );
};

export default SuggestionCard;