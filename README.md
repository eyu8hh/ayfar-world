# AYFAR WORLD ♡

تطبيق ويب تقدمي (PWA) خاص بعالم أيوب وفرحتي، بواجهة عربية RTL وتجربة مهيأة للهاتف.

## التشغيل المحلي

من مجلد المشروع:

```bash
python -m http.server 8000
```

ثم افتح `http://localhost:8000`. يتطلب Service Worker اتصالاً عبر HTTPS أو localhost، ولا يعمل عند فتح `index.html` مباشرة عبر `file://`.

## البنية والخدمات

- واجهة عربية RTL وتجربة mobile-first.
- Supabase Auth للحسابات، وقاعدة البيانات لتخزين بيانات العالم والمباريات.
- حسابا AYFAR الأساسيان هما أيوب (`ayoub`) وفرحتي (`farahati`).
- الألعاب الثنائية تستخدم جلسات مشتركة ومزامنة عبر Supabase Realtime مع إعادة جلب الحالة عند الحاجة.
- لعبة الألغاز تتضمن المسابقة الذكية التي تولّد الأسئلة وتقيّم الإجابات عبر Supabase Edge Function.
- ملفات PWA: `manifest.json` و`service-worker.js`.

## إعداد Supabase

1. اضبط عنوان مشروع Supabase ومفتاح anon في إعدادات التطبيق المخصصة لذلك. لا تضع مفتاح `service_role` في ملفات المتصفح.
2. طبّق ملفات SQL الموجودة في `supabase/migrations/` بالترتيب، على مشروع Supabase نفسه. لا تعِد تشغيل ملفات الترحيل القديمة عشوائياً إذا سبق تطبيقها؛ اتبع تعليمات كل ترحيل.
3. اضبط سر Edge Function باسم `OPENAI_API_KEY` في Supabase لإتاحة المسابقة الذكية.
4. انشر الدالة:

```bash
supabase functions deploy ayfar-ai-quiz --project-ref "$SUPABASE_PROJECT_ID" --yes
```

يجب أن تكون بيئة Supabase CLI مصادقاً عليها وأن يشير `SUPABASE_PROJECT_ID` إلى مشروع AYFAR الصحيح.

## نشر الدالة عبر GitHub Actions

سير العمل `.github/workflows/deploy-ayfar-ai-quiz.yml` يدوي التشغيل من تبويب Actions. يحتاج أسرار المستودع التالية:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`

نجاح GitHub Actions يؤكد نشر الدالة فقط؛ ولا يعني وحده أن ترحيلات SQL قد طُبقت أو أن اختبار الهاتفين قد اكتمل.

## التحقق

- فحص صياغة JavaScript: `node --check js/games.js`
- فحص Edge Function: `deno check supabase/functions/ayfar-ai-quiz/index.ts`
- اختبر الألعاب الثنائية من جلستَي أيوب وفرحتي، خصوصاً إرسال الإجابتين معاً، كشف النتيجة، تحديث النقاط، استئناف المباراة بعد تحديث الصفحة، وإنهاء المباراة.

## الأمان

- لا تحفظ مفاتيح الخدمة أو أسرار OpenAI في ملفات الواجهة أو المستودع.
- يجب أن تتحقق الدوال الخلفية من هوية المستخدم ودوره وعضويته في المباراة قبل تعديل بياناتها.
- استخدم أسرار GitHub وSupabase لإعداد النشر، ولا تشاركها في المحادثات أو السجلات.

## الهوية

الاسم الرسمي هو **AYFAR WORLD**. الهوية تجمع البورغندي والوردي والأخضر، مع واجهة أيوب الداكنة الفخمة وواجهة فرحتي الناعمة.
