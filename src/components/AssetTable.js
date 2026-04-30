// src/components/AssetTable.js
import React, { useState, useEffect, useRef } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const TICKERS_B3 = [
  'AGRO3','AXIA6','BBAS3','BBSE3','BEEF3','BOVA11','BTLG11','CSMG3','CYRE3',
  'DIRR3','EGIE3','ELET6','EMBR3','EZTC3','FLRY3','GOLL4','HGBS11','HGLG11',
  'HGRU11','IRIM11','ITSA4','ITUB4','IVVB11','JBSS3','JHSF3','KLBN11','KNRI11',
  'LREN3','LVBI11','MCCI11','MGLU3','MRFG3','MRVE3','MULT3','PETR3','PETR4',
  'PRIO3','RBRF11','RECR11','RENT3','SMAL11','SUZB3','TGAR11','TEND3','TRXF11',
  'TUPY3','UNIP6','VALE3','VGHF11','VGIP11','VISC11','VRTA11','VVAR3','WEGE3',
  'WIZC3','XPLG11','XPML11','ABEV3','AZUL4',
];
const TICKERS_ETF = ['VOO','QQQ','SPY','IVV','VTI','EWZ','AVDV','VNQ','SCHD','VEA','GLD','BND'];
const TICKERS_CRIPTO = ['BTC','ETH','BNB','SOL','ADA','XRP','DOT','DOGE','MATIC','AVAX','LINK','UNI'];
const CRIPTO_IDS = {
  BTC:'bitcoin',ETH:'ethereum',BNB:'binancecoin',SOL:'solana',ADA:'cardano',
  XRP:'ripple',DOT:'polkadot-new',DOGE:'dogecoin',MATIC:'matic-network',
  AVAX:'avalanche-2',LINK:'chainlink',UNI:'uniswap'
};

// Busca cotação com múltiplos fallbacks
async function fetchPrice(ticker, tipo) {
  try {
    if (tipo === 'cripto') {
      const id = CRIPTO_IDS[ticker.toUpperCase()] || ticker.toLowerCase();
      // Tenta CoinGecko
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=brl`, { signal: AbortSignal.timeout(8000) });
      const json = await res.json();
      if (json[id]?.brl) return json[id].brl;
      return null;
    } else {
      // Tenta BRAPI sem token (funciona com limite)
      const res = await fetch(`https://brapi.dev/api/quote/${ticker}`, { signal: AbortSignal.timeout(8000) });
      const json = await res.json();
      const p = json?.results?.[0]?.regularMarketPrice;
      if (p && p > 0) return p;
      return null;
    }
  } catch { return null; }
}

