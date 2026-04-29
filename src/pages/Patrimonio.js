// src/pages/Patrimonio.js
import React, { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from 'recharts';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const pct = (v) => `${((v || 0) * 100).toFixed(1)}%`;

const DEFAULT = {
  patrimonio: 243009,
  aporte: 3412.97,
  rendaFixa: 0,
  tesouroDireto: 0,
  classes: [
    { id: 'acoes', nome: 'Ações', icon: '📈', atual: 0.3042, ideal: 0.25, cor: '#4f8ef7' },
    { id: 'fiis', nome: 'FIIs', icon: '🏢', atual: 0.2803, ideal: 0.25, cor: '#22d3a0' },
    { id: 'etf', nome: 'ETFs', icon: '🌐', atual: 0.2079, ideal: 0.20, cor: '#a78bfa' },
    { id: 'cripto', nome: 'Cripto', icon: '₿', atual: 0.0411, ideal: 0.05, cor: '#fbbf24' },
    { id: 'rendaFixa', nome: 'Renda Fixa + TD', icon: '🏦', atual: 0.1665, ideal: 0.25, cor: '#fb923c' },
  ]
};

export default function Patrimonio() {
  const { data, loading, save } = useFirestore('patrimonio', DEFAULT);
  const [d, setD] = useState(DEFAULT);
  const [editingRF, setEditingRF] = useState(false);
  const [rfVals, setRfVals] = useState({ rendaFixa: 0, tesouroDireto: 0 });

  useEffect(() => { if (!loading) { setD(data); setRfVals({ rendaFixa: data.rendaFixa || 0, tesouroDireto: data.tesouroDireto || 0 }); } }, [data, loading]);

  const update = async (newData) => { setD(newData); await save(newData); };

  const totalPatrimonio = d.patrimonio || 0;
  const totalAporte = d.aporte || 0;

  const classes = (d.classes || DEFAULT.classes).map(c => {
    const valorAtual = c.id === 'rendaFixa'
      ? ((d.rendaFixa || 0) + (d.tesouroDireto || 0))
      : (c.atual * totalPatrimonio);
    const valorIdeal = c.ideal * totalPatrimonio;
    const diff = valorIdeal - valorAtual;
    const atualPct = c.id === 'rendaFixa'
      ? (((d.rendaFixa || 0) + (d.tesouroDireto || 0)) / totalPatrimonio)
      : c.atual;
    const desvio = atualPct - c.ideal;
    // Quanto aportar nessa classe
    const aportar = desvio < 0 ? Math.min(Math.abs(desvio) * totalPatrimonio, totalAporte) : 0;
    return { ...c, valorAtual, valorIdeal, diff, atualPct, desvio, aportar };
  });

  const totalAporteCalculado = classes.reduce((s, c) => s + c.aportar, 0);
  const fatorNormalizacao = totalAporteCalculado > 0 ? totalAporte / totalAporteCalculado : 1;
  const classesNorm = classes.map(c => ({ ...c, aportar: c.aportar * fatorNormalizacao }));

  const pieData = classesNorm.map(c => ({ name: c.nome, value: parseFloat((c.atualPct * 100).toFixed(1)) }));
  const radarData = classesNorm.map(c => ({ subject: c.nome, Atual: parseFloat((c.atualPct * 100).toFixed(1)), Ideal: parseFloat((c.ideal * 100).toFixed(1)) }));

  const updateClasse = async (id, field, val) => {
    const newClasses = (d.classes || DEFAULT.classes).map(c => c.id === id ? { ...c, [field]: parseFloat(val) || 0 } : c);
    await update({ ...d, classes: newClasses });
  };

  const saveRF = async () => {
    const total = (parseFloat(rfVals.rendaFixa) || 0) + (parseFloat(rfVals.tesouroDireto) || 0);
    const newClasses = (d.classes || DEFAULT.classes).map(c =>
      c.id === 'rendaFixa' ? { ...c, atual: total / totalPatrimonio } : c
    );
    await update({ ...d, rendaFixa: parseFloat(rfVals.rendaFixa) || 0, tesouroDireto: parseFloat(rfVals.tesouroDireto) || 0, classes: newClasses });
    setEditingRF(false);
  };

  if (loading) return <div className="loading">⏳ Carregando carteira...</div>;

  return (
    <div>
      {/* Header inputs */}
      <div className="card section">
        <div className="card-title">💼 Dados da Carteira</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Patrimônio Atual</label>
            <input className="form-input" type="number" value={d.patrimonio || ''} onChange={e => update({ ...d, patrimonio: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Quanto vou aportar este mês</label>
            <input className="form-input" type="number" value={d.aporte || ''} onChange={e => update({ ...d, aporte: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 section">
        <div className="stat-card accent">
          <div className="stat-label">Patrimônio Total</div>
          <div className="stat-value">{fmt(totalPatrimonio)}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Aporte do Mês</div>
          <div className="stat-value">{fmt(totalAporte)}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Classes em Deficit</div>
          <div className="stat-value">{classesNorm.filter(c => c.desvio < 0).length}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Classes em Excesso</div>
          <div className="stat-value">{classesNorm.filter(c => c.desvio > 0).length}</div>
        </div>
      </div>

      {/* Renda Fixa + Tesouro Direto - campo especial */}
      <div className="card section" style={{ borderColor: 'var(--orange)' }}>
        <div className="card-title" style={{ color: 'var(--orange)' }}>🏦 Renda Fixa + Tesouro Direto</div>
        <div className="alert alert-info" style={{ marginBottom: 12 }}>
          ℹ️ Informe os valores separadamente — o sistema soma automaticamente para calcular o percentual da classe (meta: 25%)
        </div>
        {editingRF ? (
          <div>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label className="form-label">Renda Fixa</label>
                <input className="form-input" type="number" value={rfVals.rendaFixa} onChange={e => setRfVals({ ...rfVals, rendaFixa: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Tesouro Direto</label>
                <input className="form-input" type="number" value={rfVals.tesouroDireto} onChange={e => setRfVals({ ...rfVals, tesouroDireto: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="stat-card" style={{ flex: 1, padding: '10px 16px' }}>
                <div className="stat-label">Total combinado</div>
                <div className="stat-value" style={{ fontSize: 18 }}>{fmt((parseFloat(rfVals.rendaFixa) || 0) + (parseFloat(rfVals.tesouroDireto) || 0))}</div>
              </div>
              <div className="stat-card" style={{ flex: 1, padding: '10px 16px' }}>
                <div className="stat-label">% da carteira</div>
                <div className="stat-value" style={{ fontSize: 18 }}>{pct(((parseFloat(rfVals.rendaFixa) || 0) + (parseFloat(rfVals.tesouroDireto) || 0)) / totalPatrimonio)}</div>
              </div>
              <button className="btn btn-primary" onClick={saveRF}>Salvar</button>
              <button className="btn btn-ghost" onClick={() => setEditingRF(false)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="stat-card" style={{ padding: '10px 16px' }}>
              <div className="stat-label">Renda Fixa</div>
              <div className="stat-value" style={{ fontSize: 18, color: 'var(--orange)' }}>{fmt(d.rendaFixa || 0)}</div>
            </div>
            <div className="stat-card" style={{ padding: '10px 16px' }}>
              <div className="stat-label">Tesouro Direto</div>
              <div className="stat-value" style={{ fontSize: 18, color: 'var(--orange)' }}>{fmt(d.tesouroDireto || 0)}</div>
            </div>
            <div className="stat-card" style={{ padding: '10px 16px' }}>
              <div className="stat-label">Total</div>
              <div className="stat-value" style={{ fontSize: 18, color: 'var(--orange)' }}>{fmt((d.rendaFixa || 0) + (d.tesouroDireto || 0))}</div>
            </div>
            <button className="btn btn-ghost" onClick={() => setEditingRF(true)}>✎ Editar</button>
          </div>
        )}
      </div>

      {/* Allocation table */}
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
                <th>Valor Atual</th>
                <th>Aportar</th>
              </tr>
            </thead>
            <tbody>
              {classesNorm.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.cor, display: 'inline-block' }} />
                      <span className="td-bold">{c.icon} {c.nome}</span>
                    </div>
                  </td>
                  <td>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      value={c.id === 'rendaFixa' ? (c.atualPct * 100).toFixed(1) : (c.atual * 100).toFixed(1)}
                      onChange={e => c.id !== 'rendaFixa' && updateClasse(c.id, 'atual', parseFloat(e.target.value) / 100)}
                      readOnly={c.id === 'rendaFixa'}
                      style={{ width: 80, padding: '6px 10px', fontSize: 13 }}
                    />
                    <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 4 }}>%</span>
                  </td>
                  <td>
                    <input
                      className="form-input"
                      type="number"
                      step="0.5"
                      value={(c.ideal * 100).toFixed(1)}
                      onChange={e => updateClasse(c.id, 'ideal', parseFloat(e.target.value) / 100)}
                      style={{ width: 80, padding: '6px 10px', fontSize: 13 }}
                    />
                    <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 4 }}>%</span>
                  </td>
                  <td>
                    <span className={c.desvio > 0 ? 'badge badge-red' : c.desvio < 0 ? 'badge badge-green' : 'badge badge-accent'}>
                      {c.desvio > 0 ? '+' : ''}{(c.desvio * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="td-bold">{fmt(c.valorAtual)}</td>
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

      {/* Charts */}
      <div className="grid-2 section">
        <div className="card">
          <div className="card-title">🥧 Alocação Atual</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={classesNorm[i]?.cor || '#4f8ef7'} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#181c25', border: '1px solid #252b3b', borderRadius: 8, color: '#e8ecf4' }} />
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
              <Tooltip contentStyle={{ background: '#181c25', border: '1px solid #252b3b', borderRadius: 8, color: '#e8ecf4' }} />
              <Legend formatter={(v) => <span style={{ color: '#8a93b0', fontSize: 11 }}>{v}</span>} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
