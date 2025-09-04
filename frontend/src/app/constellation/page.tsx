'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { UMAP } from 'umap-js';
import { useRouter } from 'next/navigation';

// Recharts components
import {
    ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface ChartDataPoint {
    id: number;
    x: number;
    y: number;
    content: string;
    sentiment: number;
    date: string;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const entryDate = new Date(data.date).toLocaleDateString();

        return (
            <div className="p-3 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-w-xs w-64">
                <p className="text-xs text-gray-400 font-semibold mb-1">{entryDate}</p>
                <p className="text-gray-300 text-sm mb-3">
                    {data.content.substring(0, 150)}...
                </p>
                {/* Note: This link is part of a non-working feature from the history. 
            If the /entry/[id] page exists, this will work. */}
                <a href={`/entry/${data.id}`} className="text-center block w-full text-sm text-blue-400 hover:underline">
                    View Entry &rarr;
                </a>
            </div>
        );
    }
    return null;
};

// // A simple seeded PRNG to make the UMAP layout deterministic
// const seededRandom = () => {
//     let seed = 12345;
//     return () => {
//         seed = (seed * 9301 + 49297) % 233280;
//         return seed / 233280;
//     };
// };

const ConstellationPage = () => {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- CORRECTED STATE ---
    const [progress, setProgress] = useState({ text: 'Initializing...', percentage: 0 });

    const processingRef = useRef(false);
    const router = useRouter();

    useEffect(() => {
        if (processingRef.current) return;
        processingRef.current = true;

        const generateConstellation = async () => {
            try {
                setProgress({ text: 'Fetching journal entries...', percentage: 10 });
                const entries = await db.entries.toArray();
                if (entries.length < 5) {
                    setProgress({ text: `Not enough entries. You need at least 5. You have ${entries.length}.`, percentage: 100 });
                    setIsLoading(false);
                    return;
                }

                setProgress({ text: 'Analyzing entries with backend AI...', percentage: 30 });
                const response = await fetch('http://localhost:5001/api/process_for_constellation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entries: entries }),
                });
                if (!response.ok) throw new Error("Backend processing failed.");

                const processedData = await response.json();
                const vectors = processedData.map((d: any) => d.vector);

                setProgress({ text: 'Mapping the constellation...', percentage: 60 });
                const umap = new UMAP({
                    nNeighbors: Math.min(4, entries.length - 1),
                    minDist: 0.1,
                    nComponents: 2,
                    // random: seededRandom()
                });
                const coordinates = umap.fit(vectors);

                setProgress({ text: 'Finalizing visualization...', percentage: 95 });
                const formattedData = processedData.map((data: any, i: number) => ({
                    id: data.id,
                    x: coordinates[i][0],
                    y: coordinates[i][1],
                    content: data.content,
                    sentiment: data.sentiment,
                    date: data.date,
                }));

                setChartData(formattedData);
            } catch (error) {
                console.error("Failed to generate constellation:", error);
                setProgress({ text: 'An error occurred. Please ensure the backend is running and check the console.', percentage: 100 });
            } finally {
                setIsLoading(false);
            }
        };

        generateConstellation();
    }, []);

    if (isLoading) {
        return (
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-4 animate-sweep-up" style={{ animationDelay: '100ms' }}>
                    Building Your Thought Constellation...
                </h1>
                <p className="text-gray-400 animate-sweep-up" style={{ animationDelay: '200ms' }}>
                    {progress.text}
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4 animate-sweep-up" style={{ animationDelay: '300ms' }}>
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2 animate-sweep-up" style={{ animationDelay: '100ms' }}>Your Thought Constellation</h1>
            <p className="text-gray-400 mb-6 animate-sweep-up" style={{ animationDelay: '200ms' }}>Each star is a journal entry. Entries with similar meanings are closer together. Hover over a star to see a preview.</p>
            <div className="flex items-center justify-center gap-6 mb-4 text-sm animate-sweep-up" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                    <span>Positive / Neutral Entry</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    <span>Negative Entry</span>
                </div>
            </div>
            <div style={{ width: '100%', height: '70vh' }}>
                <ResponsiveContainer>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis type="number" dataKey="x" tick={false} axisLine={false} />
                        <YAxis type="number" dataKey="y" tick={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter
                            name="Entries"
                            data={chartData}
                            fill="#8884d8"
                            onClick={(data) => router.push(`/entry/${data.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            {chartData.map((entry) => (
                                <Cell key={`cell-${entry.id}`} fill={entry.sentiment < -0.05 ? '#f97316' : '#8b5cf6'} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ConstellationPage;