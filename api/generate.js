export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Configuration Error: OPENROUTER_KEY missing" });
  }

  const { categories = [], playersCount = 4, usedTopics = [] } = req.body || {};
  const categoriesStr = categories.length > 0 ? categories.join('، ') : 'عام، يوميات، مطاعم، سفر';
  const usedStr = usedTopics.length > 0 ? usedTopics.join('، ') : 'لا يوجد';

  const prompt = `أنت محرك لعبة 'الجاسوس الغافل'. المطلوب توليد موضوع لعبة مبتكر باللغة العربية.
التصنيفات المختارة: [${categoriesStr}]
عدد اللاعبين: ${playersCount}
مواضيع استخدمت سابقاً يمنع تكرارها: [${usedStr}]
const prompt = `أنت العقل المدبر والمبتكر للعبة 'الجاسوس الغافل'.
مهمتك: توليد فكرة لعبة جديدة تماماً، غير متوقعة، وبعيدة عن الأنماط المكررة باللغة العربية.

التصنيفات المتاحة: [${categoriesStr}]
عدد اللاعبين: ${playersCount}
مواضيع سابقة (يمنع منعاً باتاً الاقتراب من أفكارها أو صياغتها): [${usedStr}]

قواعد الابتكار لكسر التوقع والتكرار:
1. التنويع الأسلوبي: لا تستخدم نفس النمط اللغوي في كل مرة. غير الزاوية (مرة موقف سينمائي، مرة مكان دقيق، مرة حدث يومي غير عادي، مرة نشاط محدد).
2. الفارق الذكي: "realTopic" و "fakeTopic" يجب أن يكونا من نفس التصنيف وبينهما تشابه ظاهري يجعل الجاسوس يندمج، لكن الفارق الضمني بينهما يسبب مواقف كوميدية أو ارتباكاً عند النقاش.
3. تلميحات متغيرة النمط (hints): يجب توليد ${playersCount} تلميحات. اجعل كل تلميح له طابع مختلف (تلميح حركي، تلميح بصري، تلميح شعوري، تلميح عن صوت أو بيئة المكان).
4. تلميح الجاسوس: يجب أن يبدو منطقياً تماماً بالنسبة لموضوعه الخاطئ، دون أن يكشف أنه لا يعرف الموضوع الحقيقي.

المطلوب: رد بصيغة JSON فقط (Valid JSON Object) بدون أي نصوص إضافية أو علامات Markdown:
{
  "realTopic": "الموضوع الحقيقي (مبتكر وبعيد عن الكليشيهات)",
  "fakeTopic": "موضوع الجاسوس الخاطئ (قريب ومضلل بذكاء)",
  "hints": ["تلميح 1", "تلميح 2", ...]
}
`;
   - ممنوع تقديم شروحات أو تحليلات طويلة خارج نطاق الشخصية.
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vercel.com",
        "X-Title": "Blind Spy Game"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a JSON-only API for the Blind Spy Arabic party game. Always respond with raw valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Clean up possible markdown code blocks
    content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(content);
    return res.status(200).json(parsedData);

  } catch (error) {
    console.error("AI Generation Error, falling back to local database:", error);

    // Fallback topic pool grouped by categories
    const fallbacks = [
      {
        realTopic: "مطعم برجر يقدم ألعاب خفة يد مع الوجبة",
        fakeTopic: "مطعم بيتزا يقدم عروض سيرك مع كل طلب",
        hints: Array(playersCount).fill("المكان فيه إثارة وتسلية غير عادية أثناء الأكل!")
      },
      {
        realTopic: "رحلة طيران فيها سينما بشاشة ضخمة مجاناً",
        fakeTopic: "رحلة قطار فيها صالة ألعاب فيديو مجانية",
        hints: Array(playersCount).fill("التنقل فيها يمر بسرعة بسبب وسائل الترفيه!")
      },
      {
        realTopic: "مدرسة تدرب الطلاب على الطبخ الاحترافي",
        fakeTopic: "مدرسة تدرب الطلاب على الفنون والرسم الجداري",
        hints: Array(playersCount).fill("الطلاب يطلعون منها بمهارات عملية ممتازة!")
      },
      {
        realTopic: "سيارة كهربائية تشحن نفسها بالضوء والمشي",
        fakeTopic: "سيارة طائرة تعمل بالطاقة الشمسية فقط",
        hints: Array(playersCount).fill("وسيلة وسريعة وصديقة للبيئة بشكل متطور!")
      }
    ];

    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return res.status(200).json(randomFallback);
  }
}
