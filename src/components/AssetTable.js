// src/components/AssetTable.js
import React, { useState, useEffect, useRef } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtUSD = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0);

const TICKERS_B3 = [
  'AGRO3','AXIA6','BBAS3','BBSE3','BEEF3','BOVA11','BRFS3','BRML3',
  'BTLG11','CSMG3','CYRE3','DIRR3','EGIE3','ELET6','EMBR3','EZTC3',
  'FLRY3','GOLL4','HGBS11','HGLG11','HGRU11','HGBS11','IRDM11',
  'ITSA4','ITUB4','JBSS3','JHSF3','KLBN11','KNRI11','LREN3','LVBI11',
  'MCCI11','MGLU3','MRFG3','MRVE3','MULT3','PETR3','PETR4','PRIO3',
  'RBRF11','RECR11','RENT3','SMAL11','SUZB3','TGAR11','TEND3','TRXF11',
  'TUPY3','UNIP6','VALE3','VGHF11','VGIP11','VISC11','VRTA11','VVAR3',
  'WEGE3','WIZC3','XPLG11','XPML11','ABEV3','ALSC3','AZUL4','IRIM11',
  'LVBI11','BTLG11','HGLG11','MCCI11','VGIP11','XPLG11','XPML11',
  'VISC11','VRTA11','VGHF11','HGRU11','BTLG11','HGBS11','HGLG11',
  'IVVB11','SMAL11','BOVA11',
];

const TICKERS_ETF = ['VOO','QQQ','SPY','IVV','VTI','EWZ','AVDV','VNQ','SCHD','VEA','VWO','AGG','BND','GLD','IAU'];

const TICKERS_CRIPTO = ['BTC','ETH','BNB','SOL','ADA','XRP','DOT','DOGE','MATIC','AVAX','LINK','UNI'];

const CRIPTO_IDS = {
  BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', SOL: 'solana',
  ADA: 'cardano', XRP: 'ripple', DOT: 'polkadot-new', DOGE: 'dogecoin',
  MATIC: 'matic-network', AVAX: 'avalanche-2', LINK: 'chainlink', UNI: 'uniswap'
};

async function fetchPrice(ticker, tipo) {
  try {
    if (tipo === 'cripto') {
      const id = CRIPTO_IDS[ticker.toUpperCase()] || ticker.toLowerCase();
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=brl`);
      const json = await res.json();
      return json[id]?.brl || null;
    } else if (tipo === 'etf') {
      // ETFs internacionais: tenta BRAPI com sufixo, depois Yahoo Finance via allorigins
      const res = await fetch(`https://brapi.dev/api/quote/${ticker}?token=demo`);
      const json = await res.json();
      const p = json?.results?.[0]?.regularMarketPrice;
      if (p) return p;
      return null;
    } else {
      // Ações e FIIs brasileiros via BRAPI
      const res = await fetch(`https://brapi.dev/api/quote/${ticker}?token=demo`);
      const json = await res.json();
      return json?.results?.[0]?.regularMarketPrice || null;
    }
  } catch { return null; }
}

