export default async function handler(req, res) {
  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Configuration Error: API Key missing" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-app-url.vercel.app", 
        "X-Title": "Bra Al-Salfa Game"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ 
          role: "user", 
          content: "أعطني كلمة واحدة أو موضوعاً واحداً مناسباً للعبة 'برا السالفة' (لعبة تخمين). أجب بالكلمة فقط بدون مقدمات." 
        }]
      })
    });
    
    const data = await response.json();
    const topic = data.choices[0].message.content.trim();
    res.status(200).json({ topic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch from AI" });
  }
}
