'use client'

import { useState, useEffect } from 'react';
import { searchExaContent } from '@/actions/exa-actions';
import { createChatCompletion } from '@/actions/openai-actions';
import { Inter, Space_Grotesk } from 'next/font/google';
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

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
  const [isLoading, setIsLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');

  const handleSearch = async () => {
    console.log('Search query:', searchQuery);
    setIsLoading(true);
    setStreamedText('');
    setSummary('');
    
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
        { role: 'system', content: 'You are a helpful assistant that provides structured information. Always organize your response into the following sections: "About", "Early Career", "Notable Achievements", "Awards", and "Current Status". If a section is not applicable, you may omit it.' },
        { role: 'user', content: `Please provide information about ${searchQuery} in a structured format:\n\n${combinedText}` }
      ]);

      console.log('Raw OpenAI response:', summaryResponse);
      console.log('OpenAI generated summary:', summaryResponse.message.content);

      // Simulate streaming effect
      const words = summaryResponse.message.content.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Adjust delay as needed
        setStreamedText(prev => prev + ' ' + words[i]);
      }

      setSummary(summaryResponse.message.content);
    } catch (error) {
      console.error('Error in handleSearch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSummary = (content: string) => {
    const sections = content.split('\n\n');
    return sections.map((section, index) => {
      const [title, ...paragraphs] = section.split('\n');
      return (
        <div key={index} className="mb-6">
          <h3 className="text-xl font-semibold mb-3 text-purple-300">
            {title.replace(/^#+\s*/, '')}
          </h3>
          {paragraphs.map((paragraph, pIndex) => (
            <p key={pIndex} className="mb-3 text-gray-300 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      );
    });
  };

  const renderSkeletonLoader = () => {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-4/5 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-gray-900 text-white p-8 font-sans`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center">
          <Image
            src="/favicon.ico"
            alt="Perplexity AI Logo"
            width={40}
            height={40}
            className="mr-3"
          />
          <h1 className={`text-3xl font-bold text-purple-400 ${spaceGrotesk.className}`}>Perplexity AI (clone)</h1>
        </div>
        <p className="text-gray-400 mb-8">Where knowledge begins</p>
        <div className="flex mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800 text-white border-2 border-purple-500 p-3 flex-grow rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            placeholder="Ask anything..."
          />
          <button
            onClick={handleSearch}
            className="bg-purple-500 text-white p-3 rounded-r-md hover:bg-purple-600 transition duration-200 flex items-center justify-center"
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">Sources</h2>
            <div className="overflow-x-auto">
              <div className="flex space-x-4 pb-4">
                {searchResults.slice(0, 5).map((result, index) => (
                  <a
                    key={index}
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-64 bg-gray-800 rounded-md p-3 hover:bg-gray-700 transition duration-200"
                  >
                    <h3 className="font-semibold text-sm text-purple-400 truncate">{result.title}</h3>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2">{result.text}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {(isLoading || summary) && (
          <div className="bg-gray-800 rounded-md p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-purple-400">Answer</h2>
            <div className="prose prose-invert max-w-none">
              {isLoading ? (
                <>
                  {streamedText && renderSummary(streamedText)}
                  {renderSkeletonLoader()}
                </>
              ) : (
                renderSummary(summary)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
