# Planora

An AI-powered travel planning application built with Next.js 16, React 19, and TypeScript.

## Features

- 🤖 AI-powered trip planning with Google Generative AI
- 📅 Calendar integration (Google Calendar, Microsoft Graph)
- 🗺️ Location-based recommendations
- 💾 Supabase backend integration
- 🎨 Modern UI with Tailwind CSS and Radix UI components
- ⚡ Optimized performance with SWR and Zustand state management

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **State Management:** Zustand
- **Data Fetching:** SWR
- **Backend:** Supabase
- **AI:** Google Generative AI
- **Maps:** Google Maps API
- **Animations:** Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- pnpm 8+

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Create a `.env.local` file in the root directory and add your environment variables:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application URL (Required)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Encryption Key for OAuth tokens (Required if using calendar integration)
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=your_64_character_hex_string

# Google AI API Key (Required for PlanPal AI chatbot)
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Google Maps API Key (Optional - for location services)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# OAuth Credentials (Optional - for calendar integration)
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret

# LocationIQ API Key (Optional - for geocoding)
LOCATIONIQ_API_KEY=your_locationiq_api_key

# You.com API Key (Optional - for venue search and recommendations)
YOU_API_KEY=your_you_api_key
```

3. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
planora/
├── app/
│   ├── (auth)/          # Authentication routes
│   ├── (dashboard)/     # Dashboard routes
│   └── api/             # API routes
├── components/
│   ├── ui/              # UI components (Radix UI wrappers)
│   └── features/        # Feature-specific components
├── lib/
│   ├── ai/              # AI integration utilities
│   ├── maps/            # Maps integration
│   ├── supabase/        # Supabase client & helpers
│   ├── cache/           # Caching utilities
│   ├── search/          # Search functionality
│   └── recommendation/  # Recommendation engine
├── actions/             # Server actions
├── types/               # TypeScript type definitions
└── hooks/               # Custom React hooks
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## License

MIT

