import { buscarCidades, buscarPrevisao, type Cidade, type Previsao } from './api';
import { caminho, pontos } from './grafico';
import { condicao, faixa } from './tempo';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const busca = $<HTMLInputElement>('busca');
const resultados = $('resultados');

// O navegador pode bloquear o armazenamento (aba anônima, por exemplo): aí nada é salvo.
function ler<T>(chave: string, padrao: T): T {
  try {
    return JSON.parse(localStorage.getItem(chave)!) ?? padrao;
  } catch {
    return padrao;
  }
}
function salvar(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch { /* segue sem salvar */ }
}

const PADRAO: Cidade = { nome: 'São Paulo', regiao: 'São Paulo, Brasil', lat: -23.5475, lon: -46.6361 };
const COLUNA = 56; // largura de cada hora no gráfico, em px
const ALTURA = 64;

interface Ultima { cidade: Cidade; previsao: Previsao }

let cidade = PADRAO;
let favoritos = ler<Cidade[]>('favoritos', []);

const mesma = (a: Cidade, b: Cidade) => a.lat === b.lat && a.lon === b.lon;
const graus = (t: number) => `${Math.round(t)}°`;
const hora = (iso: string) => iso.slice(11, 16);

function nomeDia(data: string, i: number) {
  if (i === 0) return 'Hoje';
  const nome = new Date(`${data}T12:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return nome[0].toUpperCase() + nome.slice(1);
}

async function carregar(c: Cidade) {
  cidade = c;
  mostrarCidade();
  $('status').textContent = 'Atualizando…';
  try {
    const previsao = await buscarPrevisao(c);
    if (c !== cidade) return; // outra cidade foi escolhida enquanto esta carregava
    mostrar(previsao);
    salvar('ultima', { cidade: c, previsao });
    $('status').textContent = `Atualizado às ${hora(previsao.atualizado)} (horário local)`;
  } catch {
    if (c !== cidade) return;
    const ultima = ler<Ultima | null>('ultima', null);
    if (ultima && mesma(ultima.cidade, c)) {
      mostrar(ultima.previsao);
      $('status').textContent = `Sem conexão. Mostrando os dados das ${hora(ultima.previsao.atualizado)}.`;
    } else {
      $('status').textContent = 'Não foi possível carregar a previsão. Verifique a conexão e tente de novo.';
    }
  }
}

function mostrarCidade() {
  $('cidade').textContent = cidade.nome;
  $('regiao').textContent = cidade.regiao;
  const favorita = favoritos.some((f) => mesma(f, cidade));
  const botao = $('favoritar');
  botao.textContent = favorita ? '★' : '☆';
  botao.setAttribute('aria-pressed', String(favorita));
  botao.setAttribute('aria-label', favorita ? 'Remover das favoritas' : 'Favoritar cidade');
  botao.title = botao.getAttribute('aria-label')!;

  $('favoritos').replaceChildren(...favoritos.map((f) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = f.nome;
    b.title = f.regiao;
    if (mesma(f, cidade)) b.setAttribute('aria-current', 'true');
    b.addEventListener('click', () => carregar(f));
    return b;
  }));
}

function mostrar(p: Previsao) {
  const agora = condicao(p.codigo, p.dia);
  const hoje = p.dias[0];
  document.body.dataset.clima = agora.clima;
  document.body.dataset.periodo = p.dia ? 'dia' : 'noite';
  $('icone').textContent = agora.icone;
  $('temp').textContent = graus(p.temp);
  $('condicao').textContent = agora.texto;
  $('extremos').textContent = `Máx. ${graus(hoje.max)} · Mín. ${graus(hoje.min)}`;
  $('sensacao').textContent = graus(p.sensacao);
  $('umidade').textContent = `${p.umidade}%`;
  $('vento').textContent = `${Math.round(p.vento)} km/h`;
  $('chuva').textContent = `${hoje.chuva}%`;
  $('nascer').textContent = hora(p.nascer);
  $('por').textContent = hora(p.por);
  mostrarHoras(p);
  mostrarDias(p);
}

/** Hora a hora: horário, ícone, curva de temperatura e chance de chuva. */
function mostrarHoras({ horas }: Previsao) {
  const largura = horas.length * COLUNA;
  const pts = pontos(horas.map((h) => h.temp), COLUNA, 22, ALTURA - 8);
  const rotulos = pts.map(([x, y], i) => `<text x="${x}" y="${y - 10}">${graus(horas[i].temp)}</text>`).join('');
  const grade = $('horas');
  grade.style.gridTemplateColumns = `repeat(${horas.length}, ${COLUNA}px)`;
  grade.innerHTML = `
    ${horas.map((h, i) => `<span class="hora">${i ? hora(h.hora).slice(0, 2) + 'h' : 'Agora'}</span>`).join('')}
    ${horas.map((h) => `<span class="icone-hora">${condicao(h.codigo, h.dia).icone}</span>`).join('')}
    <svg class="curva" width="${largura}" height="${ALTURA}" viewBox="0 0 ${largura} ${ALTURA}" aria-hidden="true">
      <path d="${caminho(pts)}"/>${rotulos}
    </svg>
    ${horas.map((h) => `<span class="chance">${h.chuva >= 20 ? `💧${h.chuva}%` : ''}</span>`).join('')}`;
  grade.parentElement!.setAttribute('aria-label', `Previsão hora a hora: ${horas
    .map((h) => `${hora(h.hora)}, ${graus(h.temp)}, ${condicao(h.codigo, h.dia).texto}`)
    .join('; ')}`);
}

function mostrarDias({ dias }: Previsao) {
  const minSemana = Math.min(...dias.map((d) => d.min));
  const maxSemana = Math.max(...dias.map((d) => d.max));
  $('dias').innerHTML = dias.map((d, i) => {
    const { texto, icone } = condicao(d.codigo);
    const { inicio, largura } = faixa(d.min, d.max, minSemana, maxSemana);
    return `<li>
      <span class="dia">${nomeDia(d.data, i)}</span>
      <span class="icone-dia" title="${texto}">${icone}<small>${d.chuva >= 20 ? `${d.chuva}%` : ''}</small></span>
      <span class="min">${graus(d.min)}</span>
      <span class="barra" aria-hidden="true"><i style="left:${inicio}%;width:${largura}%"></i></span>
      <span class="max">${graus(d.max)}</span>
    </li>`;
  }).join('');
}

// Busca de cidades: espera a pessoa parar de digitar e cancela a busca anterior.
let espera = 0;
let controle: AbortController | undefined;
let encontradas: Cidade[] = [];

function fecharBusca() {
  resultados.hidden = true;
  busca.setAttribute('aria-expanded', 'false');
}

function escolher(c: Cidade) {
  busca.value = '';
  fecharBusca();
  carregar(c);
}

busca.addEventListener('input', () => {
  clearTimeout(espera);
  controle?.abort();
  const nome = busca.value.trim();
  if (nome.length < 2) return fecharBusca();
  espera = window.setTimeout(async () => {
    controle = new AbortController();
    try {
      encontradas = await buscarCidades(nome, controle.signal);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      encontradas = [];
    }
    resultados.replaceChildren(...(encontradas.length
      ? encontradas.map((c) => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.append(c.nome, Object.assign(document.createElement('small'), { textContent: c.regiao }));
        b.addEventListener('click', () => escolher(c));
        li.append(b);
        return li;
      })
      : [Object.assign(document.createElement('li'), { className: 'vazio', textContent: 'Nenhuma cidade encontrada' })]));
    resultados.hidden = false;
    busca.setAttribute('aria-expanded', 'true');
  }, 300);
});

busca.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && encontradas.length && !resultados.hidden) escolher(encontradas[0]);
  if (e.key === 'Escape') fecharBusca();
});

document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('.busca')) fecharBusca();
});

$('local').addEventListener('click', () => {
  if (!navigator.geolocation) {
    $('status').textContent = 'Este navegador não informa a localização.';
    return;
  }
  $('status').textContent = 'Buscando sua localização…';
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => carregar({
      nome: 'Sua localização',
      regiao: `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`,
      lat: +coords.latitude.toFixed(4),
      lon: +coords.longitude.toFixed(4),
    }),
    () => { $('status').textContent = 'Não foi possível obter sua localização. Busque a cidade pelo nome.'; },
  );
});

$('favoritar').addEventListener('click', () => {
  favoritos = favoritos.some((f) => mesma(f, cidade))
    ? favoritos.filter((f) => !mesma(f, cidade))
    : [...favoritos, cidade];
  salvar('favoritos', favoritos);
  mostrarCidade();
});

// Abre já com a última consulta, se houver, enquanto busca os dados novos.
const ultima = ler<Ultima | null>('ultima', null);
if (ultima) {
  cidade = ultima.cidade;
  mostrar(ultima.previsao);
}
carregar(cidade);
