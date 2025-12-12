# Catalyst: Accelerate Innovation

Catalyst is an advanced AI-powered partner designed to streamline the innovation process for entrepreneurs, product managers, and creative thinkers. Leveraging Google's Gemini 2.5 Flash model, Catalyst provides two distinct modes of interaction to help turn abstract concepts into actionable strategies.

## Features

### 1. Brainstorm Chat
*   **Interactive Ideation**: Engage in a dynamic conversation to generate new ideas, apply lateral thinking techniques (like SCAMPER), or troubleshoot creative blocks.
*   **Contextual Awareness**: The AI maintains context throughout the session to refine ideas iteratively.
*   **Smart Suggestions**: Context-aware prompt suggestions to kickstart the creative process.

### 2. Market Feasibility Analysis
*   **Structured Assessment**: Submit a business idea or product concept for a rigorous 5-point analysis:
    *   **Feasibility**: Can it be built?
    *   **Desirability**: Do people want it?
    *   **Viability**: Is it profitable?
    *   **Novelty**: Is it unique?
    *   **Timing**: Is now the right time?
*   **Visual Metrics**: View a Radar chart visualization of the scoring metrics.
*   **Strategic Recommendations**: Receive a synthesized recommendation on whether to Pivot, Persevere, or Kill the idea.
*   **Export Reports**: Download comprehensive analysis reports as professionally formatted PDFs or CSV data files.

### 3. Session Management
*   **History Tracking**: Automatically saves chat and analysis sessions locally.
*   **Session Switcher**: Easily toggle between different project streams via the sidebar.

## Technology Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS (with custom animations)
*   **AI Model**: Google Gemini 2.5 Flash (via `@google/genai` SDK)
*   **Visualization**: Recharts
*   **PDF Generation**: jsPDF & jsPDF-AutoTable
*   **Icons**: Lucide React
