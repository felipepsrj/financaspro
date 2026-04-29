// src/components/AssetTable.js
import React, { useState, useEffect, useRef } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

// Listas de tickers para autocomplete
const TICKERS_B3 = [
  'AGRO3','BBAS3','BBSE3','CSMG3','EGIE3','ELET6','FLRY3','ITSA4','KLBN11','PRIO3',
  'SUZB3','TUPY3','UNIP6','VALE3','WIZC3','PETR4','PETR3','ITUB4','ABEV3','WEGE3',
  'RENT3','LREN3','MGLU3','VVAR3','BRFS3','JBSS3','BEEF3','MRFG3','EMBR3','AZUL4',
  'GOLL4','CYRE3','MRVE3','EZTC3','DIRR3','TEND3','JHSF3','MULT3','BRML3','ALSC3',
  'BTLG11','HGLG11','HGRU11','IRDM11','LVBI11','MCCI11','RECR11','TGAR11','TRXF11',
  'VGHF11','VGIP11','VISC11','VRTA11','XPLG11','XPML11','HGBS11','KNRI11','RBRF11',
  'VOO','QQQ','SPY','IVV','VTI','EWZ','BOVA11','SMAL11','IVVB11',
];
const TICKERS_CRIPTO = ['BTC','ETH','BNB','SOL','ADA','XRP','DOT','DOGE','MATIC','AVAX','LINK','UNI'];

async function fetchPrice(ticker, type) {
  try {
    if (type === 'cripto') {
      const map = {
        BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', SOL: 'solana',
        ADA: 'cardano', XRP: 'ripple', DOT: 'polkadot-new', DOGE: 'dogecoin',
        MATIC: 'matic-network', AVAX: 'avalanche-2', LINK: 'chainlink', UNI: 'uniswap'
      };
      const id = map[ticker.toUpperCase()] || ticker.toLowerCase();
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=brl`);
      const json = await res.json();
      return json[id]?.brl || null;
    } else {
      const res = await fetch(`https://brapi.dev/api/quote/${ticker}?token=demo`);
      const json = await res.json();
      return json?.results?.[0]?.regularMarketPrice || null;
    }
  } catch { return null; }
}

