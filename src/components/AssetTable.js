// src/components/AssetTable.js
import React, { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtN = (v, d = 2) => (v || 0).toFixed(d);

// Busca cotação via brapi.dev (gratuito para B3) ou coingecko (cripto)
async function fetchPrice(ticker, type) {
  try {
    if (type === 'cripto') {
      const map = { BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', DOT: 'polkadot-new' };
      const id = map[ticker.toUpperCase()] || ticker.toLowerCase();
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=brl`);
      const json = await res.json();
      return json[id]?.brl || null;
    } else {
      // B3 via brapi
      const res = await fetch(`https://brapi.dev/api/quote/${ticker}?token=demo`);
      const json = await res.json();
      return json?.results?.[0]?.regularMarketPrice || null;
    }
  } catch {
    return null;
  }
}

export default function AssetTable({ collectionName, tipo, aporteFromPatrimonio, label, icon, corAcento }) {
  const COLOR = corAcento || '#4f8ef7';
  const DEFAULT_DATA = { patrimonio: 0, ativos: [] };
  const { data, loading, save } = useFirestore(collectionName, DEFAULT_DATA);
  const { data: patrimonioData } = useFirestore('patrimonio', { classes: [] });

  const [d, setD] = useState(DEFAULT_DATA);
  const [prices, setPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [adding, setAdding] = useState(false);
  const [novo, setNovo] = useState({ nome: '', atual: '', ideal: '' });

  useEffect(() => { if (!loading) setD(data); }, [data, loading]);

  // Calcula o aporte sugerido a partir da tela de Patrimônio
  const classeInfo = (patrimonioData?.classes || []).find(c => c.id === aporteFromPatrimonio);
  const aporteSugerido = classeInfo
    ? Math.max(0, (classeInfo.ideal - classeInfo.atual) * (patrimonioData?.patrimonio || 0))
    : (d.aporteSugerido || 0);

  const totalPatrimonio = d.patrimonio || 0;
  const ativos = d.ativos || [];
  const totalIdeal = ativos.reduce((s, a) => s + (parseFloat(a.ideal) || 0), 0);

  const atualizar = async (newData) => { setD(newData); await save(newData); };

  const editAtivo = async (id, field, val) => {
    const novos = ativos.map(a => a.id === id ? { ...a, [field]: field === 'nome' ? val : parseFloat(val) || 0 } : a);
    await atualizar({ ...d, ativos: novos });
  };

  const deleteAtivo = async (id) => {
    await atualizar({ ...d, ativos: ativos.filter(a => a.id !== id) });
  };

  const addAtivo = async () => {
    if (!novo.nome) return;
    const item = { id: Date.now(), nome: novo.nome.toUpperCase(), atual: parseFloat(novo.atual) || 0, ideal: parseFloat(novo.ideal) || 0, precoManual: 0 };
    await atualizar({ ...d, ativos: [...ativos, item] });
    setNovo({ nome: '', atual: '', ideal: '' });
    setAdding(false);
  };

  const buscarCotacoes = async () => {
    setLoadingPrices(true);
    const newPrices = {};
    for (const a of ativos) {
      const p = await fetchPrice(a.nome, tipo);
      if (p) newPrices[a.nome] = p;
    }
    setPrices(newPrices);
    setLoadingPrices(false);
  };

  // Calcula aportes por ativo
  const ativosCalc = ativos.map(a => {
    const valorAtual = (a.atual / 100) * totalPatrimonio;
    const valorIdeal = (a.ideal / 100) * totalPatrimonio;
    const desvio = (a.atual / 100) - (a.ideal / 100);
    // Proporcional ao aporte sugerido
    const pesoRelativo = a.ideal / (totalIdeal || 1);
    const quantoAportar = desvio < 0 ? pesoRelativo * aporteSugerido : 0;
    const preco = prices[a.nome] || a.precoManual || 0;
    const qtdCotas = preco > 0 ? Math.floor(quantoAportar / preco) : null;
    return { ...a, valorAtual, valorIdeal, desvio, quantoAportar, preco, qtdCotas };
  });

  const barData = ativosCalc.map(a => ({
    name: a.nome,
    Atual: parseFloat((a.atual).toFixed(1)),
    Ideal: parseFloat((a.ideal).toFixed(1)),
  }));

  if (loading) return <div className="loading">⏳ Carregando {label}...</div>;

  return (
    <div>
      {/* Header */}
      <div className="card section">
        <div className="card-title">{icon} Dados de {label}</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Patrimônio atual em {label}</label>
            <input className="form-input" type="number" value={d.patrimonio || ''} onChange={e => atualizar({ ...d, patrimonio: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Aporte sugerido (via Carteira)</label>
            <div className="form-input" style={{ background: 'var(--bg4)', color: COLOR, fontWeight: 700, fontSize: 16 }}>
              {fmt(aporteSugerido)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3 section">
        <div className="stat-card" style={{ borderColor: COLOR }}>
          <div className="stat-label">Patrimônio em {label}</div>
          <div className="stat-value" style={{ color: COLOR }}>{fmt(totalPatrimonio)}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Aporte Sugerido</div>
          <div className="stat-value">{fmt(aporteSugerido)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ativos cadastrados</div>
          <div className="stat-value">{ativos.length}</div>
        </div>
      </div>

      {/* Fetch prices button */}
      <div className="card section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-title" style={{ marginBottom: 4 }}>💹 Cotações</div>
            <p style={{ color: 'var(--text3)', fontSize: 12 }}>
              {tipo === 'cripto' ? 'Via CoinGecko (gratuito)' : 'Via BRAPI (B3, gratuito)'}
              {' — '}pode levar alguns segundos
            </p>
          </div>
          <button className="btn btn-primary" onClick={buscarCotacoes} disabled={loadingPrices}>
            {loadingPrices ? '⏳ Buscando...' : '🔄 Buscar Cotações'}
          </button>
        </div>
        {Object.keys(prices).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {Object.entries(prices).map(([ticker, price]) => (
              <div key={ticker} className="badge badge-green" style={{ fontSize: 12, padding: '4px 12px' }}>
                {ticker}: {fmt(price)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main table */}
      <div className="card section">
        <div className="card-title" style={{ color: COLOR }}>📋 Ativos</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>% Atual</th>
                <th>% Ideal</th>
                <th>Valor Atual</th>
                <th>Aportar</th>
                <th>Preço Cota</th>
                <th>Qtd Cotas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ativosCalc.map(a => (
                <tr key={a.id}>
                  <td className="td-bold td-mono">{a.nome}</td>
                  <td>
                    <input className="form-input" type="number" step="0.1" value={a.atual} onChange={e => editAtivo(a.id, 'atual', e.target.value)} style={{ width: 72, padding: '5px 8px', fontSize: 13 }} />
                    <span style={{ color: 'var(--text3)', fontSize: 11, marginLeft: 3 }}>%</span>
                  </td>
                  <td>
                    <input className="form-input" type="number" step="0.1" value={a.ideal} onChange={e => editAtivo(a.id, 'ideal', e.target.value)} style={{ width: 72, padding: '5px 8px', fontSize: 13 }} />
                    <span style={{ color: 'var(--text3)', fontSize: 11, marginLeft: 3 }}>%</span>
                  </td>
                  <td className="td-bold">{fmt(a.valorAtual)}</td>
                  <td className={a.quantoAportar > 0 ? 'td-green' : 'td-red'} style={{ fontWeight: 700 }}>
                    {a.quantoAportar > 0 ? fmt(a.quantoAportar) : '—'}
                  </td>
                  <td>
                    {prices[a.nome] ? (
                      <span className="td-accent">{fmt(prices[a.nome])}</span>
                    ) : (
                      <input className="form-input" type="number" placeholder="Manual" value={a.precoManual || ''} onChange={e => editAtivo(a.id, 'precoManual', e.target.value)} style={{ width: 90, padding: '5px 8px', fontSize: 13 }} />
                    )}
                  </td>
                  <td>
                    {a.qtdCotas !== null && a.qtdCotas > 0 ? (
                      <span className="badge badge-green">{a.qtdCotas} cotas</span>
                    ) : (a.preco > 0 ? <span className="badge badge-red">0 cotas</span> : '—')}
                  </td>
                  <td>
                    <button className="btn-icon btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteAtivo(a.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add */}
        {adding ? (
          <div className="form-row-auto" style={{ marginTop: 12 }}>
            <input className="form-input" placeholder="Ticker (ex: PETR4)" value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} style={{ width: 130 }} />
            <input className="form-input" placeholder="% Atual" type="number" value={novo.atual} onChange={e => setNovo({ ...novo, atual: e.target.value })} style={{ width: 90 }} />
            <input className="form-input" placeholder="% Ideal" type="number" value={novo.ideal} onChange={e => setNovo({ ...novo, ideal: e.target.value })} style={{ width: 90 }} />
            <button className="btn btn-primary btn-sm" onClick={addAtivo}>Adicionar</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancelar</button>
          </div>
        ) : (
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>+ Adicionar ativo</button>
        )}
      </div>

      {/* Chart */}
      {barData.length > 0 && (
        <div className="card section">
          <div className="card-title">📊 Atual vs Ideal (%)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis dataKey="name" tick={{ fill: '#8a93b0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8a93b0', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#181c25', border: '1px solid #252b3b', borderRadius: 8, color: '#e8ecf4' }} />
              <Bar dataKey="Atual" fill={COLOR} radius={[4, 4, 0, 0]} name="Atual" />
              <Bar dataKey="Ideal" fill="#22d3a0" radius={[4, 4, 0, 0]} name="Ideal" opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
