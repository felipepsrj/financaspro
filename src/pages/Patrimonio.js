// src/pages/Patrimonio.js
import React, { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const DEFAULT = {
  patrimonio: 243009,
  aporte: 3412.97,
  rendaFixaPct: 0,
  tesouroDiretoPct: 0,
  classes: [
    { id: 'acoes',     nome: 'Ações',           icon: '📈', atual: 30.42, ideal: 25.00, cor: '#4f8ef7' },
    { id: 'fiis',      nome: 'FIIs',             icon: '🏢', atual: 28.03, ideal: 25.00, cor: '#22d3a0' },
    { id: 'etf',       nome: 'ETFs',             icon: '🌐', atual: 20.79, ideal: 20.00, cor: '#a78bfa' },
    { id: 'cripto',    nome: 'Cripto',           icon: '₿',  atual:  4.11, ideal:  5.00, cor: '#fbbf24' },
    { id: 'rendaFixa', nome: 'Renda Fixa + TD',  icon: '🏦', atual: 16.65, ideal: 25.00, cor: '#fb923c' },
  ]
};

export default function Patrimonio() {
  const { data, loading, save } = useFirestore('patrimonio', DEFAULT);
  const [d, setD] = useState(DEFAULT);
  const [editingRF, setEditingRF] = useState(false);
  const [rfVals, setRfVals] = useState({ rendaFixaPct: 0, tesouroDiretoPct: 0 });

  useEffect(() => {
    if (!loading) {
      setD(data);
      setRfVals({ rendaFixaPct: data.rendaFixaPct || 0, tesouroDiretoPct: data.tesouroDiretoPct || 0 });
    }
  }, [data, loading]);

  const update = async (newData) => { setD(newData); await save(newData); };

  const totalPatrimonio = d.patrimonio || 0;
  const totalAporte = d.aporte || 0;

  const classes = (d.classes || DEFAULT.classes).map(c => {
    const atualPct = c.id === 'rendaFixa'
      ? ((d.rendaFixaPct || 0) + (d.tesouroDiretoPct || 0))
      : c.atual;
    const desvio = atualPct - c.ideal;
    const precisaAportar = desvio < 0;
    return { ...c, atualPct, desvio, precisaAportar };
  });

  // Distribuição do aporte proporcional ao déficit
  const totalDeficit = classes.filter(c => c.desvio < 0).reduce((s, c) => s + Math.abs(c.desvio), 0);
  const classesComAporte = classes.map(c => ({
    ...c,
    aportar: c.desvio < 0 && totalDeficit > 0
      ? (Math.abs(c.desvio) / totalDeficit) * totalAporte
      : 0
  }));

  const updateClasse = async (id, field, val) => {
    const newClasses = (d.classes || DEFAULT.classes).map(c =>
      c.id === id ? { ...c, [field]: parseFloat(val) || 0 } : c
    );
    await update({ ...d, classes: newClasses });
  };

  const saveRF = async () => {
    const rfPct = parseFloat(rfVals.rendaFixaPct) || 0;
    const tdPct = parseFloat(rfVals.tesouroDiretoPct) || 0;
    const totalPct = rfPct + tdPct;
    const newClasses = (d.classes || DEFAULT.classes).map(c =>
      c.id === 'rendaFixa' ? { ...c, atual: totalPct } : c
    );
    await update({ ...d, rendaFixaPct: rfPct, tesouroDiretoPct: tdPct, classes: newClasses });
    setEditingRF(false);
  };

  const pieData = classesComAporte.map(c => ({ name: c.nome, value: parseFloat(c.atualPct.toFixed(2)) }));
  const radarData = classesComAporte.map(c => ({
    subject: c.nome,
    Atual: parseFloat(c.atualPct.toFixed(2)),
    Ideal: parseFloat(c.ideal.toFixed(2))
  }));

  if (loading) return <div className="loading">⏳ Carregando carteira...</div>;

  return (
    <div>
      {/* Header inputs com R$ */}
      <div className="card section">
        <div className="card-title">💼 Dados da Carteira</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Patrimônio Atual (R$)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontWeight: 600 }}>R$</span>
              <input className="form-input" type="number" value={d.patrimonio || ''} onChange={e => update({ ...d, patrimonio: parseFloat(e.target.value) || 0 })} style={{ paddingLeft: 36 }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Quanto vou aportar este mês (R$)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontWeight: 600 }}>R$</span>
              <input className="form-input" type="number" value={d.aporte || ''} onChange={e => update({ ...d, aporte: parseFloat(e.target.value) || 0 })} style={{ paddingLeft: 36 }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid-4 section">
        <div className="stat-card accent">
          <div className="stat-label">Patrimônio Total</div>
          <div className="stat-value">{fmt(totalPatrimonio)}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Aporte do Mês</div>
          <div className="stat-value">{fmt(totalAporte)}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Classes em Deficit</div>
          <div className="stat-value">{classesComAporte.filter(c => c.desvio < 0).length}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Classes em Excesso</div>
          <div className="stat-value">{classesComAporte.filter(c => c.desvio > 0).length}</div>
        </div>
      </div>

      {/* Renda Fixa + TD - por percentual */}
      <div className="card section" style={{ borderColor: 'var(--orange)' }}>
        <div className="card-title" style={{ color: 'var(--orange)' }}>🏦 Renda Fixa + Tesouro Direto</div>
        <div className="alert alert-info" style={{ marginBottom: 12 }}>
          ℹ️ Informe os percentuais separadamente (conforme o Investidor10) — o sistema soma automaticamente. Meta total: 25%
        </div>
        {editingRF ? (
          <div>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label className="form-label">% Renda Fixa</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input className="form-input" type="number" step="0.01" value={rfVals.rendaFixaPct} onChange={e => setRfVals({ ...rfVals, rendaFixaPct: e.target.value })} />
                  <span style={{ color: 'var(--text3)' }}>%</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">% Tesouro Direto</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input className="form-input" type="number" step="0.01" value={rfVals.tesouroDiretoPct} onChange={e => setRfVals({ ...rfVals, tesouroDiretoPct: e.target.value })} />
                  <span style={{ color: 'var(--text3)' }}>%</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              <div className="stat-card" style={{ padding: '10px 16px' }}>
                <div className="stat-label">Total combinado</div>
                <div className="stat-value" style={{ fontSize: 20, color: 'var(--orange)' }}>
                  {((parseFloat(rfVals.rendaFixaPct) || 0) + (parseFloat(rfVals.tesouroDiretoPct) || 0)).toFixed(2)}%
                </div>
              </div>
              <div className="stat-card" style={{ padding: '10px 16px' }}>
                <div className="stat-label">Meta</div>
                <div className="stat-value" style={{ fontSize: 20 }}>25.00%</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={saveRF}>Salvar</button>
              <button className="btn btn-ghost" onClick={() => setEditingRF(false)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="stat-card" style={{ padding: '10px 16px' }}>
              <div className="stat-label">% Renda Fixa</div>
              <div className="stat-value" style={{ fontSize: 20, color: 'var(--orange)' }}>{(d.rendaFixaPct || 0).toFixed(2)}%</div>
            </div>
            <div className="stat-card" style={{ padding: '10px 16px' }}>
              <div className="stat-label">% Tesouro Direto</div>
              <div className="stat-value" style={{ fontSize: 20, color: 'var(--orange)' }}>{(d.tesouroDiretoPct || 0).toFixed(2)}%</div>
            </div>
            <div className="stat-card" style={{ padding: '10px 16px', borderColor: 'var(--orange)' }}>
              <div className="stat-label">Total</div>
              <div className="stat-value" style={{ fontSize: 20, color: 'var(--orange)' }}>{((d.rendaFixaPct || 0) + (d.tesouroDiretoPct || 0)).toFixed(2)}%</div>
            </div>
            <button className="btn btn-ghost" onClick={() => setEditingRF(true)}>✎ Editar</button>
          </div>
        )}
      </div>

      {/* Tabela de alocação - inputs melhorados */}
      <div className="card section">
        <div className="card-title">⚖️ Distribuição e Aporte Sugerido</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Classe</th>
                <th>% Atual</th>
                <th>% Ideal</th>
                <th>Desvio</th>
                <th>Valor na Carteira</th>
                <th>Aportar</th>
              </tr>
            </thead>
            <tbody>
              {classesComAporte.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.cor, display: 'inline-block', flexShrink: 0 }} />
                      <span className="td-bold">{c.icon} {c.nome}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        className="form-input"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={c.id === 'rendaFixa' ? c.atualPct.toFixed(2) : c.atual.toFixed(2)}
                        readOnly={c.id === 'rendaFixa'}
                        onChange={e => c.id !== 'rendaFixa' && updateClasse(c.id, 'atual', e.target.value)}
                        style={{ width: 90, padding: '6px 10px', fontSize: 14, textAlign: 'right' }}
                      />
                      <span style={{ color: 'var(--text3)', fontSize: 13 }}>%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        className="form-input"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={c.ideal.toFixed(2)}
                        onChange={e => updateClasse(c.id, 'ideal', e.target.value)}
                        style={{ width: 90, padding: '6px 10px', fontSize: 14, textAlign: 'right' }}
                      />
                      <span style={{ color: 'var(--text3)', fontSize: 13 }}>%</span>
                    </div>
                  </td>
                  <td>
                    <span className={c.desvio > 0 ? 'badge badge-red' : c.desvio < 0 ? 'badge badge-green' : 'badge badge-accent'}>
                      {c.desvio > 0 ? '+' : ''}{c.desvio.toFixed(2)}%
                    </span>
                  </td>
                  <td className="td-bold">{fmt((c.atualPct / 100) * totalPatrimonio)}</td>
                  <td className={c.aportar > 0 ? 'td-green' : 'td-red'} style={{ fontWeight: 700 }}>
                    {c.aportar > 0 ? fmt(c.aportar) : '—'}
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'var(--bg3)' }}>
                <td colSpan={4} className="td-bold" style={{ fontSize: 14 }}>Total</td>
                <td className="td-bold">{fmt(totalPatrimonio)}</td>
                <td className="td-green" style={{ fontWeight: 700 }}>{fmt(totalAporte)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2 section">
        <div className="card">
          <div className="card-title">🥧 Alocação Atual</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={classesComAporte[i]?.cor || '#4f8ef7'} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, color: '#111', fontWeight: 600 }} />
              <Legend formatter={(v) => <span style={{ color: '#8a93b0', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">🎯 Atual vs Ideal (Radar)</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#252b3b" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#8a93b0', fontSize: 10 }} />
              <Radar name="Atual" dataKey="Atual" stroke="#4f8ef7" fill="#4f8ef7" fillOpacity={0.3} />
              <Radar name="Ideal" dataKey="Ideal" stroke="#22d3a0" fill="#22d3a0" fillOpacity={0.15} strokeDasharray="4 2" />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, color: '#111', fontWeight: 600 }} />
              <Legend formatter={(v) => <span style={{ color: '#8a93b0', fontSize: 11 }}>{v}</span>} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