// Componente de autocomplete para ticker
function TickerInput({ value, onChange, tipo, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [sugestoes, setSugestoes] = useState([]);
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  const lista = tipo === 'cripto' ? TICKERS_CRIPTO : TICKERS_B3;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (val) => {
    setQuery(val);
    if (val.length >= 1) {
      const filtrado = lista.filter(t => t.toLowerCase().startsWith(val.toLowerCase())).slice(0, 8);
      setSugestoes(filtrado);
      setAberto(filtrado.length > 0);
    } else {
      setSugestoes([]);
      setAberto(false);
    }
  };

  const selecionar = (ticker) => {
    setQuery(ticker);
    onChange(ticker);
    setAberto(false);
    setSugestoes([]);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="form-input"
        value={query}
        onChange={e => handleChange(e.target.value.toUpperCase())}
        onFocus={() => query.length >= 1 && setSugestoes(lista.filter(t => t.toLowerCase().startsWith(query.toLowerCase())).slice(0, 8)) && setAberto(true)}
        placeholder={placeholder || 'Ex: PETR4'}
        style={{ width: 130, padding: '7px 10px', fontSize: 13 }}
      />
      {aberto && sugestoes.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 999,
          background: 'var(--bg3)', border: '1px solid var(--border2)',
          borderRadius: 8, minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          overflow: 'hidden'
        }}>
          {sugestoes.map(t => (
            <div key={t} onMouseDown={() => selecionar(t)}
              style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontFamily: 'monospace', color: 'var(--text)', transition: '0.15s' }}
              onMouseEnter={e => e.target.style.background = 'var(--bg4)'}
              onMouseLeave={e => e.target.style.background = 'transparent'}
            >{t}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssetTable({ collectionName, tipo, aporteFromPatrimonio, label, icon, corAcento }) {
  const COLOR = corAcento || '#4f8ef7';
  const DEFAULT_DATA = { patrimonio: 0, ativos: [] };
  const { data, loading, save } = useFirestore(collectionName, DEFAULT_DATA);
  const { data: patrimonioData } = useFirestore('patrimonio', { classes: [], patrimonio: 0, aporte: 0 });

  const [d, setD] = useState(DEFAULT_DATA);
  const [prices, setPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [adding, setAdding] = useState(false);
  const [novo, setNovo] = useState({ nome: '', atual: '', ideal: '' });

  useEffect(() => { if (!loading) setD(data); }, [data, loading]);

  const classeInfo = (patrimonioData?.classes || []).find(c => c.id === aporteFromPatrimonio);
  const aporteSugerido = classeInfo
    ? Math.max(0, ((classeInfo.ideal - classeInfo.atualPct || classeInfo.atual) / 100) * (patrimonioData?.patrimonio || 0))
    : 0;

  const totalPatrimonio = d.patrimonio || 0;
  const ativos = d.ativos || [];
  const totalIdeal = ativos.reduce((s, a) => s + (parseFloat(a.ideal) || 0), 0);

  const atualizar = async (newData) => { setD(newData); await save(newData); };

  const editAtivo = async (id, field, val) => {
    const novos = ativos.map(a => a.id === id ? { ...a, [field]: field === 'nome' ? val : parseFloat(val) || 0 } : a);
    await atualizar({ ...d, ativos: novos });
  };

  const deleteAtivo = async (id) => await atualizar({ ...d, ativos: ativos.filter(a => a.id !== id) });

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

  const ativosCalc = ativos.map(a => {
    const valorAtual = (a.atual / 100) * totalPatrimonio;
    const desvio = a.atual - a.ideal;
    const pesoRelativo = a.ideal / (totalIdeal || 1);
    const quantoAportar = desvio < 0 ? pesoRelativo * aporteSugerido : 0;
    const preco = prices[a.nome] || a.precoManual || 0;
    const qtdCotas = preco > 0 ? Math.floor(quantoAportar / preco) : null;
    return { ...a, valorAtual, desvio, quantoAportar, preco, qtdCotas };
  });

  const barData = ativosCalc.map(a => ({
    name: a.nome,
    Atual: parseFloat((a.atual).toFixed(2)),
    Ideal: parseFloat((a.ideal).toFixed(2)),
  }));

  if (loading) return <div className="loading">⏳ Carregando {label}...</div>;

  return (
    <div>
      <div className="card section">
        <div className="card-title">{icon} Dados de {label}</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Patrimônio atual em {label} (R$)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontWeight: 600 }}>R$</span>
              <input className="form-input" type="number" value={d.patrimonio || ''} onChange={e => atualizar({ ...d, patrimonio: parseFloat(e.target.value) || 0 })} style={{ paddingLeft: 36 }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Aporte sugerido (calculado pela Carteira)</label>
            <div className="form-input" style={{ background: 'var(--bg4)', color: COLOR, fontWeight: 700, fontSize: 16 }}>
              {fmt(aporteSugerido)}
            </div>
          </div>
        </div>
      </div>

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

      <div className="card section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-title" style={{ marginBottom: 4 }}>💹 Cotações Automáticas</div>
            <p style={{ color: 'var(--text3)', fontSize: 12 }}>
              {tipo === 'cripto' ? 'Via CoinGecko (gratuito)' : 'Via BRAPI B3 (gratuito)'} — pode demorar alguns segundos
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
                  <td>
                    <TickerInput
                      value={a.nome}
                      tipo={tipo}
                      onChange={val => editAtivo(a.id, 'nome', val)}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input className="form-input" type="number" step="0.01" value={a.atual.toFixed(2)} onChange={e => editAtivo(a.id, 'atual', e.target.value)} style={{ width: 80, padding: '5px 8px', fontSize: 13, textAlign: 'right' }} />
                      <span style={{ color: 'var(--text3)', fontSize: 11 }}>%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input className="form-input" type="number" step="0.01" value={a.ideal.toFixed(2)} onChange={e => editAtivo(a.id, 'ideal', e.target.value)} style={{ width: 80, padding: '5px 8px', fontSize: 13, textAlign: 'right' }} />
                      <span style={{ color: 'var(--text3)', fontSize: 11 }}>%</span>
                    </div>
                  </td>
                  <td className="td-bold">{fmt(a.valorAtual)}</td>
                  <td className={a.quantoAportar > 0 ? 'td-green' : 'td-red'} style={{ fontWeight: 700 }}>
                    {a.quantoAportar > 0 ? fmt(a.quantoAportar) : '—'}
                  </td>
                  <td>
                    {prices[a.nome] ? (
                      <span className="td-accent">{fmt(prices[a.nome])}</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: 'var(--text3)', fontSize: 11 }}>R$</span>
                        <input className="form-input" type="number" placeholder="Manual" value={a.precoManual || ''} onChange={e => editAtivo(a.id, 'precoManual', e.target.value)} style={{ width: 90, padding: '5px 8px', fontSize: 13 }} />
                      </div>
                    )}
                  </td>
                  <td>
                    {a.qtdCotas !== null && a.qtdCotas > 0 ? (
                      <span className="badge badge-green">{a.qtdCotas} cotas</span>
                    ) : a.preco > 0 ? <span className="badge badge-red">0 cotas</span> : '—'}
                  </td>
                  <td>
                    <button className="btn-icon btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteAtivo(a.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {adding ? (
          <div className="form-row-auto" style={{ marginTop: 12 }}>
            <TickerInput value={novo.nome} tipo={tipo} onChange={val => setNovo({ ...novo, nome: val })} placeholder="Buscar ticker..." />
            <input className="form-input" placeholder="% Atual" type="number" step="0.01" value={novo.atual} onChange={e => setNovo({ ...novo, atual: e.target.value })} style={{ width: 90 }} />
            <input className="form-input" placeholder="% Ideal" type="number" step="0.01" value={novo.ideal} onChange={e => setNovo({ ...novo, ideal: e.target.value })} style={{ width: 90 }} />
            <button className="btn btn-primary btn-sm" onClick={addAtivo}>Adicionar</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancelar</button>
          </div>
        ) : (
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>+ Adicionar ativo</button>
        )}
      </div>

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
