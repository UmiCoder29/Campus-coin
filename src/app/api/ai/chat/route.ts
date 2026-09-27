import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Natural, conversational system prompt:
 * Provides light context about Campus Coin without restricting the conversation,
 * forcing app topics, or sounding like a rigid bot.
 */
const CAMPUS_COIN_SYSTEM_PROMPT = `You are a friendly, knowledgeable assistant inside Campus Coin, a student budgeting app. You know how Campus Coin works (expense tracking, budget envelope pacing, savings targets, spending rhythm velocity charts, reports, and settings) and can help the student use it when asked.

However, you are not limited to app topics: talk naturally and openly about whatever the student brings up—college life, academics, advice, coding, trivia, news, career ideas, or casual conversation—exactly like a normal helpful, intelligent conversation, not a scripted support bot.

Guidelines:
- Don't force the conversation back to the app unless the student is asking about it.
- Don't sound like marketing copy or a rigid support script.
- Don't repeat the same phrasing across responses.
- Be warm, direct, smart, and human in tone.
- When referencing real-time facts or external knowledge, incorporate sources or citations naturally when available.`;

// Active models in verified order of availability
const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

export async function POST(req: NextRequest) {
  try {
    // 1. Verify authenticated session (NextAuth)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access: Please sign in." },
        { status: 401 }
      );
    }

    // 2. Validate GEMINI_API_KEY presence
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY is not configured in the server environment.",
        },
        { status: 500 }
      );
    }

    // 3. Parse and validate incoming user message and history
    const body = await req.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const history = Array.isArray(body.history) ? body.history : [];
    // Default to streaming for a fluid, natural conversation experience
    const wantStream = body.stream !== false;

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message content cannot be empty." },
        { status: 400 }
      );
    }

    // Format recent conversation history for Gemini (last 10 messages)
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const msg of history.slice(-10)) {
      if (msg.content && typeof msg.content === "string") {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content.trim() }],
        });
      }
    }

    // Append the user's actual typed question
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const genAI = new GoogleGenerativeAI(apiKey);

    // Helper to attempt model generation with Google Search grounding tool enabled
    const tryGenerateStream = async (modelName: string) => {
      // First attempt: with googleSearch grounding enabled
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: CAMPUS_COIN_SYSTEM_PROMPT,
          tools: [{ googleSearch: {} } as any],
          generationConfig: {
            temperature: 0.7,
          },
        });
        const streamResult = await model.generateContentStream({ contents });
        return { streamResult, modelName, grounded: true };
      } catch (err: any) {
        // If googleSearch tool is unavailable or hits a quota constraint on this API key tier,
        // seamlessly fall back to standard stream generation
        console.warn(`[AI Chat] Search grounding attempt notice on ${modelName}:`, err?.message || err);
        const fallbackModel = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: CAMPUS_COIN_SYSTEM_PROMPT,
          generationConfig: {
            temperature: 0.7,
          },
        });
        const streamResult = await fallbackModel.generateContentStream({ contents });
        return { streamResult, modelName, grounded: false };
      }
    };

    let streamResultObj: { streamResult: any; modelName: string; grounded: boolean } | null = null;
    let lastError: any = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        streamResultObj = await tryGenerateStream(modelName);
        if (streamResultObj) break;
      } catch (err: any) {
        lastError = err;
        console.error(`Gemini stream error on model ${modelName}:`, err?.message || err);
      }
    }

    if (!streamResultObj) {
      return NextResponse.json(
        {
          success: false,
          error: lastError?.message || "Failed to reach Gemini API.",
        },
        { status: 502 }
      );
    }

    const { streamResult, modelName } = streamResultObj;

    // If client requested non-streaming JSON (e.g. scripts or test suites)
    if (!wantStream) {
      let fullText = "";
      for await (const chunk of streamResult.stream) {
        const t = chunk.text();
        if (t) fullText += t;
      }
      return NextResponse.json({
        success: true,
        reply: fullText.trim(),
        model: modelName,
      });
    }

    // Stream token-by-token using standard ReadableStream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }

          // Check if grounding metadata exists to append sources
          try {
            const responseObj = await streamResult.response;
            const groundingMeta = responseObj?.candidates?.[0]?.groundingMetadata;
            if (groundingMeta?.groundingChunks?.length) {
              const citations = groundingMeta.groundingChunks
                .filter((c: any) => c.web?.uri)
                .map((c: any) => `• [${c.web.title || c.web.uri}](${c.web.uri})`)
                .slice(0, 3)
                .join("\n");

              if (citations) {
                controller.enqueue(
                  encoder.encode(`\n\n**Sources:**\n${citations}`)
                );
              }
            }
          } catch {
            // Non-critical metadata read
          }

          controller.close();
        } catch (err: any) {
          console.error("[Stream Chunk Error]:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-AI-Model": modelName,
      },
    });
  } catch (error: any) {
    console.error("[AI Chat Route Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error occurred.",
      },
      { status: 500 }
    );
  }
}
