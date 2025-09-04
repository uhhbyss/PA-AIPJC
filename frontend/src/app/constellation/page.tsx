'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { UMAP } from 'umap-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation'

// Recharts components remain the same
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
        const entryDate = new Date(data.date).toLocaleDateString(); // Get the date

        return (
            <div className="p-3 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-w-xs w-64">
                <p className="text-xs text-gray-400 font-semibold mb-1">{entryDate}</p>
                <p className="text-gray-300 text-sm mb-3">
                    {data.content.substring(0, 150)}...
                </p>
                <Link
                    href={`/entry/${data.id}`}
                    className="text-center block w-full text-sm text-blue-400 hover:underline"
                >
                    View or Edit Entry &rarr;
                </Link>
            </div>
        );
    }
    return null;
};

const ConstellationPage = () => {
    const router = useRouter();


    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [progressText, setProgressText] = useState('Initializing...');
    const processingRef = useRef(false);

    useEffect(() => {
        if (processingRef.current) return;
        processingRef.current = true;

        const generateConstellation = async () => {
            try {
                setProgressText('Fetching journal entries...');
                const entries = await db.entries.toArray();
                if (entries.length < 5) {
                    setProgressText(`Not enough entries. You need at least 5. You have ${entries.length}.`);
                    setIsLoading(false);
                    return;
                }

                // Send entries to the backend for AI processing
                setProgressText('Analyzing entries with backend AI...');
                const response = await fetch('http://localhost:5001/api/process_for_constellation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entries: entries }),
                });
                if (!response.ok) throw new Error("Backend processing failed.");

                const processedData = await response.json();
                const vectors = processedData.map((d: any) => d.vector);

                // Run dimensionality reduction (still on-device processing - important!!!)
                setProgressText('Mapping the constellation...');
                const umap = new UMAP({ nNeighbors: Math.min(4, entries.length - 1), minDist: 0.1, nComponents: 2 });
                const coordinates = umap.fit(vectors);

                // Format data 
                setProgressText('Finalizing visualization...');
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
                setProgressText('An error occurred. Please ensure the backend is running and check the console.');
            } finally {
                setIsLoading(false);
            }
        };

        generateConstellation();
    }, []);

    if (isLoading) {
        return (
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">Building Your Thought Constellation...</h1>
                <p className="text-gray-400">{progressText}</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Your Thought Constellation</h1>
            <p className="text-gray-400 mb-6">Each star is a journal entry. Entries with similar meanings are closer together. Hover over a star to see a preview.</p>
            <div className="flex items-center justify-center gap-6 mb-4 text-sm">
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
                            // Make the cursor a pointer to show it's clickable
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