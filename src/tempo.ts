// Códigos de tempo da OMS (WMO) usados pela Open-Meteo. Os ícones são símbolos SVG do index.html.

export type Clima = 'limpo' | 'nuvens' | 'neblina' | 'chuva' | 'neve' | 'trovoada';

interface Condicao { texto: string; icone: string; noite?: string; clima: Clima }

const CONDICOES: Record<number, Condicao> = {
  0: { texto: 'Céu limpo', icone: 'sol', noite: 'lua', clima: 'limpo' },
  1: { texto: 'Predomínio de sol', icone: 'sol-nuvem', noite: 'lua-nuvem', clima: 'limpo' },
  2: { texto: 'Parcialmente nublado', icone: 'sol-nuvem', noite: 'lua-nuvem', clima: 'nuvens' },
  3: { texto: 'Nublado', icone: 'nuvem', clima: 'nuvens' },
  45: { texto: 'Neblina', icone: 'neblina', clima: 'neblina' },
  48: { texto: 'Neblina com geada', icone: 'neblina', clima: 'neblina' },
  51: { texto: 'Garoa fraca', icone: 'sol-chuva', noite: 'chuva', clima: 'chuva' },
  53: { texto: 'Garoa', icone: 'sol-chuva', noite: 'chuva', clima: 'chuva' },
  55: { texto: 'Garoa forte', icone: 'chuva', clima: 'chuva' },
  56: { texto: 'Garoa congelante', icone: 'chuva', clima: 'chuva' },
  57: { texto: 'Garoa congelante forte', icone: 'chuva', clima: 'chuva' },
  61: { texto: 'Chuva fraca', icone: 'sol-chuva', noite: 'chuva', clima: 'chuva' },
  63: { texto: 'Chuva', icone: 'chuva', clima: 'chuva' },
  65: { texto: 'Chuva forte', icone: 'chuva', clima: 'chuva' },
  66: { texto: 'Chuva congelante', icone: 'chuva', clima: 'chuva' },
  67: { texto: 'Chuva congelante forte', icone: 'chuva', clima: 'chuva' },
  71: { texto: 'Neve fraca', icone: 'neve', clima: 'neve' },
  73: { texto: 'Neve', icone: 'neve', clima: 'neve' },
  75: { texto: 'Neve forte', icone: 'neve', clima: 'neve' },
  77: { texto: 'Grãos de neve', icone: 'neve', clima: 'neve' },
  80: { texto: 'Pancadas de chuva', icone: 'sol-chuva', noite: 'chuva', clima: 'chuva' },
  81: { texto: 'Pancadas de chuva', icone: 'chuva', clima: 'chuva' },
  82: { texto: 'Pancadas fortes de chuva', icone: 'chuva', clima: 'chuva' },
  85: { texto: 'Pancadas de neve', icone: 'neve', clima: 'neve' },
  86: { texto: 'Pancadas fortes de neve', icone: 'neve', clima: 'neve' },
  95: { texto: 'Trovoada', icone: 'trovoada', clima: 'trovoada' },
  96: { texto: 'Trovoada com granizo', icone: 'trovoada', clima: 'trovoada' },
  99: { texto: 'Trovoada com granizo forte', icone: 'trovoada', clima: 'trovoada' },
};

const DESCONHECIDA: Condicao = { texto: 'Sem informação', icone: 'nuvem', clima: 'nuvens' };

export function condicao(codigo: number, dia = true) {
  const c = CONDICOES[codigo] ?? DESCONHECIDA;
  return { texto: c.texto, icone: dia ? c.icone : (c.noite ?? c.icone), clima: c.clima };
}

/**
 * Posição da faixa de um dia (mínima a máxima) dentro da faixa da semana, em
 * porcentagem, como nas barras de temperatura do app Tempo do iPhone.
 */
export function faixa(min: number, max: number, minSemana: number, maxSemana: number) {
  const total = maxSemana - minSemana || 1;
  return { inicio: ((min - minSemana) / total) * 100, largura: ((max - min) / total) * 100 };
}
