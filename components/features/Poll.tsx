'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { castVote } from '@/actions/events';

interface PollOption {
  id: string;
  details: {
    name: string;
    address?: string;
    you_context?: any;
    [key: string]: any;
  };
  external_id?: string;
}

interface PollResult {
  poll_option_id: string;
  total_votes: number;
  emoji_counts: Record<string, number>;
  updated_at: string;
}

interface PollData {
  id: string;
  event_id: string;
  type: string;
  status: string;
  options: PollOption[];
  results: PollResult[];
}

export function Poll({ pollData }: { pollData: PollData }) {
  const [results, setResults] = useState<PollResult[]>(pollData.results);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('👍');
  const [votingInProgress, setVotingInProgress] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Build the filter for all option IDs in this poll
    const optionIds = pollData.options.map((o) => o.id).join(',');
    
    const channel = supabase
      .channel(`poll-results-${pollData.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_results',
          filter: `poll_option_id=in.(${optionIds})`,
        },
        (payload) => {
          const newResult = payload.new as PollResult;
          
          setResults((currentResults) => {
            // Check if this option already exists in results
            const existingIndex = currentResults.findIndex(
              (r) => r.poll_option_id === newResult.poll_option_id
            );
            
            if (existingIndex !== -1) {
              // Update existing result
              const updatedResults = [...currentResults];
              updatedResults[existingIndex] = newResult;
              return updatedResults;
            } else {
              // Add new result
              return [...currentResults, newResult];
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollData.id, pollData.options, supabase]);

  const handleVote = async (optionId: string) => {
    try {
      setVotingInProgress(optionId);
      await castVote(optionId, selectedEmoji);
    } catch (error) {
      console.error('Failed to cast vote:', error);
      alert('Failed to cast vote. Please try again.');
    } finally {
      setVotingInProgress(null);
    }
  };

  const emojiOptions = ['👍', '❤️', '🔥', '🎉', '👎', '🤔'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm font-medium text-gray-700">Select your reaction:</label>
        <div className="flex gap-2">
          {emojiOptions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setSelectedEmoji(emoji)}
              className={`text-2xl p-2 rounded-lg transition-all ${
                selectedEmoji === emoji
                  ? 'bg-blue-100 ring-2 ring-blue-500 scale-110'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {pollData.options.map((option) => {
          const result = results.find((r) => r.poll_option_id === option.id);
          const totalVotes = result?.total_votes || 0;
          const emojiCounts = result?.emoji_counts || {};

          return (
            <div
              key={option.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {option.details.name}
                  </h3>
                  {option.details.address && (
                    <p className="text-sm text-gray-600 mt-1">
                      {option.details.address}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleVote(option.id)}
                  disabled={votingInProgress === option.id || pollData.status !== 'active'}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    pollData.status !== 'active'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : votingInProgress === option.id
                      ? 'bg-blue-400 text-white cursor-wait'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {votingInProgress === option.id ? 'Voting...' : `Vote ${selectedEmoji}`}
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Total Votes:</span>
                  <span className="text-lg font-bold text-blue-600">{totalVotes}</span>
                </div>

                {Object.keys(emojiCounts).length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(emojiCounts).map(([emoji, count]) => (
                      <div
                        key={emoji}
                        className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"
                      >
                        <span className="text-base">{emoji}</span>
                        <span className="text-sm font-medium text-gray-700">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pollData.status === 'closed' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800 font-medium">This poll is closed</p>
        </div>
      )}
    </div>
  );
}

