# art-motion-test — نصب و تست [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion)

این پوشه «فیلم تست» و ابزار اجرای skill هنرِ متحرکِ花叔 در این سندباکس است.
خودِ skill (موتور Canvas، ۳۵ سبک، ۹ گرامر) بیرون از git کلون شده: `~/huashu-art-motion`
(نصب رسمی با `npx skills add alchaincyf/huashu-art-motion` هم بررسی شد؛ چون Sandbox
agent-TTY ندارد، کلونِ مستقیم + overlay معادلِ همان نصب است).

## چی ساخته شد

- **انیمیشن پیکسلی «قدم زدن در پارک»** (`film/eras_walk.js` + `film/scenes/98_pixel_park.js`):
  پسر و سگش با قلاده از چپ به راست؛ چرخهٔ قدم پله‌ای، دمِ تکان‌خور، ابر و پرنده و پروانهٔ متحرک.
  خروجی: `renders/pixel-park-walk.mp4` و پیش‌نمایش زنده `/index.html?film=walk`.
- **فیلم تست** (`film/eras_test.js`): چهار دوره — Post-Impressionism → 8-bit → Bauhaus →
  سبک سفارشی **«کاشی صفوی»** (`film/scenes/99_persian.js`: ایوان، شمسهٔ چرخان، مناره‌ها،
  حوض با انعکاس موج‌دار، گذار mosaic). همه با همان کتابخانه‌های خود skill
  (`PAINT`, `U`, `MO`) و قرارداد `SCENES[id] = { draw(c, lt, t) }`.
- **رندرر headless** (`render.mjs`): سندباکس نه Chromium دارد نه ffmpeg و هاستِ دانلودشان هم
  مسدود است؛ پس موتور روی `@napi-rs/canvas@1.0.10` (Skia) با یک shim سبک DOM اجرا می‌شود
  (`shim.mjs`: تبدیل WOFF→TTF برای فونت‌ها، XHR هم‌گام، Image/FontFace) و فریم‌ها PNG-لوله
  می‌شوند به ffmpeg استاتیکِ `imageio-ffmpeg`. خروجی: `renders/art-motion-test.mp4`
  (۱۰۸۰p24، ~۱۰ ثانیه، بدون هیچ console.error — قرارداد شکستِ خود skill رعایت شده).
- **پیش‌نمایش زنده** (`serve.mjs`): موتورِ vendored را با فایل‌های فیلمِ این ریپو overlay می‌کند
  (`/` پورتال، `/index.html?film=test|test_lite|gallery`، خروجی‌ها زیر `/renders/`).

## اجرا

```sh
npm i                     # فقط @napi-rs/canvas
node serve.mjs 8080       # پیش‌نمایش زنده (مرورگر)
node render.mjs --film test_lite --fps 24 --out renders/x.mp4   # رندر headless
node render.mjs --film test --stills 1.2,6.2 --out renders/stills
```

ffmpeg از `../../.venv-media` (imageio-ffmpeg) یا `FFMPEG=...` یا PATH خوانده می‌شود.

## قیدهای سندباکس و راه‌حل‌ها (برای جلسهٔ بعد)

| قید | راه‌حل |
|---|---|
| بدون Playwright Chromium / ffmpeg (هاست دانلود مسدود) | رندر روی napi-rs canvas + ffmpeg استاتیک PyPI |
| فونت‌های CJK هنگام ثبت ~۷۰۰MB حافظه می‌گیرند | `pruneFonts()`: اگر فیلم متن CJK نداشته باشد حذف می‌شوند |
| `getImageData`/`new ImageData` در napi-rs بافر بومی را آزاد نمی‌کند | Proxy در `shim.mjs`: خواندن ۱/۸ وضوح + upsample (فقط برای نمونه‌گیری رنگ)؛ خروجی با `toBuffer('image/png')` که نشت ندارد |
| صحنه‌های سنگین (postimp/vaporwave) در napi-rs حافظهٔ بومیِ تجمعی دارند | فیلم headless (`test_lite`) از صحنه‌های سبک استفاده می‌کند؛ نسخهٔ مرورگری (`test`) شامل وان‌گوگ است و در مرورگر سالم اجرا می‌شود |
