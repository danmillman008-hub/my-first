// «شبِ نئون» — سکانس سینمایی با است‌های تولیدی + کامپوزیت کدی.
window.PUNCH = 0;
if (!window.FONT_FACES.some(f => f.family === 'Vazirmatn-Medium')) {
  window.FONT_FACES.push({ family: 'Vazirmatn-Medium', url: 'fonts/Vazirmatn-Medium.ttf' });
  window.FONT_FACES.push({ family: 'Vazirmatn-Regular', url: 'fonts/Vazirmatn-Regular.ttf' });
}
window.ERAS = [
  { id: '96_neon_rain', dur: 16, assets: ['img/city_bg.jpg', 'img/neon_layer.png', 'img/hero_green.png', 'img/hero_walk1.png', 'img/hero_walk2.png', 'img/hero_walk3.png', 'img/hero_walk4.png', 'img/fog_tile.png'] },
];
