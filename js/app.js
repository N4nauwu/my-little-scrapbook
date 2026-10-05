const $ = s => document.querySelector(s);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin espacio */ } };

/* Listas editables: vinilo (top 5) y películas (con estrellas) */
function lista(ul, form, input, key, inicial, max, estrellas) {
  const datos = load(key, inicial);
  const dibujar = () => {
    ul.innerHTML = '';
    datos.forEach((x, i) => {
      const li = document.createElement('li'), s = document.createElement('span'), b = document.createElement('button');
      s.textContent = x.t;
      b.textContent = '✕'; b.className = 'del'; b.setAttribute('aria-label', 'Quitar');
      b.onclick = () => { datos.splice(i, 1); save(key, datos); dibujar(); };
      li.append(s);
      if (estrellas) {
        const st = document.createElement('button'), r = x.r || 0;
        st.className = 'star'; st.textContent = '★'.repeat(r) + '☆'.repeat(5 - r);
        st.setAttribute('aria-label', 'Calificar');
        st.onclick = () => { x.r = (r + 1) % 6; save(key, datos); dibujar(); };
        li.append(st);
      }
      li.append(b); ul.append(li);
    });
  };
  form.onsubmit = e => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    if (max && datos.length >= max) { alert('El top tiene máximo ' + max + '. Quita uno para agregar otro.'); return; }
    datos.push({ t: v }); save(key, datos); input.value = ''; dibujar();
  };
  dibujar();
}
lista($('#movieList'), $('#movieForm'), $('#movieInput'), 'sb_movies_top', [{ t: 'Tu película del mes' }], 5, false);
$('#mes').textContent = new Date().toLocaleDateString('en-US', { month: 'long' });

/* Libro álbum: 3 páginas dobles, fotos y pies de foto guardados */
const TOTAL = 3;
let pag = 0;
const fotos = load('sb_fotos', {}), pies = load('sb_pies', {});
function polaroid(id) {
  const p = document.createElement('div'), l = document.createElement('label'), f = document.createElement('input'), c = document.createElement('div');
  p.className = 'polaroid'; p.style.setProperty('--r', (Math.random() * 8 - 4) + 'deg');
  f.type = 'file'; f.accept = 'image/*';
  if (fotos[id]) l.style.backgroundImage = 'url(' + fotos[id] + ')'; else l.append('＋');
  f.onchange = () => {
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const k = document.createElement('canvas'), z = Math.min(1, 300 / im.width);
        k.width = im.width * z; k.height = im.height * z;
        k.getContext('2d').drawImage(im, 0, 0, k.width, k.height);
        fotos[id] = k.toDataURL('image/jpeg', .7); save('sb_fotos', fotos); libro();
      };
      im.src = r.result;
    };
    r.readAsDataURL(f.files[0]);
  };
  c.className = 'cap'; c.contentEditable = 'true'; c.textContent = pies[id] || 'escribe algo...';
  c.oninput = () => { pies[id] = c.textContent; save('sb_pies', pies); };
  l.append(f); p.append(l, c);
  return p;
}
function libro() {
  [$('#pageL'), $('#pageR')].forEach((pg, i) => {
    pg.innerHTML = '';
    pg.append(polaroid(pag + '-' + i + '-a'), polaroid(pag + '-' + i + '-b'));
  });
  $('#pageNum').textContent = (pag + 1) + ' / ' + TOTAL;
}
function girar(d) {
  pag = Math.min(TOTAL - 1, Math.max(0, pag + d)); libro();
  const b = $('.book'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
}
$('#prev').onclick = () => girar(-1);
$('#next').onclick = () => girar(1);
libro();

/* Sobre de cartas */
const sobre = $('#envelope');
sobre.onclick = e => {
  if (sobre.classList.contains('open') && e.target.closest('.letter')) return;
  sobre.classList.toggle('open');
};
['to', 'mail', 'msg'].forEach(id => {
  const el = $('#' + id);
  el.value = load('sb_' + id, '');
  el.oninput = () => save('sb_' + id, el.value);
});

/* Vinilo grande: top 5 con foto y nombre */
const colores = ['#f78fb8', '#f6d84c', '#8fc7f5', '#a6d36b', '#b9a2f2'], angulos = [160, 125, 90, 55, 20];
const top5 = load('sb_top5', { n: [], i: [] });
function redim(file, max, ok) {
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = document.createElement('canvas'), z = Math.min(1, max / im.width);
      k.width = im.width * z; k.height = im.height * z;
      k.getContext('2d').drawImage(im, 0, 0, k.width, k.height);
      ok(k.toDataURL('image/jpeg', .7));
    };
    im.src = r.result;
  };
  r.readAsDataURL(file);
}
top5.m = top5.m || [];
async function portada(nombre) {
  const r = await fetch('https://itunes.apple.com/search?media=music&entity=album&attribute=artistTerm&limit=1&term=' + encodeURIComponent(nombre));
  const u = (await r.json()).results[0]?.artworkUrl100;
  return u ? u.replace('100x100bb', '400x400bb') : null;
}
function pintar(s, url) {
  s.style.backgroundImage = 'url(' + url + ')';
  if (s.firstChild.nodeType === 3) s.firstChild.remove();
}
function vinilo() {
  const st = $('#vinilo .stage'), ol = $('#topList');
  st.querySelectorAll('.slot').forEach(s => s.remove()); ol.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const s = document.createElement('label'), f = document.createElement('input');
    s.className = 'slot'; s.dataset.n = i + 1;
    s.style.setProperty('--a', angulos[i] + 'deg'); s.style.setProperty('--c', colores[i]);
    f.type = 'file'; f.accept = 'image/*';
    s.append('＋');
    if (top5.i[i]) pintar(s, top5.i[i]);
    f.onchange = () => redim(f.files[0], 240, d => { top5.i[i] = d; top5.m[i] = true; save('sb_top5', top5); pintar(s, d); });
    s.append(f); st.append(s);
    const li = document.createElement('li'), n = document.createElement('input');
    n.placeholder = 'Artista o banda'; n.maxLength = 40; n.value = top5.n[i] || '';
    n.setAttribute('aria-label', 'Artista ' + (i + 1));
    n.oninput = () => { top5.n[i] = n.value; save('sb_top5', top5); };
    n.onchange = async () => {
      const v = n.value.trim();
      if (!v || top5.m[i]) return; /* si subiste tu propia foto, no se reemplaza */
      try { const u = await portada(v); if (u) { top5.i[i] = u; save('sb_top5', top5); pintar(s, u); } }
      catch { /* sin internet: sube la foto a mano */ }
    };
    li.append(n); ol.append(li);
  }
}
vinilo();

