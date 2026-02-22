# توثيق الأمر التنفيذي
# Command Log — إصلاح main.ts + healthRouter + ar.ftl + تصحيح الـ Branch

---

## معلومات الأمر

| البند | التفصيل |
|-------|---------|
| **رقم الأمر** | CMD-011 |
| **تاريخ الإرسال** | 2026-02-22 |
| **وقت الإرسال** | 02:00 (UTC+2 — القاهرة) |
| **أرسله** | المستشار التقني |
| **نُفِّذ بواسطة** | المنفّذ (Executor) |
| **الملفات المستهدفة** | `packages/core/src/main.ts`, `packages/core/src/bot/index.ts`, `packages/core/src/locales/ar.ftl` |
| **نوع الأمر** | إصلاح Runtime + تصحيح Branch |
| **الأولوية** | 🔴 حرج |

---

## شرح الأمر ودوره

بعد تحقيق صفر أخطاء TypeScript، تبقّت ثلاث مشاكل خارج نطاق `typecheck` تمنع تشغيل البوت فعلياً:

1. **`main.ts` فارغ**: ملف نقطة البداية لا يحتوي سوى على تعليق TODO. البوت لن يُشغَّل أبداً.
2. **`healthRouter` غير مربوط**: `healthRouter` مُصدَّر من `server/health.ts` لكن لا يُستورد ولا يُركَّب في `app` داخل `bot/index.ts`.
3. **حرف صيني في `ar.ftl` السطر 26**: `添加` موجود وسط النص العربي ويظهر للمستخدم مباشرة.

إضافة إلى ذلك، جميع الـ commits منذ بداية الجلسة ذهبت إلى branch `001-ai-skills` بدلاً من `001-platform-core`. يجب تصحيح هذا قبل إغلاق الجلسة.

---

## الأخطاء الموثَّقة

| # | الملف | السطر | نوع المشكلة | التأثير |
|---|-------|-------|------------|---------|
| R1 | `main.ts` | كل الملف | Runtime — الملف فارغ | البوت لا يُشغَّل |
| R2 | `bot/index.ts` | نهاية الملف | Runtime — healthRouter غير مربوط | `/health` endpoint لا يعمل |
| R3 | `locales/ar.ftl` | 26 | نص خاطئ — حرف صيني `添加` | يظهر للمستخدم في سؤال اللقب |
| B1 | `git branch` | — | Branch خاطئ `001-ai-skills` | كل العمل في branch غير صحيح |

---

## نص الأمر المُرسَل للمنفّذ

```
/speckit.implement Apply the following fixes in order:

### STEP 1 — Fix ar.ftl (line 26)
In `packages/core/src/locales/ar.ftl`, line 26:
Change:
  ask_nickname = هل تريد添加 لقب اختياري؟ (اضغط /skip للانتقال التالي)
To:
  ask_nickname = هل تريد إضافة لقب اختياري؟ (اضغط /skip للانتقال التالي)

### STEP 2 — Mount healthRouter in bot/index.ts
In `packages/core/src/bot/index.ts`:

Add this import after the existing imports (after line 13):
  import { healthRouter } from '../server/health'

Add this line BEFORE the webhook route (before `app.post('/webhook', ...)`):
  app.route('/', healthRouter)

### STEP 3 — Implement main.ts
Replace the entire content of `packages/core/src/main.ts` with:

import process from 'node:process'
import { serve } from '@hono/node-server'
import { bot, app } from './bot/index'
import { env } from './config/env'
import logger from './utils/logger'

async function main() {
  logger.info('Starting Al-Saada Smart Bot...')

  if (env.WEBHOOK_URL) {
    // Production mode: webhook
    await bot.api.setWebhook(env.WEBHOOK_URL)
    logger.info(`Webhook set to: ${env.WEBHOOK_URL}`)

    serve(
      {
        fetch: app.fetch,
        port: env.PORT,
      },
      (info) => {
        logger.info(`Server listening on port ${info.port}`)
      },
    )
  }
  else {
    // Development mode: long polling
    logger.info('No WEBHOOK_URL set — starting in long polling mode')
    await bot.start()
  }
}

main().catch((error) => {
  logger.error('Fatal error during startup:', error)
  process.exit(1)
})

### STEP 4 — Fix the Branch
After all edits, commit to the CORRECT branch:

1. Run: git add packages/core/src/locales/ar.ftl packages/core/src/bot/index.ts packages/core/src/main.ts
2. Run: git commit -m "fix(bot): implement main entry point, mount healthRouter, fix ar.ftl chinese char"
3. Run: git checkout 001-platform-core
4. Run: git cherry-pick 001-ai-skills (cherry-pick all commits from 001-ai-skills that are not in 001-platform-core)
   OR: git merge 001-ai-skills --no-ff -m "merge: port all session/typecheck/runtime fixes from 001-ai-skills"
5. Verify with: git log --oneline -10
6. Run: npm run typecheck
7. Report final git log and typecheck result.
```

