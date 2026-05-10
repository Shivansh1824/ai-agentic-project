/**
 * AI Prompt Templates for CareerPilot AI
 * All prompts return structured JSON from Gemini 3.0 Flash
 */

export const ATS_ANALYSIS_PROMPT = (resumeText) => `
You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the following resume text and provide a detailed evaluation.

RESUME TEXT:
"""
${resumeText}
"""

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code fences, no extra text):
{
  "ats_score": <number 0-100>,
  "summary": "<brief 2-3 sentence summary of the resume>",
  "strengths": [
    {"title": "<strength title>", "description": "<why this is a strength>"},
    {"title": "<strength title>", "description": "<why this is a strength>"}
  ],
  "weaknesses": [
    {"title": "<weakness title>", "description": "<why this is a weakness and how to fix it>"},
    {"title": "<weakness title>", "description": "<why this is a weakness and how to fix it>"}
  ],
  "missing_keywords": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "improvement_suggestions": [
    "<actionable suggestion 1>",
    "<actionable suggestion 2>",
    "<actionable suggestion 3>"
  ],
  "formatting_issues": [
    "<formatting issue 1>",
    "<formatting issue 2>"
  ]
}

Evaluation criteria:
- Keyword optimization (industry-relevant terms)
- Formatting and structure (ATS-parseable)
- Quantifiable achievements
- Action verbs usage
- Contact information completeness
- Section organization
- Overall readability
Provide at least 3 strengths, 3 weaknesses, 5 missing keywords, and 3 improvement suggestions.
`;

export const INTERVIEW_QUESTIONS_PROMPT = (resumeText, level = 'intermediate') => `
You are an expert career coach and interviewer. Based on the resume provided, generate interview questions tailored to the candidate's experience and skills.

RESUME TEXT:
"""
${resumeText}
"""

DIFFICULTY LEVEL: ${level}

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code fences, no extra text):
{
  "questions": [
    {
      "id": 1,
      "question": "<interview question>",
      "category": "<behavioral|technical|situational>",
      "difficulty": "<easy|medium|hard>",
      "tips": "<brief tip for answering this question well>"
    }
  ]
}

Generate exactly 5 questions:
- 2 behavioral questions
- 2 technical questions relevant to their skills
- 1 situational question
Tailor questions to the skills, experience level, and industry shown in the resume.
`;

export const EVALUATE_ANSWER_PROMPT = (question, answer) => `
You are an expert interview coach. Evaluate the candidate's answer to the interview question.

INTERVIEW QUESTION:
"""
${question}
"""

CANDIDATE'S ANSWER:
"""
${answer}
"""

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code fences, no extra text):
{
  "score": <number 0-100>,
  "verdict": "<excellent|good|average|needs_improvement|poor>",
  "feedback": "<detailed constructive feedback>",
  "strengths": ["<what was done well 1>", "<what was done well 2>"],
  "improvements": ["<what to improve 1>", "<what to improve 2>"],
  "model_answer": "<a strong example answer the candidate could reference>"
}

Evaluate based on:
- Relevance to the question
- Use of STAR method (for behavioral questions)
- Specificity and examples
- Communication clarity
- Confidence and professionalism
`;
