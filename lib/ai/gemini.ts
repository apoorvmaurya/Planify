/**
 * Google Generative AI (Gemini) Integration
 * Provides AI-powered trip planning assistance through PlanPal chatbot
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

/**
 * Get the Gemini model instance
 * Uses gemini-pro for text generation
 */
export function getModel() {
  return genAI.getGenerativeModel({ model: 'gemini-pro' });
}

/**
 * Interface for chat messages
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Generate a chat response using conversation history
 * @param messages - Array of previous messages in the conversation
 * @param eventContext - Optional context about the event being planned
 * @returns The AI-generated response text
 */
export async function generateChatResponse(
  messages: ChatMessage[],
  eventContext?: {
    title?: string;
    activityType?: string;
    mood?: string;
    groupSize?: number;
    location?: string;
  }
): Promise<string> {
  const model = getModel();

  // Build system context
  let systemPrompt = `You are PlanPal, an AI assistant specialized in helping people plan events and activities. 
You are friendly, helpful, and provide practical suggestions for places, activities, and logistics.
You understand travel times, budgets, and group preferences.`;

  if (eventContext) {
    systemPrompt += `\n\nCurrent Event Context:`;
    if (eventContext.title) systemPrompt += `\n- Event: ${eventContext.title}`;
    if (eventContext.activityType) systemPrompt += `\n- Activity Type: ${eventContext.activityType}`;
    if (eventContext.mood) systemPrompt += `\n- Mood: ${eventContext.mood}`;
    if (eventContext.groupSize) systemPrompt += `\n- Group Size: ${eventContext.groupSize} people`;
    if (eventContext.location) systemPrompt += `\n- Location: ${eventContext.location}`;
  }

  // Convert messages to Gemini format
  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  // Start chat with history
  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'I understand! I\'m ready to help plan your event.' }],
      },
      ...history,
    ],
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    },
  });

  // Send the latest message
  const latestMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(latestMessage.content);
  const response = await result.response;
  
  return response.text();
}

/**
 * Generate place recommendations based on preferences
 * @param preferences - User preferences for the recommendation
 * @returns Structured recommendation with reasoning
 */
export async function generatePlaceRecommendations(preferences: {
  activityType: string;
  mood: string;
  budget?: string;
  cuisine?: string;
  location?: string;
  groupSize?: number;
}): Promise<string> {
  const model = getModel();

  const prompt = `As an event planning expert, recommend 3-5 specific types of places or venues for the following requirements:

Activity Type: ${preferences.activityType}
Mood: ${preferences.mood}
${preferences.budget ? `Budget: ${preferences.budget}` : ''}
${preferences.cuisine ? `Cuisine Preference: ${preferences.cuisine}` : ''}
${preferences.location ? `Location Area: ${preferences.location}` : ''}
${preferences.groupSize ? `Group Size: ${preferences.groupSize} people` : ''}

Provide:
1. Venue type recommendations
2. Why each would be a good fit
3. What to look for when choosing
4. Any tips for the group

Keep it concise and practical.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  return response.text();
}

/**
 * Generate event planning suggestions based on constraints
 * @param constraints - Planning constraints and requirements
 * @returns AI-generated planning suggestions
 */
export async function generateEventSuggestions(constraints: {
  availableTimeSlots?: string[];
  memberLocations?: string[];
  preferences?: string[];
  budget?: string;
}): Promise<string> {
  const model = getModel();

  const prompt = `Help plan an event with these constraints:

${constraints.availableTimeSlots?.length ? `Available Time Slots:\n${constraints.availableTimeSlots.map(slot => `- ${slot}`).join('\n')}` : ''}
${constraints.memberLocations?.length ? `\nMember Locations:\n${constraints.memberLocations.map(loc => `- ${loc}`).join('\n')}` : ''}
${constraints.preferences?.length ? `\nGroup Preferences:\n${constraints.preferences.map(pref => `- ${pref}`).join('\n')}` : ''}
${constraints.budget ? `\nBudget: ${constraints.budget}` : ''}

Provide practical suggestions for:
1. Best meeting location (considering travel times)
2. Activity recommendations
3. Timing suggestions
4. Budget-friendly tips

Be specific and actionable.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  return response.text();
}