/* Letras de revista: cada letra con su propio recorte */
function revista(el) {
  const t = el.textContent; el.textContent = ''; el.setAttribute('aria-label', t);
  [...t].forEach(ch => {
    if (ch === ' ') { el.append(' '); return; }
    const s = document.createElement('span'); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); el.append(s);
  });
}
document.querySelectorAll('[data-mag]').forEach(revista);

/* Enviar la carta por correo (Gmail web o programa de correo predeterminado) */
function enviar(gmail) {
  const para = $('#mail').value.trim(), nom = $('#to').value.trim(), msg = $('#msg').value.trim();
  if (!para || !msg) { alert('Escribe el correo y tu carta primero ♡'); return; }
  const asunto = 'Una carta para ti' + (nom ? ', ' + nom : '');
  const cuerpo = (nom ? 'Hola ' + nom + ',\n\n' : '') + msg + '\n\n(enviado desde mi scrapbook)';
  const q = 'su=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo);
  if (gmail) window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(para) + '&' + q, '_blank');
  else location.href = 'mailto:' + para + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo);
}
$('#gmail').onclick = () => enviar(true);
$('#mailto').onclick = () => enviar(false);

/* Bienvenida y nombre */
let nombre = load('sb_nombre', '');
const modal = $('#bienvenida');
function ponerNombre(n) { const el = $('#nombreGrande'); el.textContent = n; revista(el); }
if (nombre) ponerNombre(nombre); else modal.hidden = false;
$('#cambiarNombre').onclick = () => {
  $('#pide').hidden = false; $('#hola').hidden = true; $('#nombre').value = nombre; modal.hidden = false;
};
$('#nomForm').onsubmit = e => {
  e.preventDefault();
  nombre = $('#nombre').value.trim();
  if (!nombre) return;
  save('sb_nombre', nombre); ponerNombre(nombre);
  $('#pide').hidden = true;
  const h = $('#hola'); h.hidden = false; h.textContent = 'Hola, ' + nombre; revista(h);
  setTimeout(() => { modal.hidden = true; }, 1800);
};

