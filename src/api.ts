// Dados da Open-Meteo (open-meteo.com): gratuita, sem cadastro e sem chave de API.
const PREVISAO = 'https://api.open-meteo.com/v1/forecast';
const BUSCA = 'https://geocoding-api.open-meteo.com/v1/search';

export interface Cidade { nome: string; regiao: string; lat: number; lon: number }
export interface Hora { hora: string; temp: number; chuva: number; codigo: number; dia: boolean }
export interface Dia { data: string; codigo: number; min: number; max: number; chuva: number }

export interface Previsao {
  atualizado: string; // horário local da cidade, como "2026-10-03T10:30"
  temp: number;
  sensacao: number;
  umidade: number;
  vento: number;
  codigo: number;
  dia: boolean;
  nascer: string;
  por: string;
  horas: Hora[]; // as próximas 24, a partir da hora atual
  dias: Dia[];
}

export async function buscarCidades(nome: string, sinal?: AbortSignal): Promise<Cidade[]> {
  const r = await fetch(`${BUSCA}?name=${encodeURIComponent(nome)}&count=6&language=pt`, { signal: sinal });
  if (!r.ok) throw new Error('Falha na busca');
  const { results = [] } = await r.json();
  return results.map((c: Record<string, string & number>) => ({
    nome: c.name,
    regiao: [c.admin1, c.country].filter(Boolean).join(', '),
    lat: c.latitude,
    lon: c.longitude,
  }));
}

export async function buscarPrevisao({ lat, lon }: Cidade): Promise<Previsao> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    hourly: 'temperature_2m,precipitation_probability,weather_code,is_day',
    daily: 'weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max,sunrise,sunset',
    timezone: 'auto',
  });
  const r = await fetch(`${PREVISAO}?${params}`);
  if (!r.ok) throw new Error('Falha na previsão');
  return montarPrevisao(await r.json());
}

/** Converte a resposta da API, que vem em colunas, para listas de horas e de dias. */
export function montarPrevisao({ current: c, hourly: h, daily: d }: RespostaApi): Previsao {
  const agora = Math.max(0, h.time.findIndex((t) => t.slice(0, 13) === c.time.slice(0, 13)));
  const horas = h.time.slice(agora, agora + 24).map((hora, i) => ({
    hora,
    temp: h.temperature_2m[agora + i],
    chuva: h.precipitation_probability[agora + i] ?? 0,
    codigo: h.weather_code[agora + i],
    dia: h.is_day[agora + i] === 1,
  }));
  const dias = d.time.map((data, i) => ({
    data,
    codigo: d.weather_code[i],
    min: d.temperature_2m_min[i],
    max: d.temperature_2m_max[i],
    chuva: d.precipitation_probability_max[i] ?? 0,
  }));
  return {
    atualizado: c.time,
    temp: c.temperature_2m,
    sensacao: c.apparent_temperature,
    umidade: c.relative_humidity_2m,
    vento: c.wind_speed_10m,
    codigo: c.weather_code,
    dia: c.is_day === 1,
    nascer: d.sunrise[0],
    por: d.sunset[0],
    horas,
    dias,
  };
}

export interface RespostaApi {
  current: {
    time: string; temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number;
    wind_speed_10m: number; weather_code: number; is_day: number;
  };
  hourly: {
    time: string[]; temperature_2m: number[]; precipitation_probability: (number | null)[];
    weather_code: number[]; is_day: number[];
  };
  daily: {
    time: string[]; weather_code: number[]; temperature_2m_min: number[]; temperature_2m_max: number[];
    precipitation_probability_max: (number | null)[]; sunrise: string[]; sunset: string[];
  };
}
