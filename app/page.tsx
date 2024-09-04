'use client'

import { useState } from 'react';
import { searchExaContent } from '@/actions/exa-actions';
import { createChatCompletion } from '@/actions/openai-actions';
import { Space_Grotesk } from 'next/font/google';
import Image from 'next/image';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

interface SearchResult {
  text: string;
  score?: number;
  url: string;
  title: string | null; // Change this line to allow null
}

const getColorFromString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = Math.floor(Math.abs((Math.sin(hash) * 16777215) % 1) * 16777215).toString(16);
  return '#' + '0'.repeat(6 - color.length) + color;
};

const FaviconPlaceholder = ({ domain }: { domain: string }) => {
  const color = getColorFromString(domain);
  return (
    <div 
      style={{ backgroundColor: color }} 
      className="w-4 h-4 rounded-full mr-2 flex-shrink-0"
    />
  );
};

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
      setSearchResults(result.results.map(r => ({
        ...r,
        title: r.title || 'Untitled' // Provide a default title if it's null
      })));

      const topResults = result.results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);

      const summaryResponse = await createChatCompletion([
        { role: 'system', content: 'You are a helpful assistant that provides structured information. Organize your response into relevant sections based on the query. Use markdown formatting with ## for section headers. For bullet points, use "•" instead of "-". When you use information from a specific source, cite it using [1], [2], etc., corresponding to the order of the sources provided.' },
        { role: 'user', content: `Please provide a comprehensive answer about "${searchQuery}" in a structured format, using appropriate sections. Cite your sources using [1], [2], etc. Here are the sources:\n\n${topResults.map((r, i) => `[${i+1}] ${r.title}: ${r.text}`).join('\n\n')}` }
      ]);

      console.log('Raw OpenAI response:', summaryResponse);

      // Simulate streaming effect
      const words = summaryResponse.message.content.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
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
    const sections = content.split(/(?=## )/);
    return sections.map((section, index) => {
      const [title, ...paragraphs] = section.split('\n');
      return (
        <div key={index} className="mb-6">
          <h3 className="text-xl font-semibold mb-3 text-purple-300">
            {title.replace(/^##\s*/, '')}
          </h3>
          {paragraphs.map((paragraph, pIndex) => (
            <p key={pIndex} className="mb-3 text-gray-300 leading-relaxed">
              {paragraph.split(/(\[[\d,\s]+\])/).map((part, partIndex) => {
                if (part.match(/^\[[\d,\s]+\]$/)) {
                  const sourceNumbers = part.slice(1, -1).split(',').map(num => parseInt(num.trim()) - 1);
                  return (
                    <sup key={partIndex} className="text-purple-400">
                      {sourceNumbers.map((num, i) => (
                        <a
                          key={i}
                          href={searchResults[num]?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 hover:underline"
                        >
                          [{num + 1}]
                        </a>
                      ))}
                    </sup>
                  );
                }
                return part.split(/(\*\*.*?\*\*)/).map((subPart, subPartIndex) => {
                  if (subPart.startsWith('**') && subPart.endsWith('**')) {
                    return <strong key={subPartIndex} className="font-bold">{subPart.slice(2, -2)}</strong>;
                  }
                  if (subPart.trim().startsWith('•')) {
                    return (
                      <span key={subPartIndex} className="block ml-4">
                        <span className="inline-block w-2 h-2 rounded-full bg-purple-400 mr-2"></span>
                        {subPart.trim().slice(1)}
                      </span>
                    );
                  }
                  return subPart;
                });
              })}
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
                {searchResults.slice(0, 5).map((result, index) => {
                  const domain = new URL(result.url).hostname.replace('www.', '');
                  return (
                    <a
                      key={index}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 w-72 bg-gray-800 rounded-md p-3 hover:bg-gray-700 transition duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <h3 className="font-semibold text-sm text-purple-400 mb-2 line-clamp-1">{result.title}</h3>
                        <p className="text-xs text-gray-300 line-clamp-3">{result.text}</p>
                      </div>
                      <div className="flex items-center mt-3 pt-2 border-t border-gray-700">
                        <FaviconPlaceholder domain={domain} />
                        <span className="text-xs text-gray-400 ml-2">{domain}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {(isLoading || summary) && (
          <div className={`bg-gray-800 rounded-md p-6 shadow-lg ${spaceGrotesk.className}`}>
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
