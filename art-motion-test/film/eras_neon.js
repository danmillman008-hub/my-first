// «شبِ نئون» — سکانس سینمایی با است‌های تولیدی + کامپوزیت کدی.
window.PUNCH = 0;
if (!window.FONT_FACES.some(f => f.family === 'Vazirmatn-Medium')) {
  window.FONT_FACES.push({ family: 'Vazirmatn-Medium', url: 'fonts/Vazirmatn-Medium.ttf' });
  window.FONT_FACES.push({ family: 'Vazirmatn-Regular', url: 'fonts/Vazirmatn-Regular.ttf' });
}
window.ERAS = [
  { id: '96_neon_rain', dur: 16, assets: ['img/city_bg.jpg', 'img/neon_layer.png', 'img/fog_tile.png'] },
];