function TickerInput({ value, onChange, tipo, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [sugestoes, setSugestoes] = useState([]);
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  const lista = tipo === 'cripto' ? TICKERS_CRIPTO : tipo === 'etf' ? TICKERS_ETF : TICKERS_B3;

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (val) => {
    const upper = val.toUpperCase();
    setQuery(upper);
    if (upper.length >= 1) {
      const filtrado = lista.filter(t => t.startsWith(upper)).slice(0, 8);
      setSugestoes(filtrado);
      setAberto(filtrado.length > 0);
    } else {
      setSugestoes([]); setAberto(false);
    }
  };

  const selecionar = (ticker) => {
    setQuery(ticker);
    onChange(ticker);
    setAberto(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 110 }}>
      <input
        className="form-input"
        value={query}
        onChange={e => handleChange(e.target.value)}
        onBlur={() => { onChange(query); }}
        placeholder={placeholder || 'Ticker...'}
        style={{ width: '100%', padding: '7px 10px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}
      />
      {aberto && sugestoes.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 9999,
          background: '#1e2330', border: '1px solid #2e3650',
          borderRadius: 8, minWidth: 130, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}>
          {sugestoes.map(t => (
            <div key={t} onMouseDown={() => selecionar(t)}
              style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: '#e8ecf4', borderBottom: '1px solid #252b3b', transition: '0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#252b3b'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{t}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// Tooltip customizado com fundo claro
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', color: '#222', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.fill || p.color }}>{p.name}: {p.value}%</div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AssetTable({ collectionName, tipo, aporteFromPatrimonio, label, icon, corAcento, defaultAtivos }) {
  const COLOR = corAcento || '#4f8ef7';
  const DEFAULT_DATA = { patrimonio: 0, ativos: defaultAtivos || [] };
  const { data, loading, save } = useFirestore(collectionName, DEFAULT_DATA);
  const { data: patrimonioData } = useFirestore('patrimonio', { classes: [], patrimonio: 0, aporte: 0 });

  const [d, setD] = useState(DEFAULT_DATA);
  const [prices, setPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [adding, setAdding] = useState(false);
  const [novo, setNovo] = useState({ nome: '', atual: '', ideal: '' });

  useEffect(() => { if (!loading) setD(data); }, [data, loading]);

  // Calcula aporte sugerido a partir da tela Carteira
  const classeInfo = (patrimonioData?.classes || []).find(c => c.id === aporteFromPatrimonio);
  const desvioClasse = classeInfo ? (classeInfo.ideal || 0) - (classeInfo.atualPct !== undefined ? classeInfo.atualPct : classeInfo.atual || 0) : 0;
  const aporteSugerido = desvioClasse > 0 ? (desvioClasse / 100) * (patrimonioData?.patrimonio || 0) : 0;

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
    const item = { id: Date.now(), nome: novo.nome.toUpperCase(), atual: parseFloat(novo.atual) || 0, ideal: parseFloat(novo.ideal) || 0 };
    await atualizar({ ...d, ativos: [...ativos, item] });
    setNovo({ nome: '', atual: '', ideal: '' }); setAdding(false);
  };

  const buscarCotacoes = async () => {
    setLoadingPrices(true);
    const newPrices = {};
    for (const a of ativos) {
      if (!a.nome) continue;
      const p = await fetchPrice(a.nome, tipo);
      if (p) newPrices[a.nome] = p;
      await new Promise(r => setTimeout(r, 300)); // evita rate limit
    }
    setPrices(newPrices);
    setLoadingPrices(false);
  };

  // Cálculo principal: quanto investir e quantas cotas comprar
  const ativosCalc = ativos.map(a => {
    const desvio = (a.atual || 0) - (a.ideal || 0);
    // Peso relativo do ativo no deficit total
    const pesoRelativo = (a.ideal || 0) / (totalIdeal || 1);
    // Quanto aportar nesse ativo
    const valorInvestir = desvio < 0 ? pesoRelativo * aporteSugerido : 0;
    const preco = prices[a.nome] || 0;
    const qtdCotas = preco > 0 ? Math.floor(valorInvestir / preco) : null;
    const valorReal = qtdCotas !== null ? qtdCotas * preco : valorInvestir;
    return { ...a, desvio, valorInvestir, preco, qtdCotas, valorReal };
  });

  const barData = ativosCalc.map(a => ({
    name: a.nome,
    Atual: parseFloat((a.atual || 0).toFixed(2)),
    Ideal: parseFloat((a.ideal || 0).toFixed(2)),
  }));

  if (loading) return <div className="loading">⏳ Carregando {label}...</div>;

  return (
    <div>
      {/* Patrimônio */}
      <div className="card section">
        <div className="card-title">{icon} Patrimônio em {label}</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Patrimônio atual em {label} (R$)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontWeight: 600 }}>R$</span>
              <input className="form-input" type="number" value={d.patrimonio || ''} onChange={e => atualizar({ ...d, patrimonio: parseFloat(e.target.value) || 0 })} style={{ paddingLeft: 36 }} placeholder="0,00" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Aporte sugerido (calculado pela aba Carteira)</label>
            <div style={{ background: 'var(--bg4)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', color: COLOR, fontWeight: 700, fontSize: 18 }}>
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

      {/* Buscar cotações */}
      <div className="card section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-title" style={{ marginBottom: 4 }}>💹 Cotações Automáticas</div>
            <p style={{ color: 'var(--text3)', fontSize: 12 }}>
              {tipo === 'cripto' ? 'Via CoinGecko' : 'Via BRAPI (B3)'} — clique para buscar os preços atuais e calcular quantas cotas comprar
            </p>
          </div>
          <button className="btn btn-primary" onClick={buscarCotacoes} disabled={loadingPrices || ativos.length === 0}>
            {loadingPrices ? `⏳ Buscando ${Object.keys(prices).length}/${ativos.length}...` : '🔄 Buscar Cotações'}
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
        {loadingPrices === false && ativos.length > 0 && Object.keys(prices).length === 0 && (
          <div className="alert alert-info" style={{ marginTop: 12 }}>
            💡 Clique em "Buscar Cotações" para calcular quantas cotas comprar com o aporte sugerido.
          </div>
        )}
      </div>

      {/* Tabela principal */}
      <div className="card section">
        <div className="card-title" style={{ color: COLOR }}>📋 Ativos — Quanto Comprar</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>% Atual</th>
                <th>% Ideal</th>
                <th>Desvio</th>
                <th>Valor a Investir</th>
                <th>Preço Atual</th>
                <th>Qtd Cotas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ativosCalc.map(a => (
                <tr key={a.id}>
                  <td>
                    <TickerInput value={a.nome} tipo={tipo} onChange={val => editAtivo(a.id, 'nome', val)} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input className="form-input" type="number" step="0.01" min="0" max="100"
                        value={(a.atual || 0).toFixed(2)}
                        onChange={e => editAtivo(a.id, 'atual', e.target.value)}
                        style={{ width: 82, padding: '6px 8px', fontSize: 13, textAlign: 'right' }} />
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}>%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input className="form-input" type="number" step="0.01" min="0" max="100"
                        value={(a.ideal || 0).toFixed(2)}
                        onChange={e => editAtivo(a.id, 'ideal', e.target.value)}
                        style={{ width: 82, padding: '6px 8px', fontSize: 13, textAlign: 'right' }} />
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}>%</span>
                    </div>
                  </td>
                  <td>
                    <span className={a.desvio > 0.01 ? 'badge badge-red' : a.desvio < -0.01 ? 'badge badge-green' : 'badge badge-accent'}>
                      {a.desvio > 0 ? '+' : ''}{a.desvio.toFixed(2)}%
                    </span>
                  </td>
                  <td>
                    <span className={a.valorInvestir > 0 ? 'td-green' : 'td-red'} style={{ fontWeight: 700 }}>
                      {a.valorInvestir > 0 ? fmt(a.valorInvestir) : '—'}
                    </span>
                  </td>
                  <td>
                    {a.preco > 0 ? (
                      <span className="td-accent" style={{ fontWeight: 600 }}>{fmt(a.preco)}</span>
                    ) : (
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}>aguardando...</span>
                    )}
                  </td>
                  <td>
                    {a.qtdCotas !== null ? (
                      a.qtdCotas > 0
                        ? <span className="badge badge-green" style={{ fontSize: 13, padding: '4px 12px' }}>{a.qtdCotas} cotas</span>
                        : <span className="badge badge-red">0 cotas</span>
                    ) : (
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>
                    )}
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
          <div className="form-row-auto" style={{ marginTop: 14, padding: '12px', background: 'var(--bg3)', borderRadius: 8 }}>
            <div className="form-group" style={{ minWidth: 120 }}>
              <label className="form-label">Ticker</label>
              <TickerInput value={novo.nome} tipo={tipo} onChange={val => setNovo({ ...novo, nome: val })} placeholder="Buscar..." />
            </div>
            <div className="form-group" style={{ minWidth: 100 }}>
              <label className="form-label">% Atual</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input className="form-input" type="number" step="0.01" placeholder="0.00" value={novo.atual} onChange={e => setNovo({ ...novo, atual: e.target.value })} style={{ width: 80 }} />
                <span style={{ color: 'var(--text3)' }}>%</span>
              </div>
            </div>
            <div className="form-group" style={{ minWidth: 100 }}>
              <label className="form-label">% Ideal</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input className="form-input" type="number" step="0.01" placeholder="0.00" value={novo.ideal} onChange={e => setNovo({ ...novo, ideal: e.target.value })} style={{ width: 80 }} />
                <span style={{ color: 'var(--text3)' }}>%</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button className="btn btn-primary" onClick={addAtivo}>Adicionar</button>
              <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>+ Adicionar ativo</button>
        )}
      </div>

      {/* Gráfico */}
      {barData.length > 0 && (
        <div className="card section">
          <div className="card-title">📊 Atual vs Ideal (%)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis dataKey="name" tick={{ fill: '#8a93b0', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8a93b0', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Atual" fill={COLOR} radius={[4, 4, 0, 0]} name="Atual" />
              <Bar dataKey="Ideal" fill="#22d3a0" radius={[4, 4, 0, 0]} name="Ideal" opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
