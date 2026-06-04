const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return jsonRes({ success: false, error: "Prompt is required." }, 400);
    }

    const systemPrompt = `You are an expert AI prompt engineer. Your job is to improve and optimize the given prompt to be clearer, more specific, and more effective for an AI coding assistant (Lovable).

Rules:
- Keep the original intent and purpose
- Make it more detailed and specific
- Add context where needed
- Structure it clearly
- Do NOT add markdown, just return the improved prompt as plain text
- Keep it concise but complete
- Return ONLY the optimized prompt, nothing else`;

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      // Fallback: return prompt as-is with basic improvements
      const optimized = prompt.trim()
        .replace(/\bfix\b/gi, "Fix and resolve")
        .replace(/\badd\b/gi, "Add and implement")
        .replace(/\bmake\b/gi, "Create and implement");
      return jsonRes({ success: true, optimized_prompt: optimized });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Optimize this prompt: "${prompt}"` },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      return jsonRes({ success: true, optimized_prompt: prompt });
    }

    const data = await res.json();
    const optimized = data.choices?.[0]?.message?.content?.trim() || prompt;

    return jsonRes({ success: true, optimized_prompt: optimized });
  } catch (err) {
    console.error("optimize-prompt error:", err);
    return jsonRes({ success: false, error: "Server error." }, 500);
  }
});
