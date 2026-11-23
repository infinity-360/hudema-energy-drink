// Os quadros do clipe 2 num <canvas>: baixa o manifest de arquivos/fonte/frames.mjs, desenha o 1º quadro assim que chega e
// carrega o resto em ordem grossa → fina (o último, depois a cada 16, 8, 4, 2, 1). Sem o quadro exato, desenha o
// carregado mais próximo: rolar antes de terminar nunca trava.
//   const f = filme({ canvas, base: '/frames/sabores' });
//   f.mostra(i)   // desenha o quadro i (ou o mais próximo já carregado)
export function filme({ canvas, base, simultâneos = 6 }) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const api = { total: 0, primeiro: null, mostra, mede };
  let imgs = [], pedido = 0, desenhado = -1;

  function maisPerto(i) {
    for (let d = 0; d < api.total; d++) {
      if (imgs[i - d]) return i - d;
      if (imgs[i + d]) return i + d;
    }
    return -1;
  }

  function mostra(i) {
    pedido = i;
    if (!api.total) return;
    const k = imgs[i] ? i : maisPerto(i);
    if (k < 0 || k === desenhado) return;
    const img = imgs[k];
    const { width: cw, height: ch } = canvas;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    desenhado = k;
  }

  function mede() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (!w || !h || (w === canvas.width && h === canvas.height)) return;
    canvas.width = w;
    canvas.height = h;
    desenhado = -1;
    mostra(pedido);
  }
  mede();
  // mede pelo próprio canvas: no Safari a altura pode assentar depois do primeiro desenho, sem evento de resize
  new ResizeObserver(mede).observe(canvas);

  const carrega = (url, i) => new Promise(ok => {
    const img = new Image();
    img.src = url;
    img.decode().then(() => { imgs[i] = img; }, () => {}).finally(ok);
  });

  api.primeiro = fetch(`${base}/manifest.json`).then(r => r.json()).then(async m => {
    api.total = m.count;
    imgs = new Array(m.count);
    const url = i => `${base}/${String(i + 1).padStart(4, '0')}.${m.ext}`;
    await carrega(url(0), 0);
    mostra(pedido);
    const ordem = [], visto = new Set([0]);
    if (m.count > 1) { ordem.push(m.count - 1); visto.add(m.count - 1); }
    for (let passo = 16; passo >= 1; passo /= 2)
      for (let i = 0; i < m.count; i += passo) if (!visto.has(i)) { visto.add(i); ordem.push(i); }
    Promise.all(Array.from({ length: simultâneos }, async () => {
      for (let i; (i = ordem.shift()) !== undefined; ) {
        await carrega(url(i), i);
        // chegou um quadro mais perto do que está na tela: redesenha
        if (Math.abs(i - pedido) < Math.abs(desenhado - pedido)) { desenhado = -1; mostra(pedido); }
      }
    }));
  });

  return api;
}
