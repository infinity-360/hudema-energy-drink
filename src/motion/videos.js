// Vídeos das seções: só baixam quando chegam perto da tela e só tocam enquanto estão visíveis.
// Com movimento reduzido, fica a capa parada.
export function videos({ reduzido }) {
  if (reduzido) return;
  const todos = [...document.querySelectorAll('video[data-video]')];
  const perto = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.src = e.target.dataset.src;
    perto.unobserve(e.target);
    vista.observe(e.target);
  }), { rootMargin: '40% 40%' });
  const vista = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) e.target.play().catch(() => {});
    else e.target.pause();
  }), { threshold: 0.15 });
  todos.forEach(v => perto.observe(v));
}
