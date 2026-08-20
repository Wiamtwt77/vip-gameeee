export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { rawData } = req.body;
    if (!rawData) {
        return res.status(400).json({ error: 'Missing rawData payload' });
    }

    const apiKey = process.env.OPENROUTER_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'OPENROUTER_KEY missing' });
    }

    const systemPrompt = `
أنت خبير أدلة استراتيجية في لعبة "المحكمة السرية".
مهمتك: قراءة أحداث الجولة وتوليد أدلة ناعمة ومؤشرات عامة (Soft Clues) دون كشف اسم أي لاعب أو نوع بطاقته المباشر.

القواعد:
1. صغ (2) إلى (3) أدلة غامضة تعتمد على:
   - مستويات السمعة (مثلاً: "الجاني يمتلك أكثر من 8 نقاط سمعة").
   - مستويات خطر البطاقات (مثلاً: "تم رصد نشاط عالي الخطر أثر على ميزانية المجلس").
   - التحالفات والروابط دون ذكر أطرافها.
2. ممنوع تماماً ذكر أسماء اللاعبين صراحة أو اسم البطاقة.

أرجع النتيجة بتنسيق JSON حصراً:
{
  "clues": [
    "الدليل الأول...",
    "الدليل الثاني..."
  ]
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
                    { role: "user", content: `بيانات الجولة: ${JSON.stringify(rawData)}` }
                ],
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        return res.status(200).json(content);
    } catch (err) {
        return res.status(500).json({ error: "Failed to generate clues" });
    }
}
