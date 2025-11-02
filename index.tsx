import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Define the AIStudio interface to resolve type conflicts with other global declarations.
interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
}

// Declare a global interface for window.aistudio to provide type safety.
declare global {
    interface Window {
        aistudio?: AIStudio;
    }
}

const App = () => {
    const [topic, setTopic] = useState('');
    const [titles, setTitles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setApiKeySelected(hasKey);
            }
        };
        checkApiKey();
    }, []);

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
            if (errorMessage.includes('API Key must be set') || errorMessage.includes('Requested entity was not found')) {
                setError('Your API key appears to be invalid. Please select a valid key.');
                setApiKeySelected(false);
            } else {
                setError(`Failed to generate titles. ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true);
            setError(null);
        }
    };

    if (!apiKeySelected) {
        return (
            <div className="container">
                <h1>&#128273; API Key Required</h1>
                <p>To use the YouTube Title Generator, please select your Gemini API key. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer">Learn about billing.</a></p>
                <button onClick={handleSelectKey}>Select API Key</button>
                {error && <p className="error" role="alert">{error}</p>}
            </div>
        );
    }

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
