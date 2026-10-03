import { describe, expect, it } from 'vitest';
import { montarPrevisao, type RespostaApi } from './api';
import { caminho, pontos } from './grafico';
import { condicao, faixa } from './tempo';

const horas = Array.from({ length: 48 }, (_, i) => `2026-10-${i < 24 ? '03' : '04'}T${String(i % 24).padStart(2, '0')}:00`);

const resposta: RespostaApi = {
  current: {
    time: '2026-10-03T10:30', temperature_2m: 20.7, apparent_temperature: 21, relative_humidity_2m: 69,
    wind_speed_10m: 8.9, weather_code: 3, is_day: 1,
  },
  hourly: {
    time: horas,
    temperature_2m: horas.map((_, i) => i),
    precipitation_probability: horas.map((_, i) => (i === 12 ? null : 10)),
    weather_code: horas.map(() => 0),
    is_day: horas.map((_, i) => +(i % 24 >= 6 && i % 24 < 18)),
  },
  daily: {
    time: ['2026-10-03', '2026-10-04'], weather_code: [3, 61], temperature_2m_min: [15, 14],
    temperature_2m_max: [25, 22], precipitation_probability_max: [10, null],
    sunrise: ['2026-10-03T05:41', '2026-10-04T05:40'], sunset: ['2026-10-03T18:05', '2026-10-04T18:05'],
  },
};

describe('montarPrevisao', () => {
  const p = montarPrevisao(resposta);

  it('começa as próximas horas na hora atual e pega 24', () => {
    expect(p.horas).toHaveLength(24);
    expect(p.horas[0]).toMatchObject({ hora: '2026-10-03T10:00', temp: 10, dia: true });
    expect(p.horas[23].hora).toBe('2026-10-04T09:00');
    expect(p.horas[9].dia).toBe(false); // 19h
  });

  it('troca chance de chuva ausente por zero', () => {
    expect(p.horas[2].chuva).toBe(0);
    expect(p.dias[1].chuva).toBe(0);
  });

  it('monta os dias e o sol de hoje', () => {
    expect(p.dias).toEqual([
      { data: '2026-10-03', codigo: 3, min: 15, max: 25, chuva: 10 },
      { data: '2026-10-04', codigo: 61, min: 14, max: 22, chuva: 0 },
    ]);
    expect(p).toMatchObject({ temp: 20.7, sensacao: 21, dia: true, nascer: '2026-10-03T05:41', por: '2026-10-03T18:05' });
  });
});

describe('condicao', () => {
  it('usa o ícone da noite quando existe', () => {
    expect(condicao(0, true)).toEqual({ texto: 'Céu limpo', icone: 'sol', clima: 'limpo' });
    expect(condicao(0, false).icone).toBe('lua');
    expect(condicao(3, false).icone).toBe('nuvem');
  });

  it('tem um padrão para códigos desconhecidos', () => {
    expect(condicao(42).texto).toBe('Sem informação');
  });
});

describe('faixa', () => {
  it('posiciona o dia dentro da semana', () => {
    expect(faixa(15, 25, 10, 30)).toEqual({ inicio: 25, largura: 50 });
  });

  it('não divide por zero numa semana sem variação', () => {
    expect(faixa(20, 20, 20, 20)).toEqual({ inicio: 0, largura: 0 });
  });
});

describe('gráfico', () => {
  it('põe o maior valor no topo e o menor na base', () => {
    expect(pontos([10, 30, 20], 50, 0, 100)).toEqual([[25, 100], [75, 0], [125, 50]]);
  });

  it('centraliza valores iguais', () => {
    expect(pontos([5, 5], 10, 20, 60).map((p) => p[1])).toEqual([40, 40]);
  });

  it('passa por todos os pontos', () => {
    const d = caminho([[0, 0], [10, 20], [20, 0]]);
    expect(d.startsWith('M0,0')).toBe(true);
    expect(d).toMatch(/ 10,20 C/);
    expect(d.endsWith(' 20,0')).toBe(true);
    expect(caminho([])).toBe('');
  });
});
