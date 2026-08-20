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
        return res.status(500).json({ error: 'OPENROUTER_KEY variable is missing on server environment' });
    }

    const systemPrompt = `
أنت محرك استنتاج جنائي واستراتيجي فريد للعبة "المحكمة السرية".
مهمتك: تحليل بيانات الجولة المجردة دون وجود أي أمثلة ثابته أو قوالب سابقة.

قواعد الاستنتاج الصارمة:
1. ممنوع كشف الفاعل أو اسم البطاقة أو الفعل السري صراحةً (مثلاً: لا تقل "أحمد استخدم بطاقة كذا على محمود").
2. ممنوع اختراع حقائق أو أحداث لم تقع نهائياً في بيانات الجولة.
3. التوليد يجب أن يتبع "مصفوفة الشبهات المتقاطعة" (Multi-Suspect Suspicion Matrix):
   - صغ الأدلة بحيث تضع الشك والقرائن على لاعبين (2) على الأقل بطريقة غير مباشرة.
   - اجعل الأدلة تعبر عن آثار مادية (مستندات مفقودة، تغير في المواعيد، حركة أموال غير مبررة) تناسب الأفعال المسجلة فقط.
4. زود كل لاعب بتسريب سري خاص به يناسب دوره ويمنحه جزءاً من الحقيقة دون الحتمية.
5. قيم إمكانية الحل (Solvability) لتضمن وجود مساحة للنقاش والتضليل والتصويت.

يجب إرجاع النتيجة حصراً بصيغة JSON مجردة بالشكل التالي:
{
  "title": "عنوان القضية الاستراتيجي",
  "incidentOverview": "وصف عام للظواهر المادية الشاذة الناتجة في الجلسة دون تسمية الفاعلين صراحة",
  "suspicionMatrix": [
    {
      "suspectId": "id_1",
      "suspectName": "اسم المشتبه به الأول",
      "circumstantialEvidence": "القرينة الظرفية الشبهة المرتبطة به بشكل غير مباشر"
    },
    {
      "suspectId": "id_2",
      "suspectName": "اسم المشتبه به الثاني",
      "circumstantialEvidence": "القرينة الظرفية الشبهة المرتبطة به"
    }
  ],
  "privateLeaks": [
    {
      "playerId": "id",
      "hint": "تلميح خاص أو تسريب غير مباشر يستفيد منه هذا اللاعب في المداولة"
    }
  ],
  "solvabilityEvaluation": {
    "isSolvable": true,
    "suspicionBalance": "متوازن مع وجود أكثر من خيار منطقي"
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
                    { role: "user", content: `البيانات المجردة للجولة: ${JSON.stringify(rawData)}` }
                ],
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        return res.status(200).json(content);
    } catch (err) {
        return res.status(500).json({ error: "Failed to generate AI strategy matrix", details: err.message });
    }
}
