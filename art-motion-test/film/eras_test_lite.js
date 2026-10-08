// Headless-render variant of the test film: same structure as eras_test.js but only
// scenes whose per-frame native cost stays flat under @napi-rs/canvas (the sandbox has
// no Chromium; the browser preview plays eras_test.js with the heavy Van Gogh scene).
const R = 1866;
window.ERAS = [
  { id: '01_cave', eighths: 8,
    counter: { year: -40000, roll: 0, x: R, y: 114, size: 84, font: 'GochiHand-400', color: '#f3ead8', spacing: 14,
      suffix: { text: 'BC', size: 44, gap: 18, dy: 0 }, label: { text: 'Cave painting', font: '38px "Kalam-700"', color: '#efe4cf', y: 178 } } },
  { id: '14_8bit', eighths: 6, transition: { type: 'pixelate', dur: 0.16, delay: 0 },
    counter: { year: 1985, roll: 0.07, x: R + 4, y: 86, size: 60, font: 'PressStart2P-400', color: '#ffffff', shadow: { color: '#0b1d24', x: 4, y: 4 },
      label: { text: '8-BIT', font: '30px "PressStart2P-400"', color: '#ffffff', y: 138, shadow: { color: '#0b1d24', x: 3, y: 3 } } } },
  { id: '12_bauhaus', eighths: 8, transition: { type: 'bauhaus', dur: 0.3, delay: 0, cx: 960, cy: 540 },
    counter: { year: 1923, roll: 0.2, x: R, y: 134, size: 104, font: 'ArchivoBlack-400', color: '#151515',
      label: { text: 'bauhaus', font: '36px "Poppins-800"', color: '#c4202b', y: 184 } } },
  { id: '99_persian', dur: 4.6, transition: { type: 'mosaic', dur: 0.5, delay: 0 },
    counter: { year: 1611, roll: 0.5, x: R, y: 132, size: 100, font: 'Marcellus-400', color: '#eaf4f1', shadow: { color: '#0d6b68', x: 3, y: 4 },
      label: { text: 'SAFAVID ISFAHAN', font: '30px "Marcellus-400"', color: '#d9a441', y: 184, spacing: 3 } } },
];
