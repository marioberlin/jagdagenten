export interface WebSearchResult {
    title: string;
    url: string;
    snippet: string;
}

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Perform a real web search using DuckDuckGo HTML version.
 * We fetch the HTML and use the LLM to parse it for maximum robustness against 
 * changing DOM structures or scraper blocks.
 */
export async function searchWeb(query: string, limit: number = 5): Promise<WebSearchResult[]> {
    try {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`DDG HTML search failed: ${response.status}`);
        }

        const html = await response.text();

        // Use Gemini to parse the HTML and return a clean JSON array
        // We take a large chunk of the body where results usually are
        const cleanHtml = html.substring(0, 50000); // Plenty for first page

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Use faster/cheaper model for extraction
        const prompt = `
            Extract the search results from the following DuckDuckGo HTML.
            Return a JSON array of up to ${limit} objects with "title", "url", and "snippet".
            
            HTML:
            ${cleanHtml}
            
            Only return the JSON array.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        try {
            const jsonMatch = text.match(/\[.*\]/s);
            const jsonString = jsonMatch ? jsonMatch[0] : text;
            const parsedResults = JSON.parse(jsonString);

            if (Array.isArray(parsedResults)) {
                return parsedResults.slice(0, limit).map(r => ({
                    title: r.title || 'No Title',
                    url: r.url || '#',
                    snippet: r.snippet || ''
                }));
            }
        } catch (parseErr) {
            console.error("Gemini Search Extraction Failed:", parseErr, text);
        }

    } catch (error) {
        console.error("Search API Error:", error);
    }

    return [];
}
