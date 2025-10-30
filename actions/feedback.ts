'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Submits user feedback for a past event
 * Creates a structured user_preference_signals record based on the rating
 * @param eventId - The UUID of the event being rated
 * @param rating - Rating from 1-5 stars
 * @param tags - Optional array of tags for additional context (reserved for future use)
 */
export async function submitFeedback(
  eventId: string,
  rating: number,
  tags: string[] = []
) {
  const supabase = createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Authentication required");
  }

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Retrieve event details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('final_place_details')
    .eq('id', eventId)
    .single();

  if (eventError) {
    console.error('Error fetching event:', eventError);
    throw new Error("Failed to fetch event details");
  }

  if (!event || !event.final_place_details) {
    throw new Error("Event not found or not finalized");
  }

  // Extract venue details
  const venueDetails = event.final_place_details;
  
  // Create structured preference signal
  const signal = {
    user_id: user.id,
    signal_type: 'venue_rating',
    venue_type: venueDetails.type || null,
    venue_id: venueDetails.external_id || null,
    venue_details: venueDetails,
    positive_signal: rating > 3,
    // Weight calculation: 5-star = 1.5, 4-star = 1.25, 3-star = 1.0, 2-star = 0.75, 1-star = 0.5
    weight: 1.0 + (rating - 3) * 0.25,
  };

  // Insert preference signal into database
  const { error: insertError } = await supabase
    .from('user_preference_signals')
    .insert(signal);

  if (insertError) {
    console.error('Error inserting preference signal:', insertError);
    throw new Error(`Failed to save feedback: ${insertError.message}`);
  }

  // Update the event with the rating
  const { error: updateError } = await supabase
    .from('events')
    .update({ post_event_rating: rating })
    .eq('id', eventId);

  if (updateError) {
    console.error('Error updating event rating:', updateError);
    // Non-critical error, don't throw
  }

  // Revalidate the event page
  revalidatePath(`/dashboard/event/${eventId}`);

  return { success: true };
}

