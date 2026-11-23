// Palco: o Reel do splash toca em laço com o título; rolando, as latas Zero entram quadro a quadro no canvas, nos dois sentidos.
// Só o filme segue a rolagem. Os textos trocam por marcos (data-estado) e animam por tempo, no CSS.
import { filme } from './filme.js';
import { lenis, rolagem } from './rolagem.js';

const SAI = 0.05;     // telas de rolagem: o título sai
const COMECA = 0.1;   // o filme começa a cobrir o Reel…
const FUNDIDO = 0.22; // …e está inteiro
const FIM = 2.1;      // último quadro
const VMAX = 1 / 1.8; // fração do filme por segundo, no máximo
const SEGUE = 9;      // quão colado o filme anda na rolagem
const limita = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

export function palco({ reduzido }) {
  const secao = document.querySelector('[data-palco]');
  const hero = secao.querySelector('[data-hero]');
  const video = hero.querySelector('[data-hero-video]');
  const tela = hero.querySelector('[data-hero-filme]');

  // força o estilo inicial antes de trocar o estado: a entrada anima mesmo com a aba em segundo plano
  void hero.offsetWidth;
  hero.dataset.estado = 'abre';
  document.addEventListener('click', e => {
    if (!e.target.closest('a[href="#inicio"]')) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(0, { duration: 2 });
    else scrollTo(0, 0);
  });

  if (reduzido) { video.removeAttribute('src'); video.load(); return; }
  video.play().catch(() => {});

  const f = filme({ canvas: tela, base: 'frames/latas' });
  let temQuadro = false, t = 0, antes = performance.now();
  f.primeiro.then(() => { temQuadro = true; });

  rolagem(() => {
    const agora = performance.now();
    const dt = Math.min(0.05, (agora - antes) / 1000);
    antes = agora;
    const y = -secao.getBoundingClientRect().top / Math.max(1, hero.offsetHeight);
    const alvo = limita((y - COMECA) / (FIM - COMECA));
    const passo = (alvo - t) * (1 - Math.exp(-SEGUE * dt)), teto = VMAX * dt;
    t += Math.max(-teto, Math.min(teto, passo));
    if (Math.abs(alvo - t) < 0.0005) t = alvo;

    const cobre = temQuadro ? limita((y - COMECA) / (FUNDIDO - COMECA)) : 0;
    tela.style.opacity = cobre;
    if (f.total) f.mostra(Math.round(t * (f.total - 1)));
    if (cobre >= 1 && !video.paused) video.pause();
    if (cobre < 1 && video.paused) video.play().catch(() => {});

    const estado = y < SAI ? 'abre' : t >= 0.995 ? 'fim' : 'filme';
    if (hero.dataset.estado !== 'inicio' && hero.dataset.estado !== estado) hero.dataset.estado = estado;
    return t !== alvo;
  });
}
