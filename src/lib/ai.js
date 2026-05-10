import { supabase } from './supabase';
import { ATS_ANALYSIS_PROMPT, INTERVIEW_QUESTIONS_PROMPT, EVALUATE_ANSWER_PROMPT } from './prompts';

/**
 * Calls the Supabase Edge Function that proxies to Gemini 3.0 Flash.
 * The edge function handles API key security server-side.
 */
async function callAI(prompt) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to use AI features');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-ai-response`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ prompt }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `AI request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.response;
}

/**
 * Parse JSON from AI response, handling potential markdown code fences
 */
function parseAIJSON(responseText) {
  let cleaned = responseText.trim();
  
  // Remove markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AI JSON response:', cleaned);
    throw new Error('AI returned an invalid response. Please try again.');
  }
}

/**
 * Analyze a resume and return ATS score + feedback
 */
export async function analyzeResume(resumeText) {
  const prompt = ATS_ANALYSIS_PROMPT(resumeText);
  const response = await callAI(prompt);
  return parseAIJSON(response);
}

/**
 * Generate interview questions based on resume
 */
export async function generateInterviewQuestions(resumeText, level = 'intermediate') {
  const prompt = INTERVIEW_QUESTIONS_PROMPT(resumeText, level);
  const response = await callAI(prompt);
  return parseAIJSON(response);
}

/**
 * Evaluate a candidate's answer to an interview question
 */
export async function evaluateAnswer(question, answer) {
  const prompt = EVALUATE_ANSWER_PROMPT(question, answer);
  const response = await callAI(prompt);
  return parseAIJSON(response);
}
