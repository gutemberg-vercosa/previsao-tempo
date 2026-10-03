// Curva de temperatura das próximas horas, desenhada em SVG sem biblioteca.

export type Ponto = [number, number];

/**
 * Um ponto por valor, espaçados por `passo` na horizontal a partir do meio da primeira
 * coluna. O maior valor fica em `topo` e o menor em `base` (no SVG, y cresce para baixo).
 */
export function pontos(valores: number[], passo: number, topo: number, base: number): Ponto[] {
  const min = Math.min(...valores), max = Math.max(...valores);
  return valores.map((v, i) => [
    passo * (i + 0.5),
    max === min ? (topo + base) / 2 : base - ((v - min) / (max - min)) * (base - topo),
  ]);
}

/** Caminho suave que passa por todos os pontos (Catmull-Rom convertida em curvas de Bézier). */
export function caminho(p: Ponto[]): string {
  if (!p.length) return '';
  const r = (n: number) => +n.toFixed(1);
  let d = `M${r(p[0][0])},${r(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const [a, b, c, e] = [p[i - 1] ?? p[i], p[i], p[i + 1], p[i + 2] ?? p[i + 1]];
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    d += ` C${r(c1[0])},${r(c1[1])} ${r(c2[0])},${r(c2[1])} ${r(c[0])},${r(c[1])}`;
  }
  return d;
}
