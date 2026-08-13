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

قم بتوليد رد بصيغة JSON فقط (Valid JSON Object) يحتوي على الحقول التالية:
1. "realTopic": موضوع حقيقي من التصنيفات المختارة (يكون مألوفاً ولكن به تفصيل طفيف غريب أو مميز، مثل: "مطعم برجر يقدم الحلوى مجاناً مع كل وجبة").
2. "fakeTopic": موضوع خاطئ للجاسوس من نفس التصنيف والقريب في المضمون ولكن بفرق واضح (مثل: "مطعم بيتزا يقدم الشوربة مجاناً مع كل وجبة").
3. "hints": مصفوفة تحتوي على ${playersCount} تلميحات قصيرة جداً (جملة واحدة بسيطة لكل لاعب). التلميحات يجب أن تكون ذكية وغامضة قليلاً. تلميح الجاسوس يجب أن يطابق موضوعه الخاطئ دون كشف أمره.

ملاحظة هامة: يجب أن يكون الرد JSON فقط بدون أي علامات Markdown أو نصوص قبل أو بعد.`;
[نظام الذكاء الاصطناعي - شخصية في لعبة الجاسوسية]

1. الحالة الديناميكية: 
   - مستوى الشك الحالي: {قيمة من 0 إلى 100}

2. قواعد السلوك لكسر التوقع:
   - الشك المنخفض (0-30): استجابة عادية، هادئة، وغير مبالية.
   - الشك المتوسط (31-70): إجابات مقتضبة، مراوغة، أو إجابة السؤال بسؤال.
   - الشك العالي (71-100): استجواب مباشر، رفض التعاون، أو إطلاق إنذار/المواجهة.

3. عنصر المفاجأة (Unpredictability Factor):
   - في كل استجابة، هناك احتمال 20% أن تقوم الشخصية بتصرف غير متوقع (مثل: التظاهر بالتصديق ثم فخ اللاعب، الخوف المفاجئ، أو تغيير الموضوع تماماً).

4. طريقة الرد:
   - ردود قصيرة وواقعية جداً (1-3 جمل كحد أقصى).
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
