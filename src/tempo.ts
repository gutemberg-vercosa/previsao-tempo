// Códigos de tempo da OMS (WMO) usados pela Open-Meteo.

export type Clima = 'limpo' | 'nuvens' | 'neblina' | 'chuva' | 'neve' | 'trovoada';

interface Condicao { texto: string; icone: string; noite?: string; clima: Clima }

const CONDICOES: Record<number, Condicao> = {
  0: { texto: 'Céu limpo', icone: '☀️', noite: '🌙', clima: 'limpo' },
  1: { texto: 'Predomínio de sol', icone: '🌤️', noite: '🌙', clima: 'limpo' },
  2: { texto: 'Parcialmente nublado', icone: '⛅', noite: '☁️', clima: 'nuvens' },
  3: { texto: 'Nublado', icone: '☁️', clima: 'nuvens' },
  45: { texto: 'Neblina', icone: '🌫️', clima: 'neblina' },
  48: { texto: 'Neblina com geada', icone: '🌫️', clima: 'neblina' },
  51: { texto: 'Garoa fraca', icone: '🌦️', noite: '🌧️', clima: 'chuva' },
  53: { texto: 'Garoa', icone: '🌦️', noite: '🌧️', clima: 'chuva' },
  55: { texto: 'Garoa forte', icone: '🌧️', clima: 'chuva' },
  56: { texto: 'Garoa congelante', icone: '🌧️', clima: 'chuva' },
  57: { texto: 'Garoa congelante forte', icone: '🌧️', clima: 'chuva' },
  61: { texto: 'Chuva fraca', icone: '🌦️', noite: '🌧️', clima: 'chuva' },
  63: { texto: 'Chuva', icone: '🌧️', clima: 'chuva' },
  65: { texto: 'Chuva forte', icone: '🌧️', clima: 'chuva' },
  66: { texto: 'Chuva congelante', icone: '🌧️', clima: 'chuva' },
  67: { texto: 'Chuva congelante forte', icone: '🌧️', clima: 'chuva' },
  71: { texto: 'Neve fraca', icone: '🌨️', clima: 'neve' },
  73: { texto: 'Neve', icone: '🌨️', clima: 'neve' },
  75: { texto: 'Neve forte', icone: '❄️', clima: 'neve' },
  77: { texto: 'Grãos de neve', icone: '🌨️', clima: 'neve' },
  80: { texto: 'Pancadas de chuva', icone: '🌦️', noite: '🌧️', clima: 'chuva' },
  81: { texto: 'Pancadas de chuva', icone: '🌧️', clima: 'chuva' },
  82: { texto: 'Pancadas fortes de chuva', icone: '⛈️', clima: 'chuva' },
  85: { texto: 'Pancadas de neve', icone: '🌨️', clima: 'neve' },
  86: { texto: 'Pancadas fortes de neve', icone: '❄️', clima: 'neve' },
  95: { texto: 'Trovoada', icone: '⛈️', clima: 'trovoada' },
  96: { texto: 'Trovoada com granizo', icone: '⛈️', clima: 'trovoada' },
  99: { texto: 'Trovoada com granizo forte', icone: '⛈️', clima: 'trovoada' },
};

const DESCONHECIDA: Condicao = { texto: 'Sem informação', icone: '🌡️', clima: 'nuvens' };

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
