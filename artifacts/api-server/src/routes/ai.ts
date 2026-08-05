import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import {
  AiChatBody,
  AiGeneratePlanBody,
  AiSummarizeBody,
  AiGenerateQuizBody,
  AiGenerateFlashcardsBody,
  AiExplainBody,
  AiGetSuggestionsBody,
} from "@workspace/api-zod";

const router = Router();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = "gemini-flash-latest";

/** Strip markdown code fences that Gemini sometimes wraps around JSON */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenced ? fenced[1].trim() : raw.trim();
}

// POST /ai/chat
router.post("/chat", async (req, res) => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { message, history = [], subject } = parsed.data;

  const systemInstruction = `You are an expert AI study assistant helping students learn effectively. You provide clear, accurate, and encouraging responses.${subject ? ` The current subject context is: ${subject}.` : ""} Keep responses concise, actionable, and educational.`;

  // Gemini uses "model" instead of "assistant" for the AI role
  const contents = [
    ...history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 8192,
      },
    });

    res.json({ message: response.text ?? "" });
  } catch (err) {
    req.log.error({ err }, "Gemini chat error");
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

// POST /ai/generate-plan
router.post("/generate-plan", async (req, res) => {
  const parsed = AiGeneratePlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { subjects, availableHoursPerDay, examDate, currentLevel, goals } = parsed.data;

  const prompt = `Create a detailed, realistic study plan for the following student:

Subjects: ${subjects.join(", ")}
Available study hours per day: ${availableHoursPerDay}
Exam/target date: ${examDate}
Current level: ${currentLevel ?? "Not specified"}
Goals: ${goals ?? "Not specified"}

Respond with a JSON object containing exactly two keys:
- "plan": a comprehensive markdown string with the study plan overview, tips, and strategy
- "schedule": an array of objects like [{ "day": "Monday", "tasks": ["Task 1", "Task 2"] }] covering the full study period week by week

Return only valid JSON, no extra text.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are an expert academic planner. Always respond with valid JSON only — no markdown fences, no extra commentary.",
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    });

    const data = JSON.parse(extractJson(response.text ?? "{}"));
    res.json({
      plan: data.plan ?? "Study plan generated.",
      schedule: data.schedule ?? [],
    });
  } catch (err) {
    req.log.error({ err }, "Gemini generate-plan error");
    res.status(500).json({ error: "Failed to generate study plan" });
  }
});

// POST /ai/summarize
router.post("/summarize", async (req, res) => {
  const parsed = AiSummarizeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { content, length = "medium" } = parsed.data;
  const lengthGuide =
    length === "short" ? "2-3 sentences" : length === "long" ? "3-5 paragraphs" : "1-2 paragraphs";

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: `Please summarize the following:\n\n${content}` }] }],
      config: {
        systemInstruction: `You are an expert at summarizing academic content. Create a clear, concise summary of ${lengthGuide}. Preserve key concepts and important details.`,
        maxOutputTokens: 8192,
      },
    });

    res.json({ text: response.text ?? "" });
  } catch (err) {
    req.log.error({ err }, "Gemini summarize error");
    res.status(500).json({ error: "Failed to summarize content" });
  }
});

// POST /ai/quiz
router.post("/quiz", async (req, res) => {
  const parsed = AiGenerateQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { topic, questionCount, difficulty = "medium", content } = parsed.data;

  const prompt = `Generate ${questionCount} multiple choice quiz questions about "${topic}".
Difficulty: ${difficulty}
${content ? `Source material:\n${content}` : ""}

Respond with a JSON object:
{
  "questions": [
    {
      "question": "...",
      "options": ["A. option", "B. option", "C. option", "D. option"],
      "correctAnswer": "A. option",
      "explanation": "..."
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are an expert educator creating quiz questions. Always respond with valid JSON only.",
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    });

    const data = JSON.parse(extractJson(response.text ?? "{}"));
    res.json({ questions: data.questions ?? [] });
  } catch (err) {
    req.log.error({ err }, "Gemini quiz error");
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

// POST /ai/flashcards
router.post("/flashcards", async (req, res) => {
  const parsed = AiGenerateFlashcardsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { topic, cardCount, content } = parsed.data;

  const prompt = `Generate ${cardCount} flashcards for studying "${topic}".
${content ? `Source material:\n${content}` : ""}

Respond with a JSON object:
{
  "flashcards": [
    { "front": "Question or term", "back": "Answer or definition" }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are an expert at creating educational flashcards. Always respond with valid JSON only.",
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    });

    const data = JSON.parse(extractJson(response.text ?? "{}"));
    res.json({ flashcards: data.flashcards ?? [] });
  } catch (err) {
    req.log.error({ err }, "Gemini flashcards error");
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
});

// POST /ai/explain
router.post("/explain", async (req, res) => {
  const parsed = AiExplainBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { topic, level = "intermediate", context } = parsed.data;
  const audienceMap: Record<string, string> = {
    beginner: "a complete beginner with no prior knowledge",
    intermediate: "someone with basic understanding of the subject",
    advanced: "an advanced student who wants deeper insight and nuance",
  };
  const audience = (level ? audienceMap[level] : null) ?? audienceMap.intermediate;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: `Please explain: ${topic}${context ? `\n\nAdditional context: ${context}` : ""}` }],
        },
      ],
      config: {
        systemInstruction: `You are an expert teacher. Explain concepts clearly and accessibly for ${audience}. Use examples, analogies, and break complex ideas into digestible parts.`,
        maxOutputTokens: 8192,
      },
    });

    res.json({ text: response.text ?? "" });
  } catch (err) {
    req.log.error({ err }, "Gemini explain error");
    res.status(500).json({ error: "Failed to explain topic" });
  }
});

// POST /ai/suggestions
router.post("/suggestions", async (req, res) => {
  const parsed = AiGetSuggestionsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { subjects, studyPattern, struggles } = parsed.data;

  const prompt = `Provide personalized study technique suggestions for a student.
Subjects: ${subjects.join(", ")}
Study pattern: ${studyPattern ?? "Not specified"}
Struggles with: ${struggles ?? "Not specified"}

Respond with a JSON object:
{
  "suggestions": [
    {
      "title": "Technique name",
      "description": "How to apply it and why it helps",
      "technique": "Category (e.g., Active Recall, Spaced Repetition)"
    }
  ]
}

Provide 4-6 specific, actionable suggestions tailored to these subjects and struggles.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are an expert learning coach. Provide practical, evidence-based study technique suggestions. Always respond with valid JSON only.",
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    });

    const data = JSON.parse(extractJson(response.text ?? "{}"));
    res.json({ suggestions: data.suggestions ?? [] });
  } catch (err) {
    req.log.error({ err }, "Gemini suggestions error");
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

export default router;
