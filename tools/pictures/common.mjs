// Shared pieces for the landmark drawings: a 200 x 160 picture with rounded corners and its own sky.
export const slug = n => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function frame(label, sky, body){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" role="img" aria-label="${label}">` +
    `<defs><clipPath id="f"><rect width="200" height="160" rx="14"/></clipPath>` +
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>` +
    `<g clip-path="url(#f)"><rect width="200" height="160" fill="url(#sky)"/>${body.replace(/\s*\n\s*/g, '')}</g></svg>\n`;
}
export const cloud = (x, y, s = 1, o = .85) => `<g fill="#fff" opacity="${o}"><ellipse cx="${x}" cy="${y}" rx="${16*s}" ry="${6*s}"/><ellipse cx="${x+10*s}" cy="${y-4*s}" rx="${11*s}" ry="${6*s}"/></g>`;
export const sun = (x, y, r = 12, c = '#f6c94c') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
// a row of arches: rounded-top openings from x0, every `step`, between y1 (top) and y2 (bottom)
export const arches = (x0, n, step, w, y1, y2, fill) => `<g fill="${fill}">` + Array.from({length: n}, (_, i) => {
  const x = x0 + i*step, r = w/2; return `<path d="M${x},${y2}V${y1+r}A${r},${r} 0 0 1 ${x+w},${y1+r}V${y2}Z"/>`; }).join('') + '</g>';
// many copies of a little shape
export const repeat = (n, f) => Array.from({length: n}, (_, i) => f(i)).join('');
// a five-pointed star
export const star = (cx, cy, r, fill) => `<polygon fill="${fill}" points="${Array.from({length: 10}, (_, i) => { const a = -Math.PI/2 + i*Math.PI/5, q = i%2 ? r*.45 : r; return (cx+q*Math.cos(a)).toFixed(1)+','+(cy+q*Math.sin(a)).toFixed(1); }).join(' ')}"/>`;
