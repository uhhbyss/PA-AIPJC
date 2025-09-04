// This file contains a rich set of sample journal entries for testing.

interface SeedEntry {
    content: string;
    date: Date;
}

// Helper function to create dates in the past
const daysAgo = (days: number): Date => {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
};

export const seedEntries: SeedEntry[] = [
    // --- Cluster 1: Work Stress (Negative) ---
    { content: "This new project is a terrible mess. I feel completely overwhelmed and the deadline feels impossible.", date: daysAgo(20) },
    { content: "Had an awful meeting about the project today. It feels like we're just going in circles with no real progress.", date: daysAgo(18) },
    { content: "I hate how much stress this project is causing me. It's all I can think about, even after work.", date: daysAgo(17) },
    { content: "Feeling really burnt out from this project. I need a break but the pressure is intense.", date: daysAgo(15) },
    { content: "My manager is not helping with the project situation. The lack of support is frustrating.", date: daysAgo(14) },

    // --- Cluster 2: New Hobby - Gardening (Positive) ---
    { content: "Decided to start a small herb garden on the balcony. Feeling excited about a new hobby!", date: daysAgo(19) },
    { content: "Spent the afternoon planting basil and mint. It was so peaceful and rewarding to work with my hands.", date: daysAgo(16) },
    { content: "The first little sprouts in my garden are showing! It's amazing to see new life growing.", date: daysAgo(12) },
    { content: "Watering my garden this morning was a perfect, mindful start to the day. The smell of fresh mint is wonderful.", date: daysAgo(8) },
    { content: "I love my little garden. It's become my happy place, a small green escape from everything else.", date: daysAgo(3) },

    // --- Cluster 3: Relationship Reflections (Mixed Sentiment) ---
    { content: "Had a long talk with Alex last night. It was difficult but necessary. A lot on my mind.", date: daysAgo(22) },
    { content: "Thinking about my conversation with Alex. Communication can be so challenging sometimes.", date: daysAgo(21) },
    { content: "Alex sent a really nice message today. It felt good to reconnect on a positive note.", date: daysAgo(11) },
    { content: "Feeling grateful for my friendship with Alex. We've been through a lot together.", date: daysAgo(5) },

    // --- Cluster 4: Health & Wellness (Mixed) ---
    { content: "My sleep was terrible last night. I feel so groggy and unfocused today.", date: daysAgo(25) },
    { content: "I hate not being able to get a good night's sleep. It really affects my whole day.", date: daysAgo(24) },
    { content: "Went for a run this morning and it felt incredible. My energy is so much better.", date: daysAgo(10) },
    { content: "Trying to eat healthier this week. It's tough but I know my body will thank me for it.", date: daysAgo(6) },

    // --- Standalone Entries (Stray Stars) ---
    { content: "Watched a fascinating documentary about space. The universe is so vast and beautiful.", date: daysAgo(13) },
    { content: "The weather was amazing today, perfect for a walk.", date: daysAgo(7) },
    { content: "Finished a really great book. The ending was perfect.", date: daysAgo(2) },
];