---

## النتائج المتوقعة

### بعد STEP 1:
- `ar.ftl` السطر 26 يحتوي كلمة "إضافة" عربية بدلاً من `添加`

### بعد STEP 2:
- `bot/index.ts` يستورد `healthRouter` ويُركّبه على الـ app
- `GET /health` يُعيد status للـ Redis والـ Database

### بعد STEP 3:
- `main.ts` يحتوي entry point كاملاً
- البوت يعمل بـ long polling في بيئة التطوير
- البوت يعمل بـ webhook في بيئة الإنتاج (عند تعيين WEBHOOK_URL)

### بعد STEP 4:
- جميع الـ commits موجودة في `001-platform-core`
- `typecheck` يعطي صفر أخطاء
- `001-ai-skills` يمكن حذفه أو إبقاؤه للرجوع

---

## ملاحظات تقنية للمنفّذ

> [!IMPORTANT]
> `@hono/node-server` يجب أن يكون مثبتاً. إذا لم يكن موجوداً في `package.json`، شغّل:
> `npm install @hono/node-server --workspace=packages/core`
> قبل كتابة `main.ts`.

> [!IMPORTANT]
> عند `cherry-pick` أو `merge`، إذا ظهرت تعارضات (conflicts)، أعطِ الأولوية للنسخة من `001-ai-skills` لأنها تحتوي الإصلاحات الأحدث.

> [!NOTE]
> `bot.start()` في long polling mode يُشغِّل الـ bot وينتظر — لا يحتاج `serve()` في هذا الوضع.

---

## المتابعة بعد التنفيذ

| البند | الوضع المتوقع |
|-------|--------------|
| `npm run typecheck` | ✅ 0 errors |
| `git log --oneline` على `001-platform-core` | ✅ يحتوي كل commits الجلسة |
| `ar.ftl` السطر 26 | ✅ نص عربي نظيف |
| `GET /health` | ✅ endpoint مربوط |
| `main.ts` | ✅ entry point كامل |

---

## نتائج التنفيذ الفعلية

### الحالة: ✅ نجح جزئياً — مشكلة Branch لم تُحَل

**وقت التنفيذ:** 02:10 (UTC+2 — القاهرة)

### التفاصيل:

**STEP 1 — ar.ftl** ✅
- الحرف الصيني `添加` استُبدل بـ `إضافة` بنجاح

**STEP 2 — healthRouter** ✅
- `healthRouter` مستورد ومربوط على `app` قبل الـ webhook route

**STEP 3 — main.ts** ✅
- `@hono/node-server` ثُبِّت (1 package added)
- `main.ts` يحتوي entry point كاملاً يدعم long polling و webhook

**STEP 4 — Branch** ❌ لم يُحَل
- Branch `001-platform-core` غير موجود في الـ repository
- Branches الموجودة: `001-ai-skills` (current), `claude/recursing-kowalevski`, `main`, `master`
- المنفّذ أبقى العمل على `001-ai-skills` دون إنشاء الـ branch الصحيح

**Git Commit المنفَّذ:**
```
a69b6dd fix(bot): implement main entry point, mount healthRouter, fix ar.ftl chinese char
```

**typecheck:** ✅ 0 errors

### ✅ تصحيح Branch — مكتمل يدوياً

نفّذ صالح يدوياً:
```
git branch -m 001-ai-skills 001-platform-core
git push origin 001-platform-core
```

**النتيجة:**
- Branch أُعيدت تسميته محلياً من `001-ai-skills` إلى `001-platform-core`
- Branch مرفوع إلى GitHub بنجاح
- Pull Request متاح على: https://github.com/SalehOsman/Al-Saada_Smart_Bot/pull/new/001-platform-core
