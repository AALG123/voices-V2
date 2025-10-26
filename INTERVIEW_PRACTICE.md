# AI Interview Practice Feature

## Overview
A real-time speech-to-speech interview practice system where users can have natural voice conversations with an AI interviewer powered by Google Gemini.

## Features

### 🎤 Browser Speech Recognition (STT)
- **Continuous Listening**: Uses Web Speech API to capture user's voice in real-time
- **Interim Results**: Shows what you're saying as you speak
- **Smart Debouncing**: Prevents overlapping responses with 1.5s debounce
- **Auto-restart**: Automatically restarts recognition if interrupted
- **Browser Support**: Works in Chrome and Edge (browsers with Web Speech API)

### 🤖 Gemini AI Interviewer
- **Intelligent Questions**: Gemini acts as a professional interviewer
- **Context-Aware**: Maintains conversation history for relevant follow-ups
- **Customizable**: Optional custom system prompts for specific interview types
- **System Prompt**: Friendly but professional tone, asks thoughtful questions
- **Real-time Responses**: Processes user speech and generates appropriate replies

### 🔊 Fish Audio TTS
- **Natural Voice**: Converts Gemini's text responses to speech
- **Automatic Playback**: Speaks responses immediately after generation
- **Toggle Control**: Option to disable voice and read text responses only
- **Queue Management**: Handles multiple responses smoothly

### 💬 Interactive UI
- **Real-time Status**: Shows microphone status, AI processing state
- **Conversation History**: Displays full conversation with timestamps
- **Visual Feedback**: Different colors for user vs AI messages
- **Error Handling**: Clear error messages for speech recognition issues
- **Session Controls**: Start, stop, and reset interview sessions

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Interview Practice Loop                   │
└─────────────────────────────────────────────────────────────┘

1. User Speaks → Browser STT captures audio
                    ↓
2. STT converts speech to text (transcript)
                    ↓
3. Text sent to /api/gemini/interview endpoint
                    ↓
4. Gemini processes with interviewer system prompt
                    ↓
5. Gemini returns interviewer response text
                    ↓
6. Response displayed in conversation UI
                    ↓
7. Fish Audio TTS speaks response aloud
                    ↓
8. Loop continues → User speaks next...
```

## Files Created/Modified

### New Files
1. **`/src/app/api/gemini/interview/route.ts`**
   - API endpoint for Gemini interviewer responses
   - Manages conversation history
   - Supports custom system prompts
   - Error handling for API issues

2. **`/src/app/interview-practice/page.tsx`**
   - Main interview practice UI component
   - Speech recognition integration
   - Conversation display
   - Session management controls

3. **`/.env.example`**
   - Documents required environment variables
   - Setup instructions for API keys

### Modified Files
1. **`/src/lib/tts-service.ts`**
   - Added `clearQueue()` method for session cleanup

2. **`/src/app/scenarios/page.tsx`**
   - Added quick access card linking to interview practice

## Usage

### Prerequisites
1. **Environment Variables** (add to `.env.local`):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   TTS_FISH_AUDIO_API_KEY=your_fish_audio_key_here
   TTS_ENDPOINT=https://api.fish.audio/v1/tts
   TTS_ENABLED=true
   ```

2. **Browser Requirements**:
   - Chrome (recommended)
   - Edge
   - Must allow microphone access

### Starting an Interview Session

1. Navigate to `/interview-practice`
2. Click "Start Interview" button
3. Grant microphone permissions when prompted
4. AI interviewer will greet you and ask first question
5. Speak your answers naturally
6. AI will respond with follow-up questions
7. Click "Stop Interview" when done

### Custom Instructions

Enable "Custom Instructions" to tailor the interviewer:
- Specify interview type (technical, behavioral, etc.)
- Set industry context
- Define focus areas
- Adjust difficulty level

Example custom prompt:
```
You are interviewing for a senior software engineer position at a startup. 
Focus on system design, leadership experience, and startup adaptability. 
Ask progressively challenging technical questions.
```

## API Details

### POST /api/gemini/interview

**Request Body**:
```json
{
  "userInput": "string (required)",
  "conversationHistory": [
    {
      "role": "user|model",
      "parts": [{ "text": "string" }]
    }
  ],
  "customSystemPrompt": "string (optional)"
}
```

**Response**:
```json
{
  "response": "string",
  "conversationHistory": [...]
}
```

**Error Responses**:
- `400`: Invalid request (missing userInput)
- `401`: Invalid API key
- `429`: API quota exceeded
- `500`: Server error

## System Prompt

Default interviewer behavior:
- Acts as intelligent, articulate interviewer
- Asks thoughtful, relevant follow-up questions
- Keeps conversation engaging and on-topic
- Speaks clearly and concisely
- One question at a time (under 3 sentences)
- Friendly but professional tone
- Helps users prepare for job/media interviews
- Offers gentle prompts if user seems stuck

## Technical Implementation

### Speech Recognition
- Uses `window.SpeechRecognition` or `window.webkitSpeechRecognition`
- Continuous mode enabled
- Interim results for real-time feedback
- English (US) language setting
- Automatic restart on session end
- 1.5 second debounce to prevent duplicate processing

### Conversation Management
- Maintains full history in React state
- Sends history to Gemini for context
- Updates after each exchange
- Can be reset at any time

### TTS Integration
- Queues responses for sequential playback
- Cleanup on session end
- Toggle on/off without stopping session
- Persists preference to localStorage

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Speech Recognition | ✅ | ✅ | ❌ | ❌* |
| Fish Audio TTS | ✅ | ✅ | ✅ | ✅ |
| UI/Interface | ✅ | ✅ | ✅ | ✅ |

*Safari has limited/experimental Web Speech API support

## Future Enhancements

Possible improvements:
- Voice selection for TTS (different interviewer voices)
- Session recording and playback
- Performance analytics and scoring
- Multiple interview types/templates
- Multi-language support
- Export conversation transcripts
- Video recording integration
- Interview coaching tips during session

## Troubleshooting

### "Speech recognition not supported"
- Use Chrome or Edge browser
- Check browser version is up to date

### "Microphone access denied"
- Click lock icon in address bar
- Allow microphone permissions
- Reload page

### "No speech detected"
- Check microphone is working
- Speak clearly and at normal volume
- Check system microphone settings
- Ensure correct microphone is selected

### "Gemini API errors"
- Verify `GEMINI_API_KEY` in `.env.local`
- Check API quota hasn't been exceeded
- Ensure internet connection is stable

### "TTS not working"
- Verify `TTS_FISH_AUDIO_API_KEY` in `.env.local`
- Check `TTS_ENABLED=true`
- Try toggling voice on/off in UI
- Check browser console for errors
