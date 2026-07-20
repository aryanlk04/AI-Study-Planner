import { Router } from "express";
import OpenAI from "openai";
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

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /ai/chat
router.post("/chat", async (req, res) => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { message, history = [], subject } = parsed.data;

  const systemPrompt = `You are an expert AI study assistant helping students learn effectively. You provide clear, accurate, and encouraging responses. ${subject ? `The current subject context is: ${subject}.` : ""} Keep responses concise, actionable, and educational.`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: message },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages,
    });

    const responseMessage = completion.choices[0]?.message?.content ?? "";
    res.json({ message: responseMessage });
  } catch (err) {
    req.log.error({ err }, "OpenAI chat error");
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

  const prompt = `Create a detailed, realistic study plan for the following:
Subjects: ${subjects.join(", ")}
Available study hours per day: ${availableHoursPerDay}
Exam/target date: ${examDate}
Current level: ${currentLevel ?? "Not specified"}
Goals: ${goals ?? "Not specified"}

Provide:
1. A comprehensive markdown study plan overview
2. A week-by-week or day-by-day schedule in JSON with format: { "schedule": [{ "day": "Monday", "tasks": ["Task 1", "Task 2"] }] }

Format your response as JSON with keys "plan" (markdown string) and "schedule" (array).`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: "You are an expert academic planner. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    res.json({
      plan: parsed.plan ?? "Study plan generated.",
      schedule: parsed.schedule ?? [],
    });
  } catch (err) {
    req.log.error({ err }, "OpenAI generate-plan error");
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
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are an expert at summarizing academic content. Create a clear, concise summary of ${lengthGuide}. Preserve key concepts and important details.`,
        },
        { role: "user", content: `Please summarize the following:\n\n${content}` },
      ],
    });

    res.json({ text: completion.choices[0]?.message?.content ?? "" });
  } catch (err) {
    req.log.error({ err }, "OpenAI summarize error");
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

Return JSON with format:
{
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "..."
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: "You are an expert educator creating quiz questions. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    res.json({ questions: data.questions ?? [] });
  } catch (err) {
    req.log.error({ err }, "OpenAI quiz error");
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

Return JSON with format:
{
  "flashcards": [
    { "front": "Question or term", "back": "Answer or definition" }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: "You are an expert at creating educational flashcards. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    res.json({ flashcards: data.flashcards ?? [] });
  } catch (err) {
    req.log.error({ err }, "OpenAI flashcards error");
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
  const audienceMap = {
    beginner: "a complete beginner with no prior knowledge",
    intermediate: "someone with basic understanding",
    advanced: "an advanced student who wants deeper insight",
  };
  const audience = audienceMap[level as keyof typeof audienceMap] ?? audienceMap.intermediate;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are an expert teacher. Explain concepts clearly and accessibly for ${audience}. Use examples, analogies, and break down complex ideas into digestible parts.`,
        },
        {
          role: "user",
          content: `Please explain: ${topic}${context ? `\n\nAdditional context: ${context}` : ""}`,
        },
      ],
    });

    res.json({ text: completion.choices[0]?.message?.content ?? "" });
  } catch (err) {
    req.log.error({ err }, "OpenAI explain error");
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

Return JSON with format:
{
  "suggestions": [
    {
      "title": "Technique name",
      "description": "How to apply it and why it helps",
      "technique": "Category (e.g., Active Recall, Spaced Repetition)"
    }
  ]
}

Provide 4-6 specific, actionable suggestions.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            "You are an expert learning coach. Provide practical, evidence-based study technique suggestions. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    res.json({ suggestions: data.suggestions ?? [] });
  } catch (err) {
    req.log.error({ err }, "OpenAI suggestions error");
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

export default router;