/* Exportar en formato historia de Instagram (1080 x 1920) */
const cargar = src => new Promise(ok => {
  if (!src) return ok(null);
  const im = new Image();
  if (/^http/.test(src)) im.crossOrigin = 'anonymous';
  im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src;
});
function pegar(c, im, x, y, w, rot) {
  if (!im) return;
  const h = im.height * w / im.width;
  c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot * Math.PI / 180);
  [[3, 0], [-3, 0], [0, 3], [0, -3]].forEach(([dx, dy]) => {
    c.shadowColor = '#fff'; c.shadowBlur = 0; c.shadowOffsetX = dx; c.shadowOffsetY = dy; c.drawImage(im, -w / 2, -h / 2, w, h);
  });
  c.shadowColor = '#0006'; c.shadowOffsetX = 4; c.shadowOffsetY = 6; c.drawImage(im, -w / 2, -h / 2, w, h);
  c.restore();
}
async function exportar() {
  const btn = $('#exportar'); btn.disabled = true; btn.textContent = 'Creando tu imagen...';
  try {
    await Promise.all(['64px Chewy', '600 64px Poppins', '600 64px Caveat', 'italic 700 64px Georgia'].map(f => document.fonts.load(f).catch(() => {})));
    const W = 1080, H = 1920, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'), nom = nombre || 'tu nombre';
    const nombresSt = ['camara', 'estrella', 'flor', 'mariposa', 'corazon', 'cerebro', 'gato3', 'pez'];
    const [fondo, ...r] = await Promise.all([cargar('img/hojaazul.png'), ...nombresSt.map(n => cargar('img/' + n + '.png')), ...[0, 1, 2, 3, 4].map(i => cargar(top5.i[i]))]);
    const st = r.slice(0, 8), portadas = r.slice(8);
    c.fillStyle = '#5f7fa8'; c.fillRect(0, 0, W, H);
    if (fondo) { const z = Math.max(W / fondo.width, H / fondo.height); c.drawImage(fondo, (W - fondo.width * z) / 2, (H - fondo.height * z) / 2, fondo.width * z, fondo.height * z); }
    /* nombre con letras de revista */
    const fu = ['700 {s}px Georgia', '{s}px Chewy', '600 {s}px Poppins', 'italic 700 {s}px Georgia', '600 {s}px Caveat'];
    const fo = ['#fff', '#111', '#f78fb8', '#fff3a3', '#cfe3ff'], ti = ['#111', '#fff', '#fff', '#3b2a33', '#3b2a33'], gi = [-3, 2, -1, 3, -2];
    const letras = [...nom], s = Math.min(170, Math.floor(980 / (letras.length * 0.85)));
    const ms = letras.map((ch, k) => { c.font = fu[k % 5].replace('{s}', s); return ch === ' ' ? s * 0.4 : c.measureText(ch).width + s * 0.25; });
    let x = (W - ms.reduce((a, b) => a + b + 6, 0)) / 2;
    letras.forEach((ch, k) => {
      const w = ms[k];
      if (ch !== ' ') {
        c.save(); c.translate(x + w / 2, 260); c.rotate(gi[k % 5] * Math.PI / 180);
        c.shadowColor = '#0004'; c.shadowOffsetX = 4; c.shadowOffsetY = 6; c.fillStyle = fo[k % 5]; c.fillRect(-w / 2, -s * 0.85, w, s * 1.15);
        c.shadowColor = 'transparent'; c.fillStyle = ti[k % 5]; c.font = fu[k % 5].replace('{s}', s); c.textAlign = 'center'; c.fillText(ch, 0, 0);
        c.restore();
      }
      x += w + 6;
    });
    const titulo = (t, y) => { c.textAlign = 'center'; c.font = '84px Chewy'; c.fillStyle = '#f78fb8'; c.fillText(t, 543, y + 4); c.fillStyle = '#ffd6e7'; c.fillText(t, 540, y); };
    titulo('Favorite Artists', 520);
    /* medio vinilo */
    const cx = 540, cy = 1130, R = 420;
    c.save(); c.beginPath(); c.rect(0, 0, W, cy); c.clip();
    c.fillStyle = '#111'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    c.strokeStyle = '#2a2a2a'; c.lineWidth = 2;
    for (let q = 150; q < R - 6; q += 8) { c.beginPath(); c.arc(cx, cy, q, 0, 7); c.stroke(); }
    c.fillStyle = '#f78fb8'; c.beginPath(); c.arc(cx, cy, 150, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.font = '64px Chewy'; c.textAlign = 'center'; c.fillText('top 5', cx, cy - 40);
    c.restore();
    /* portadas */
    for (let i = 0; i < 5; i++) {
      const a = angulos[i] * Math.PI / 180, z = 170;
      c.save(); c.translate(cx + Math.cos(a) * 336, cy - Math.sin(a) * 336); c.rotate((90 - angulos[i]) * 0.12 * Math.PI / 180);
      c.shadowColor = '#0006'; c.shadowOffsetX = 5; c.shadowOffsetY = 7; c.fillStyle = colores[i]; c.fillRect(-z / 2 - 8, -z / 2 - 8, z + 16, z + 16);
      c.shadowColor = 'transparent';
      const p = portadas[i];
      if (p) { const m = Math.min(p.width, p.height); c.drawImage(p, (p.width - m) / 2, (p.height - m) / 2, m, m, -z / 2, -z / 2, z, z); }
      else { c.fillStyle = '#fff'; c.fillRect(-z / 2, -z / 2, z, z); c.fillStyle = colores[i]; c.font = '80px Chewy'; c.textAlign = 'center'; c.fillText('♪', 0, 28); }
      c.fillStyle = colores[i]; c.fillRect(-z / 2 - 8, -z / 2 - 8, 52, 48);
      c.fillStyle = '#fff'; c.font = '34px Chewy'; c.textAlign = 'left'; c.fillText(i + 1, -z / 2 + 6, -z / 2 + 26);
      c.restore();
    }
    /* lista de artistas */
    c.fillStyle = '#ffe3ef'; c.beginPath(); c.roundRect(90, 1130, 900, 290, [0, 0, 24, 24]); c.fill();
    c.setLineDash([14, 10]); c.strokeStyle = '#f78fb8'; c.lineWidth = 4; c.beginPath(); c.moveTo(90, 1132); c.lineTo(990, 1132); c.stroke(); c.setLineDash([]);
    c.textAlign = 'left';
    for (let i = 0; i < 5; i++) {
      c.font = '600 38px Poppins'; c.fillStyle = '#f78fb8'; c.fillText('0' + (i + 1), 130, 1195 + i * 54);
      c.fillStyle = '#3b2a33'; c.fillText(top5.n[i] || '—', 220, 1195 + i * 54);
    }
    /* películas */
    titulo('Top movies of ' + new Date().toLocaleDateString('en-US', { month: 'long' }), 1520);
    c.fillStyle = '#fffdf6'; c.beginPath(); c.roundRect(90, 1550, 900, 300, 14); c.fill();
    c.fillStyle = '#c9d97acc'; c.fillRect(440, 1536, 200, 28);
    const pel = load('sb_movies_top', []);
    for (let i = 0; i < 5; i++) {
      c.textAlign = 'left'; c.font = '600 38px Poppins'; c.fillStyle = '#f78fb8'; c.fillText('0' + (i + 1), 130, 1620 + i * 52);
      c.fillStyle = '#3b2a33'; c.fillText(pel[i] ? pel[i].t : '—', 220, 1620 + i * 52);
    }
    c.textAlign = 'center'; c.font = '34px Chewy'; c.fillStyle = '#ffd6e7'; c.fillText('my little scrapbook ✦', 540, 1895);
    /* stickers */
    [[0, 40, 60, 250, -8], [1, 800, 50, 210, 12], [2, 30, 400, 180, -6], [3, 880, 420, 130, 14], [4, 10, 900, 140, -8], [5, 20, 1450, 160, -10], [6, 850, 1430, 170, 8], [7, 790, 1760, 230, -12]]
      .forEach(([k, px, py, w, rot]) => pegar(c, st[k], px, py, w, rot));
    cv.toBlob(b => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'scrapbook-historia.png'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
  } catch (e) { alert('No se pudo crear la imagen. Intenta de nuevo.'); }
  btn.disabled = false; btn.textContent = '📸 Guardar para historia de Instagram';
}
$('#exportar').onclick = exportar;
