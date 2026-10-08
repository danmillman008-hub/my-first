// Test film for the huashu-art-motion skill (Arena sandbox).
// ~10 s: three built-in styles (Post-Impressionism, Vaporwave, Bauhaus) then a custom
// Persian-tile era (scenes/99_persian.js). 128 BPM beat grid; durations in eighths.
const R = 1866;
window.ERAS = [
  { id: '09_postimp', eighths: 8,
    counter: { year: 1889, roll: 0.34, x: R, y: 134, size: 104, font: 'LilitaOne-400', color: '#f5d03b', shadow: { color: '#2a2a6a', x: 3, y: 4 },
      label: { text: 'Post-Impressionism', font: '34px "LilitaOne-400"', color: '#f5d03b', y: 182, shadow: { color: '#2a2a6a', x: 2, y: 3 } } } },
  { id: '26_vaporwave', eighths: 8, transition: { type: 'wave', dur: 0.42, delay: 0 },
    counter: { year: 2011, roll: 0.4, x: R, y: 130, size: 104, font: 'Exo2-800i', color: '#ffffff', shadow: { color: '#ff2fb4', x: 6, y: 5 },
      label: { text: 'VAPORWAVE', font: '32px "Righteous-400"', gradient: ['#7ff6ff', '#ff71ce'], y: 182, spacing: 7, shadow: { color: '#3a0a6a', x: 2, y: 2 } } } },
  { id: '12_bauhaus', eighths: 8, transition: { type: 'bauhaus', dur: 0.3, delay: 0, cx: 960, cy: 540 },
    counter: { year: 1923, roll: 0.2, x: R, y: 134, size: 104, font: 'ArchivoBlack-400', color: '#151515',
      label: { text: 'bauhaus', font: '36px "Poppins-800"', color: '#c4202b', y: 184 } } },
  { id: '99_persian', dur: 4.6, transition: { type: 'mosaic', dur: 0.5, delay: 0 },
    counter: { year: 1611, roll: 0.5, x: R, y: 132, size: 100, font: 'Marcellus-400', color: '#eaf4f1', shadow: { color: '#0d6b68', x: 3, y: 4 },
      label: { text: 'SAFAVID ISFAHAN', font: '30px "Marcellus-400"', color: '#d9a441', y: 184, spacing: 3 } } },
];
