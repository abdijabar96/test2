import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

const App = () => {
    const [topic, setTopic] = useState('');
    const [titles, setTitles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateTitles = async () => {
        if (!topic.trim()) {
            setError('Please enter a video topic.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setTitles([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Generate 5 catchy, viral, and SEO-friendly YouTube titles for a video about: "${topic}".`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            titles: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.STRING
                                }
                            }
                        }
                    },
                },
            });
            
            const jsonResponse = JSON.parse(response.text);
            if (jsonResponse.titles && Array.isArray(jsonResponse.titles)) {
                setTitles(jsonResponse.titles);
            } else {
                setError("Received an unexpected format from the API.");
            }

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate titles. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>&#127916; YouTube Title Generator</h1>
            <p>Describe your video topic and let AI generate catchy titles for you!</p>
            <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., 'A 10-minute workout for busy people' or 'Unboxing the new SuperPhone X'"
                aria-label="Video topic input"
                disabled={isLoading}
            />
            <button onClick={generateTitles} disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate Titles'}
            </button>

            {isLoading && <div className="loader" aria-label="Loading"></div>}

            {error && <p className="error" role="alert">{error}</p>}

            {titles.length > 0 && (
                <div className="results">
                    <h2>Generated Titles</h2>
                    <ul>
                        {titles.map((title, index) => (
                            <li key={index}>{title}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
