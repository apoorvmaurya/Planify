/**
 * Chat API Route - PlanPal AI Assistant
 * Handles chat messages and maintains conversation history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateChatResponse, ChatMessage } from '@/lib/ai/gemini';

/**
 * POST /api/chat
 * Send a message to PlanPal and get an AI response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, message, groupId } = body;

    // Validate request
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!eventId && !groupId) {
      return NextResponse.json(
        { error: 'Either eventId or groupId is required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create conversation
    let conversation;
    let eventContext = {};

    if (eventId) {
      // Fetch event details for context
      const { data: event } = await supabase
        .from('events')
        .select('title, activity_type, mood, group_id')
        .eq('id', eventId)
        .single();

      if (event) {
        eventContext = {
          title: event.title,
          activityType: event.activity_type,
          mood: event.mood,
        };

        // Get group size
        const { count } = await supabase
          .from('users_groups')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', event.group_id);

        if (count) {
          eventContext = { ...eventContext, groupSize: count };
        }
      }

      // Get existing conversation
      const { data: existingConv } = await supabase
        .from('planpal_conversations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      conversation = existingConv;
    }

    // Prepare messages array
    const messages: ChatMessage[] = conversation?.messages || [];
    messages.push({ role: 'user', content: message });

    // Generate AI response
    const aiResponse = await generateChatResponse(messages, eventContext);

    // Add AI response to messages
    messages.push({ role: 'assistant', content: aiResponse });

    // Save conversation to database
    if (eventId) {
      await supabase
        .from('planpal_conversations')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          messages: messages,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'event_id,user_id'
        });
    }

    return NextResponse.json({
      response: aiResponse,
      conversationId: conversation?.id,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error. Please check GOOGLE_AI_API_KEY.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat?eventId=xxx
 * Retrieve conversation history for an event
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get conversation
    const { data: conversation, error } = await supabase
      .from('planpal_conversations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return NextResponse.json({
      messages: conversation?.messages || [],
      conversationId: conversation?.id,
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat history' },
      { status: 500 }
    );
  }
}

