'use client'

import { useState } from 'react';
import { searchExaContent } from '@/actions/exa-actions';
import { createChatCompletion } from '@/actions/openai-actions';

interface SearchResult {
  text: string;
  score?: number;
  url: string;
  title: string;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [summary, setSummary] = useState<string>('');

  const handleSearch = async () => {
    console.log('Search query:', searchQuery);
    
    try {
      const result = await searchExaContent(searchQuery);
      console.log('Full Exa search results:', result);
      setSearchResults(result.results);

      // Access the results array and sort it
      const topResults = result.results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
      console.log('Top 5 Exa results:', topResults);
      
      // Combine text from top 5 results
      const combinedText = topResults.map(r => r.text).join('\n\n');
      console.log('Combined text for OpenAI:', combinedText);

      // Generate summary using OpenAI
      const summaryResponse = await createChatCompletion([
        { role: 'system', content: 'You are a helpful assistant that summarizes information.' },
        { role: 'user', content: `Please summarize the following information:\n\n${combinedText}` }
      ]);

      console.log('Raw OpenAI response:', summaryResponse);
      console.log('OpenAI generated summary:', summaryResponse.message.content);

      setSummary(summaryResponse.message.content);
    } catch (error) {
      console.error('Error in handleSearch:', error);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 flex-grow rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your search query"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600 transition duration-200"
        >
          Search
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <div className="flex space-x-4 pb-2">
            {searchResults.map((result, index) => (
              <a
                key={index}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-64 border rounded-md p-3 hover:shadow-md transition duration-200 bg-white"
              >
                <h3 className="font-semibold mb-1 text-sm truncate">{result.title}</h3>
                <p className="text-xs text-gray-600 line-clamp-2">{result.text}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {summary && (
        <div className="bg-gray-100 rounded-md p-4">
          <h2 className="text-lg font-semibold mb-2">AI-Generated Summary:</h2>
          <p className="text-sm text-gray-800">{summary}</p>
        </div>
      )}
    </div>
  );
}
