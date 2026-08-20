import { OpenRouter } from "@openrouter/ai-sdk";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { rawData } = req.body;
    if (!rawData) {
        return res.status(400).json({ error: 'Missing rawData' });
    }

    const apiKey = process.env.OPENROUTER_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'OPENROUTER_KEY is not configured on server' });
    }

    const systemPrompt = `
أنت محرك استنتاج وقضايا استراتيجية للعبة "المحكمة السرية".
دورك: تحليل بيانات الجولة المجردة وتوليد قضية وأدلة قابلة للحل.

قواعد صارمة جداً:
1. ممنوع كشف الأفعال السرية بشكل مباشر (مثل: فلان استخدم بطاقة كذا على فلان).
2. ممنوع اختراع حقائق أو أحداث لم تحدث إطلاقاً في البيانات المرسلة.
3. ممنوع الاعتماد على أمثلة أو قوالب سابقة.
4. صغ أدلة وشبهات غير مباشرة تعكس واقع الأحداث المادية فقط.
5. تأكد من أن القضية قابلة للاستنتاج والحل بدون حتمية قاطعة فجائية.

أرجع النتيجة بصيغة JSON حصراً بهذا الشكل:
{
  "title": "عنوان القضية",
  "publicEvidence": "الأدلة العامة للشبهة مع وصف الظواهر غير المباشرة",
  "privateLeaks": [
    { "playerId": "id", "hint": "تلميح خاص أو تسريب غير مباشر يناسب هذا اللاعب" }
  ],
  "solvabilityEvaluation": {
    "isSolvable": true,
    "suspicionBalance": "متوازن"
  }
}
`;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "anthropic/claude-3-haiku",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `حالة الجولة المجردة: ${JSON.stringify(rawData)}` }
                ],
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        return res.status(200).json(content);
    } catch (err) {
        return res.status(500).json({ error: "Failed to generate AI case", details: err.message });
    }
}
