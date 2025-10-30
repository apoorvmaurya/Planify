'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { decrypt } from '@/lib/crypto';

/**
 * Creates a new event in a group
 * @param eventData - Event data including title, group_id, etc.
 * @returns The created event
 */
export async function createEvent(eventData: {
  group_id: string;
  title: string;
  activity_type?: string | null;
  mood?: string | null;
  scheduled_at?: string | null;
  duration_minutes?: number;
}) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Authentication required');
  }

  // Verify user is a member of the group
  const { data: membership } = await supabase
    .from('users_groups')
    .select('*')
    .eq('group_id', eventData.group_id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    throw new Error('You must be a member of the group to create events');
  }

  // Create the event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      group_id: eventData.group_id,
      title: eventData.title,
      activity_type: eventData.activity_type,
      mood: eventData.mood,
      scheduled_at: eventData.scheduled_at,
      duration_minutes: eventData.duration_minutes || 120,
      created_by: user.id,
    })
    .select()
    .single();

  if (eventError) {
    console.error('Error creating event:', eventError);
    throw new Error(`Failed to create event: ${eventError.message}`);
  }

  revalidatePath(`/dashboard/group/${eventData.group_id}`);
  
  return event;
}

/**
 * Creates a poll from an array of suggestion options
 * @param eventId - The UUID of the event this poll belongs to
 * @param options - Array of option objects containing details like name, address, external_id, etc.
 * @returns The created poll with its options
 */
export async function createPollFromSuggestions(
  eventId: string,
  options: Array<{
    name: string;
    address?: string;
    external_id?: string;
    you_context?: any;
    [key: string]: any;
  }>
) {
  const supabase = createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Authentication required');
  }

  // Create the poll
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .insert({
      event_id: eventId,
      type: 'place',
      status: 'active',
    })
    .select()
    .single();

  if (pollError) {
    console.error('Error creating poll:', pollError);
    throw new Error(`Failed to create poll: ${pollError.message}`);
  }

  // Prepare poll options
  const pollOptions = options.map((option) => ({
    poll_id: poll.id,
    details: option, // This contains name, address, you_context, etc.
    external_id: option.external_id,
  }));

  // Insert poll options
  const { error: optionsError } = await supabase
    .from('poll_options')
    .insert(pollOptions);

  if (optionsError) {
    console.error('Error creating poll options:', optionsError);
    throw new Error(`Failed to create poll options: ${optionsError.message}`);
  }

  // Revalidate the event page to show the new poll
  revalidatePath(`/dashboard/event/${eventId}`);

  return poll;
}

/**
 * Casts a vote for a poll option with an emoji reaction
 * Uses upsert to allow users to change their vote
 * @param pollOptionId - The UUID of the poll option being voted for
 * @param emojiReaction - The emoji reaction (e.g., '👍', '❤️', '🔥')
 */
export async function castVote(pollOptionId: string, emojiReaction: string) {
  const supabase = createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Authentication required');
  }

  // First, check if user has an existing vote for this option
  const { data: existingVote } = await supabase
    .from('poll_votes')
    .select('*')
    .eq('poll_option_id', pollOptionId)
    .eq('user_id', user.id)
    .single();

  if (existingVote) {
    // If user is voting with the same emoji, this is a re-vote (no-op)
    if (existingVote.emoji_reaction === emojiReaction) {
      return; // No need to update
    }

    // Update existing vote (this will require manual poll_results adjustment)
    const { error: updateError } = await supabase
      .from('poll_votes')
      .update({ emoji_reaction: emojiReaction })
      .eq('id', existingVote.id);

    if (updateError) {
      console.error('Vote update error:', updateError);
      throw new Error(`Failed to update vote: ${updateError.message}`);
    }

    // Manually adjust poll_results since we're changing emoji
    await adjustPollResultsForVoteChange(
      supabase,
      pollOptionId,
      existingVote.emoji_reaction,
      emojiReaction
    );
  } else {
    // Insert new vote (trigger will automatically update poll_results)
    const { error: insertError } = await supabase
      .from('poll_votes')
      .insert({
        poll_option_id: pollOptionId,
        user_id: user.id,
        emoji_reaction: emojiReaction,
      });

    if (insertError) {
      console.error('Vote casting error:', insertError);
      throw new Error(`Failed to cast vote: ${insertError.message}`);
    }
  }
}

/**
 * Helper function to adjust poll_results when a user changes their emoji reaction
 * @param supabase - Supabase client
 * @param pollOptionId - The poll option ID
 * @param oldEmoji - The previous emoji reaction
 * @param newEmoji - The new emoji reaction
 */
async function adjustPollResultsForVoteChange(
  supabase: any,
  pollOptionId: string,
  oldEmoji: string,
  newEmoji: string
) {
  // Get current poll_results
  const { data: currentResult } = await supabase
    .from('poll_results')
    .select('*')
    .eq('poll_option_id', pollOptionId)
    .single();

  if (!currentResult) {
    return; // No results to adjust
  }

  const emojiCounts = currentResult.emoji_counts || {};

  // Decrement old emoji count
  if (emojiCounts[oldEmoji]) {
    emojiCounts[oldEmoji] = Math.max(0, emojiCounts[oldEmoji] - 1);
    if (emojiCounts[oldEmoji] === 0) {
      delete emojiCounts[oldEmoji];
    }
  }

  // Increment new emoji count
  emojiCounts[newEmoji] = (emojiCounts[newEmoji] || 0) + 1;

  // Update poll_results
  await supabase
    .from('poll_results')
    .update({
      emoji_counts: emojiCounts,
      updated_at: new Date().toISOString(),
    })
    .eq('poll_option_id', pollOptionId);
}