function TickerInput({ value, onChange, tipo }) {
  const [query, setQuery] = useState(value || '');
  const [sugestoes, setSugestoes] = useState([]);
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  const lista = tipo === 'cripto' ? TICKERS_CRIPTO : tipo === 'etf' ? TICKERS_ETF : TICKERS_B3;

  useEffect(() => { setQuery(value || ''); }, [value]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleChange = (val) => {
    const upper = val.toUpperCase();
    setQuery(upper);
    if (upper.length >= 1) {
      const f = lista.filter(t => t.startsWith(upper)).slice(0, 8);
      setSugestoes(f); setAberto(f.length > 0);
    } else { setSugestoes([]); setAberto(false); }
  };

  const selecionar = (t) => { setQuery(t); onChange(t); setAberto(false); };

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 110 }}>
      <input className="form-input" value={query}
        onChange={e => handleChange(e.target.value)}
        onBlur={() => onChange(query)}
        style={{ width: '100%', padding: '7px 10px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}
        placeholder="Ticker..." />
      {aberto && sugestoes.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, zIndex:9999, background:'#1e2330', border:'1px solid #2e3650', borderRadius:8, minWidth:130, boxShadow:'0 8px 32px rgba(0,0,0,0.6)', overflow:'hidden' }}>
          {sugestoes.map(t => (
            <div key={t} onMouseDown={() => selecionar(t)}
              style={{ padding:'9px 14px', cursor:'pointer', fontSize:13, fontFamily:'monospace', fontWeight:600, color:'#e8ecf4', borderBottom:'1px solid #252b3b' }}
              onMouseEnter={e => e.currentTarget.style.background='#252b3b'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid #ddd', borderRadius:8, padding:'10px 14px', color:'#222', fontSize:13, boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
      <div style={{ fontWeight:700, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color: i===0?'#4f8ef7':'#22d3a0' }}>{p.name}: {p.value}%</div>)}
    </div>
  );
};

export default function AssetTable({ collectionName, tipo, aporteFromPatrimonio, label, icon, corAcento, defaultAtivos }) {
  const COLOR = corAcento || '#4f8ef7';
  const { data, loading, save } = useFirestore(collectionName, { patrimonio: 0, ativos: [] });
  const { data: patrimonioData } = useFirestore('patrimonio', { classes:[], patrimonio:0, aporte:0 });

  const [d, setD] = useState({ patrimonio: 0, ativos: [] });
  const [prices, setPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceStatus, setPriceStatus] = useState({});
  const [adding, setAdding] = useState(false);
  const [novo, setNovo] = useState({ nome:'', atual:'', ideal:'' });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!loading && !initialized) {
      // Se o Firebase não tem ativos ainda, usa o defaultAtivos
      const savedAtivos = data?.ativos || [];
      if (savedAtivos.length === 0 && defaultAtivos?.length > 0) {
        const inicial = { patrimonio: data?.patrimonio || 0, ativos: defaultAtivos };
        setD(inicial);
        save(inicial);
      } else {
        setD(data);
      }
      setInitialized(true);
    }
  }, [loading, initialized]);

  const classeInfo = (patrimonioData?.classes || []).find(c => c.id === aporteFromPatrimonio);
  const desvioClasse = classeInfo ? (classeInfo.ideal||0) - (classeInfo.atualPct !== undefined ? classeInfo.atualPct : classeInfo.atual||0) : 0;
  const aporteSugerido = desvioClasse > 0 ? (desvioClasse/100) * (patrimonioData?.patrimonio||0) : 0;

  const totalPatrimonio = d.patrimonio || 0;
  const ativos = d.ativos || [];
  const totalIdeal = ativos.reduce((s,a) => s + (parseFloat(a.ideal)||0), 0);

  const atualizar = async (newData) => { setD(newData); await save(newData); };
  const editAtivo = async (id, field, val) => {
    const novos = ativos.map(a => a.id===id ? {...a, [field]: field==='nome' ? val : parseFloat(val)||0} : a);
    await atualizar({...d, ativos: novos});
  };
  const deleteAtivo = async (id) => await atualizar({...d, ativos: ativos.filter(a => a.id!==id)});
  const addAtivo = async () => {
    if (!novo.nome) return;
    const item = { id:Date.now(), nome:novo.nome.toUpperCase(), atual:parseFloat(novo.atual)||0, ideal:parseFloat(novo.ideal)||0 };
    await atualizar({...d, ativos:[...ativos, item]});
    setNovo({nome:'',atual:'',ideal:''}); setAdding(false);
  };
  const restaurarPadrao = async () => {
    if (!defaultAtivos?.length) return;
    if (!window.confirm('Restaurar os ativos padrão? Isso substituirá seus ativos atuais.')) return;
    const inicial = { patrimonio: d.patrimonio || 0, ativos: defaultAtivos };
    await atualizar(inicial);
  };

  const buscarCotacoes = async () => {
    setLoadingPrices(true);
    setPriceStatus({});
    const newPrices = {};
    const newStatus = {};
    for (const a of ativos) {
      if (!a.nome) continue;
      newStatus[a.nome] = 'buscando';
      setPriceStatus({...newStatus});
      const p = await fetchPrice(a.nome, tipo);
      if (p) { newPrices[a.nome] = p; newStatus[a.nome] = 'ok'; }
      else { newStatus[a.nome] = 'erro'; }
      setPriceStatus({...newStatus});
      await new Promise(r => setTimeout(r, 400));
    }
    setPrices(newPrices);
    setLoadingPrices(false);
  };

  const ativosCalc = ativos.map(a => {
    const desvio = (a.atual||0) - (a.ideal||0);
    const pesoRelativo = (a.ideal||0) / (totalIdeal||1);
    const valorInvestir = desvio < 0 ? pesoRelativo * aporteSugerido : 0;
    const preco = prices[a.nome] || 0;
    const qtdCotas = preco > 0 ? Math.floor(valorInvestir/preco) : null;
    return { ...a, desvio, valorInvestir, preco, qtdCotas };
  });

  const barData = ativosCalc.map(a => ({
    name: a.nome,
    Atual: parseFloat((a.atual||0).toFixed(2)),
    Ideal: parseFloat((a.ideal||0).toFixed(2)),
  }));

  if (loading) return <div className="loading">⏳ Carregando {label}...</div>;

  const foundCount = Object.values(priceStatus).filter(s => s==='ok').length;
  const errorCount = Object.values(priceStatus).filter(s => s==='erro').length;

  return (
    <div>
      {/* Patrimônio */}
      <div className="card section">
        <div className="card-title">{icon} Patrimônio em {label}</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Patrimônio atual em {label} (R$)</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', fontWeight:600 }}>R$</span>
              <input className="form-input" type="number" value={d.patrimonio||''} onChange={e => atualizar({...d, patrimonio:parseFloat(e.target.value)||0})} style={{ paddingLeft:36 }} placeholder="0,00" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Aporte sugerido (calculado pela aba Carteira)</label>
            <div style={{ background:'var(--bg4)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 14px', color:COLOR, fontWeight:700, fontSize:18 }}>
              {fmt(aporteSugerido)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3 section">
        <div className="stat-card" style={{ borderColor:COLOR }}>
          <div className="stat-label">Patrimônio em {label}</div>
          <div className="stat-value" style={{ color:COLOR }}>{fmt(totalPatrimonio)}</div>
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
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <div className="card-title" style={{ marginBottom:4 }}>💹 Cotações Automáticas</div>
            <p style={{ color:'var(--text3)', fontSize:12 }}>
              {tipo==='cripto' ? 'Via CoinGecko' : 'Via BRAPI (B3)'} — busca o preço atual e calcula quantas cotas comprar
            </p>
          </div>
          <button className="btn btn-primary" onClick={buscarCotacoes} disabled={loadingPrices || ativos.length===0}>
            {loadingPrices ? `⏳ Buscando... (${foundCount}/${ativos.length})` : '🔄 Buscar Cotações'}
          </button>
        </div>

        {/* Status por ticker */}
        {Object.keys(priceStatus).length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:12 }}>
            {Object.entries(priceStatus).map(([ticker, status]) => (
              <div key={ticker} className={`badge ${status==='ok'?'badge-green':status==='erro'?'badge-red':'badge-accent'}`} style={{ fontSize:12, padding:'4px 10px' }}>
                {status==='buscando'?'⏳':status==='ok'?'✓':'✗'} {ticker}
                {status==='ok' && prices[ticker] ? `: ${fmt(prices[ticker])}` : ''}
              </div>
            ))}
          </div>
        )}

        {errorCount > 0 && (
          <div className="alert alert-warning" style={{ marginTop:12 }}>
            ⚠️ {errorCount} ativo(s) não encontrados na API. Para ETFs internacionais (VOO, QQQ), a cotação pode não estar disponível via BRAPI — insira o valor manualmente na coluna "Preço Atual".
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="card section">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div className="card-title" style={{ color:COLOR, marginBottom:0 }}>📋 Ativos — Quanto Comprar</div>
          {defaultAtivos?.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={restaurarPadrao} title="Restaurar ativos padrão">
              ↺ Restaurar padrão
            </button>
          )}
        </div>
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
                  <td><TickerInput value={a.nome} tipo={tipo} onChange={val => editAtivo(a.id,'nome',val)} /></td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <input className="form-input" type="number" step="0.01" min="0" max="100"
                        value={(a.atual||0).toFixed(2)} onChange={e => editAtivo(a.id,'atual',e.target.value)}
                        style={{ width:82, padding:'6px 8px', fontSize:13, textAlign:'right' }} />
                      <span style={{ color:'var(--text3)', fontSize:12 }}>%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <input className="form-input" type="number" step="0.01" min="0" max="100"
                        value={(a.ideal||0).toFixed(2)} onChange={e => editAtivo(a.id,'ideal',e.target.value)}
                        style={{ width:82, padding:'6px 8px', fontSize:13, textAlign:'right' }} />
                      <span style={{ color:'var(--text3)', fontSize:12 }}>%</span>
                    </div>
                  </td>
                  <td>
                    <span className={a.desvio>0.01?'badge badge-red':a.desvio<-0.01?'badge badge-green':'badge badge-accent'}>
                      {a.desvio>0?'+':''}{a.desvio.toFixed(2)}%
                    </span>
                  </td>
                  <td>
                    <span className={a.valorInvestir>0?'td-green':'td-red'} style={{ fontWeight:700 }}>
                      {a.valorInvestir>0 ? fmt(a.valorInvestir) : '—'}
                    </span>
                  </td>
                  <td>
                    {a.preco > 0 ? (
                      <span className="td-accent" style={{ fontWeight:600 }}>{fmt(a.preco)}</span>
                    ) : (
                      // Campo manual para quando a API não retorna (ETFs internacionais)
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ color:'var(--text3)', fontSize:11 }}>R$</span>
                        <input className="form-input" type="number" placeholder="Manual"
                          onChange={e => {
                            const val = parseFloat(e.target.value)||0;
                            setPrices(prev => ({...prev, [a.nome]: val}));
                          }}
                          style={{ width:85, padding:'5px 6px', fontSize:12 }} />
                      </div>
                    )}
                  </td>
                  <td>
                    {a.qtdCotas!==null
                      ? a.qtdCotas>0
                        ? <span className="badge badge-green" style={{ fontSize:13, padding:'4px 12px' }}>{a.qtdCotas} cotas</span>
                        : <span className="badge badge-red">0 cotas</span>
                      : <span style={{ color:'var(--text3)', fontSize:12 }}>—</span>}
                  </td>
                  <td>
                    <button className="btn-icon btn-sm" style={{ color:'var(--red)' }} onClick={() => deleteAtivo(a.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {adding ? (
          <div className="form-row-auto" style={{ marginTop:14, padding:12, background:'var(--bg3)', borderRadius:8 }}>
            <div className="form-group" style={{ minWidth:120 }}>
              <label className="form-label">Ticker</label>
              <TickerInput value={novo.nome} tipo={tipo} onChange={val => setNovo({...novo, nome:val})} />
            </div>
            <div className="form-group">
              <label className="form-label">% Atual</label>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <input className="form-input" type="number" step="0.01" placeholder="0.00" value={novo.atual} onChange={e => setNovo({...novo, atual:e.target.value})} style={{ width:80 }} />
                <span style={{ color:'var(--text3)' }}>%</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">% Ideal</label>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <input className="form-input" type="number" step="0.01" placeholder="0.00" value={novo.ideal} onChange={e => setNovo({...novo, ideal:e.target.value})} style={{ width:80 }} />
                <span style={{ color:'var(--text3)' }}>%</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
              <button className="btn btn-primary" onClick={addAtivo}>Adicionar</button>
              <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-ghost btn-sm" style={{ marginTop:12 }} onClick={() => setAdding(true)}>+ Adicionar ativo</button>
        )}
      </div>

      {/* Gráfico */}
      {barData.length > 0 && (
        <div className="card section">
          <div className="card-title">📊 Atual vs Ideal (%)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top:5, right:5, bottom:5, left:5 }}>
              <XAxis dataKey="name" tick={{ fill:'#8a93b0', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#8a93b0', fontSize:10 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Atual" fill={COLOR} radius={[4,4,0,0]} name="Atual" />
              <Bar dataKey="Ideal" fill="#22d3a0" radius={[4,4,0,0]} name="Ideal" opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