/**
 * Closes a poll, preventing further votes
 * @param pollId - The UUID of the poll to close
 */
export async function closePoll(pollId: string) {
  const supabase = createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Authentication required');
  }

  const { error } = await supabase
    .from('polls')
    .update({ status: 'closed' })
    .eq('id', pollId);

  if (error) {
    console.error('Error closing poll:', error);
    throw new Error(`Failed to close poll: ${error.message}`);
  }

  // Get the event_id to revalidate the page
  const { data: poll } = await supabase
    .from('polls')
    .select('event_id')
    .eq('id', pollId)
    .single();

  if (poll?.event_id) {
    revalidatePath(`/dashboard/event/${poll.event_id}`);
  }
}

/**
 * Gets poll data with options and results
 * @param pollId - The UUID of the poll
 * @returns Poll data with options and results
 */
export async function getPollData(pollId: string) {
  const supabase = createClient();

  // Get poll details
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('*')
    .eq('id', pollId)
    .single();

  if (pollError || !poll) {
    throw new Error('Poll not found');
  }

  // Get poll options
  const { data: options, error: optionsError } = await supabase
    .from('poll_options')
    .select('*')
    .eq('poll_id', pollId);

  if (optionsError) {
    throw new Error('Failed to fetch poll options');
  }

  // Get poll results for each option
  const optionIds = options?.map((o) => o.id) || [];
  const { data: results, error: resultsError } = await supabase
    .from('poll_results')
    .select('*')
    .in('poll_option_id', optionIds);

  if (resultsError) {
    console.error('Error fetching poll results:', resultsError);
  }

  return {
    ...poll,
    options: options || [],
    results: results || [],
  };
}

/**
 * Finalizes an event by setting the winning poll option as the final place
 * and closing all active polls for that event
 * @param eventId - The UUID of the event to finalize
 * @param winningPollOptionId - The UUID of the winning poll option
 */
export async function finalizeEvent(eventId: string, winningPollOptionId: string) {
  const supabase = createClient();

  const { data: winningOption, error: optionError } = await supabase
    .from('poll_options')
    .select('details')
    .eq('id', winningPollOptionId)
    .single();
  if (optionError) throw optionError;

  const { error: eventUpdateError } = await supabase
    .from('events')
    .update({
      final_place_id: winningOption.details.external_id,
      final_place_details: winningOption.details,
    })
    .eq('id', eventId);
  if (eventUpdateError) throw eventUpdateError;

  await supabase.from('polls').update({ status: 'closed' }).eq('event_id', eventId);

  revalidatePath(`/dashboard/event/${eventId}`);
}

/**
 * Submits or updates a user's RSVP status for an event
 * If status is 'yes', automatically adds the event to the user's calendar
 * @param eventId - The UUID of the event
 * @param status - The RSVP status ('yes', 'no', or 'maybe')
 */
export async function submitRsvp(eventId: string, status: 'yes' | 'no' | 'maybe') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  const { error } = await supabase
    .from('rsvps')
    .upsert({
      event_id: eventId,
      user_id: user.id,
      status: status,
    }, { onConflict: 'event_id, user_id' });
  if (error) throw error;

  if (status === 'yes') {
    await addEventToUserCalendar(user.id, eventId);
  }

  revalidatePath(`/dashboard/event/${eventId}`);
}

/**
 * Helper function to add an event to a user's connected calendar
 * Supports Google Calendar and Microsoft Outlook
 * @param userId - The UUID of the user
 * @param eventId - The UUID of the event
 */
async function addEventToUserCalendar(userId: string, eventId: string) {
  const supabase = createClient();

  const { data: connection } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (!connection) return;

  const { data: event } = await supabase
    .from('events')
    .select('title, scheduled_at, duration_minutes, final_place_details')
    .eq('id', eventId)
    .single();
  if (!event || !event.scheduled_at || !event.duration_minutes) return;

  const startTime = new Date(event.scheduled_at);
  const endTime = new Date(startTime.getTime() + event.duration_minutes * 60000);

  const calendarEvent = {
    summary: event.title,
    location: event.final_place_details?.address || '',
    description: 'Planned with Planora!',
    start: { dateTime: startTime.toISOString(), timeZone: 'UTC' },
    end: { dateTime: endTime.toISOString(), timeZone: 'UTC' },
  };

  try {
    if (connection.provider === 'google') {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: decrypt(connection.access_token_encrypted) });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      await calendar.events.insert({ calendarId: 'primary', requestBody: calendarEvent });
    } else if (connection.provider === 'microsoft') {
      const client = Client.init({ authProvider: (done) => done(null, decrypt(connection.access_token_encrypted)) });
      await client.api('/me/events').post(calendarEvent);
    }
  } catch (error) {
    console.error(`Failed to add event to ${connection.provider} calendar for user ${userId}:`, error);
  }
}

