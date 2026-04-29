// src/pages/Metas.js
import React, { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const DEFAULT = {
  metas: [
    {
      id: 1,
      tipo: 'objetivo',
      titulo: 'Trocar de Carro',
      icon: '🚗',
      valorAlvo: 50000,
      valorAtual: 5000,
      cor: '#4f8ef7',
      historico: [],
    },
    {
      id: 2,
      tipo: 'reducao',
      titulo: 'Reduzir Cartão de Crédito',
      icon: '💳',
      valorAlvo: 1500,
      valorAtual: 2854,
      cor: '#f87171',
      historico: [],
    }
  ]
};

const TIPOS = [
  { id: 'objetivo', label: 'Objetivo de Poupança', icon: '🎯' },
  { id: 'reducao', label: 'Redução de Gasto', icon: '✂️' },
  { id: 'reserva', label: 'Reserva de Emergência', icon: '🛡️' },
  { id: 'viagem', label: 'Viagem / Experiência', icon: '✈️' },
  { id: 'outro', label: 'Outro', icon: '⭐' },
];

const CORES = ['#4f8ef7', '#22d3a0', '#fbbf24', '#f87171', '#a78bfa', '#fb923c'];

function MetaCard({ meta, onUpdate, onDelete, onAddAporte }) {
  const [aportando, setAportando] = useState(false);
  const [aporteVal, setAporteVal] = useState('');
  const [editing, setEditing] = useState(false);
  const [editVals, setEditVals] = useState({ ...meta });

  const isReducao = meta.tipo === 'reducao';
  const progresso = isReducao
    ? Math.min(((meta.valorAlvo / (meta.valorAtual || 1)) * 100), 100)
    : Math.min(((meta.valorAtual / (meta.valorAlvo || 1)) * 100), 100);
  const concluida = isReducao ? meta.valorAtual <= meta.valorAlvo : meta.valorAtual >= meta.valorAlvo;
  const falta = isReducao ? Math.max(meta.valorAtual - meta.valorAlvo, 0) : Math.max(meta.valorAlvo - meta.valorAtual, 0);

  const chartData = (meta.historico || []).slice(-12).map((h, i) => ({ mes: h.mes, valor: h.valor }));

  const confirmarAporte = () => {
    const val = parseFloat(aporteVal) || 0;
    if (val <= 0) return;
    const agora = new Date();
    const mes = `${agora.getMonth() + 1}/${agora.getFullYear()}`;
    const novoAtual = isReducao
      ? Math.max(meta.valorAtual - val, 0)
      : meta.valorAtual + val;
    const historico = [...(meta.historico || []), { mes, valor: novoAtual }];
    onUpdate({ ...meta, valorAtual: novoAtual, historico });
    setAporteVal('');
    setAportando(false);
  };

  const saveEdit = () => {
    onUpdate({ ...meta, ...editVals, valorAlvo: parseFloat(editVals.valorAlvo) || 0, valorAtual: parseFloat(editVals.valorAtual) || 0 });
    setEditing(false);
  };

  return (
    <div className="card section" style={{ borderColor: meta.cor }}>
      {editing ? (
        <div>
          <div className="card-title" style={{ color: meta.cor }}>✎ Editar Meta</div>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <div className="form-group">
              <label className="form-label">Título</label>
              <input className="form-input" value={editVals.titulo} onChange={e => setEditVals({ ...editVals, titulo: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Ícone (emoji)</label>
              <input className="form-input" value={editVals.icon} onChange={e => setEditVals({ ...editVals, icon: e.target.value })} />
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <div className="form-group">
              <label className="form-label">{isReducao ? 'Meta (gasto alvo)' : 'Valor alvo'}</label>
              <input className="form-input" type="number" value={editVals.valorAlvo} onChange={e => setEditVals({ ...editVals, valorAlvo: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{isReducao ? 'Gasto atual' : 'Valor atual poupado'}</label>
              <input className="form-input" type="number" value={editVals.valorAtual} onChange={e => setEditVals({ ...editVals, valorAtual: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="form-label">Cor</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {CORES.map(c => (
                <div key={c} onClick={() => setEditVals({ ...editVals, cor: c })}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: editVals.cor === c ? '2px solid white' : '2px solid transparent', transition: '0.2s' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={saveEdit}>Salvar</button>
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{meta.icon}</div>
              <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{meta.titulo}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
                {TIPOS.find(t => t.id === meta.tipo)?.icon} {TIPOS.find(t => t.id === meta.tipo)?.label}
                {concluida && <span className="badge badge-green" style={{ marginLeft: 8 }}>✓ Concluída!</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-icon btn-sm" onClick={() => setEditing(true)}>✎</button>
              <button className="btn-icon btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(meta.id)}>✕</button>
            </div>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text2)', fontSize: 13 }}>
                {isReducao ? 'Gasto atual' : 'Poupado'}: <strong style={{ color: meta.cor }}>{fmt(meta.valorAtual)}</strong>
              </span>
              <span style={{ color: 'var(--text2)', fontSize: 13 }}>
                Meta: <strong style={{ color: 'var(--text)' }}>{fmt(meta.valorAlvo)}</strong>
              </span>
            </div>
            <div className="progress-wrap">
              <div className="progress-bar" style={{ width: `${progresso}%`, background: `linear-gradient(90deg, ${meta.cor}, ${meta.cor}cc)` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{progresso.toFixed(1)}% concluído</span>
              {!concluida && <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                {isReducao ? 'Reduzir ainda' : 'Falta'}: <strong style={{ color: meta.cor }}>{fmt(falta)}</strong>
              </span>}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {!concluida && !aportando && (
              <button className="btn btn-primary btn-sm" onClick={() => setAportando(true)}>
                {isReducao ? '✂️ Registrar redução' : '+ Adicionar aporte'}
              </button>
            )}
            {aportando && (
              <>
                <input
                  className="form-input"
                  type="number"
                  placeholder={isReducao ? 'Valor reduzido' : 'Valor aportado'}
                  value={aporteVal}
                  onChange={e => setAporteVal(e.target.value)}
                  style={{ width: 160 }}
                  autoFocus
                />
                <button className="btn btn-primary btn-sm" onClick={confirmarAporte}>✓ Confirmar</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setAportando(false)}>Cancelar</button>
              </>
            )}
          </div>

          {/* Chart */}
          {chartData.length > 1 && (
            <div style={{ marginTop: 20 }}>
              <div className="card-title" style={{ fontSize: 12, marginBottom: 10 }}>📈 Histórico</div>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252b3b" />
                  <XAxis dataKey="mes" tick={{ fill: '#8a93b0', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8a93b0', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#181c25', border: '1px solid #252b3b', borderRadius: 8, color: '#e8ecf4' }} />
                  <Line type="monotone" dataKey="valor" stroke={meta.cor} strokeWidth={2} dot={{ fill: meta.cor, r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Metas() {
  const { data, loading, save } = useFirestore('metas', DEFAULT);
  const [d, setD] = useState(DEFAULT);
  const [criando, setCriando] = useState(false);
  const [nova, setNova] = useState({ tipo: 'objetivo', titulo: '', icon: '🎯', valorAlvo: '', valorAtual: '', cor: '#4f8ef7' });

  useEffect(() => { if (!loading) setD(data); }, [data, loading]);

  const update = async (newData) => { setD(newData); await save(newData); };

  const updateMeta = async (updatedMeta) => {
    const novas = (d.metas || []).map(m => m.id === updatedMeta.id ? updatedMeta : m);
    await update({ ...d, metas: novas });
  };

  const deleteMeta = async (id) => {
    await update({ ...d, metas: (d.metas || []).filter(m => m.id !== id) });
  };

  const addMeta = async () => {
    if (!nova.titulo) return;
    const item = {
      id: Date.now(), ...nova,
      valorAlvo: parseFloat(nova.valorAlvo) || 0,
      valorAtual: parseFloat(nova.valorAtual) || 0,
      historico: []
    };
    await update({ ...d, metas: [...(d.metas || []), item] });
    setNova({ tipo: 'objetivo', titulo: '', icon: '🎯', valorAlvo: '', valorAtual: '', cor: '#4f8ef7' });
    setCriando(false);
  };

  const metas = d.metas || [];
  const concluidas = metas.filter(m => m.tipo === 'reducao' ? m.valorAtual <= m.valorAlvo : m.valorAtual >= m.valorAlvo).length;

  if (loading) return <div className="loading">⏳ Carregando metas...</div>;

  return (
    <div>
      {/* Stats */}
      <div className="grid-3 section">
        <div className="stat-card accent">
          <div className="stat-label">Total de Metas</div>
          <div className="stat-value">{metas.length}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Concluídas</div>
          <div className="stat-value">{concluidas}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Em andamento</div>
          <div className="stat-value">{metas.length - concluidas}</div>
        </div>
      </div>

      {/* Nova meta button */}
      <div style={{ marginBottom: 24 }}>
        {!criando ? (
          <button className="btn btn-primary" onClick={() => setCriando(true)}>+ Nova Meta</button>
        ) : (
          <div className="card">
            <div className="card-title" style={{ color: 'var(--accent)' }}>🎯 Nova Meta</div>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label className="form-label">Tipo de Meta</label>
                <select className="form-input" value={nova.tipo} onChange={e => setNova({ ...nova, tipo: e.target.value })}>
                  {TIPOS.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ícone (emoji)</label>
                <input className="form-input" value={nova.icon} onChange={e => setNova({ ...nova, icon: e.target.value })} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Título da Meta</label>
              <input className="form-input" placeholder="Ex: Trocar de carro, Viagem Europa..." value={nova.titulo} onChange={e => setNova({ ...nova, titulo: e.target.value })} />
            </div>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label className="form-label">{nova.tipo === 'reducao' ? 'Meta de gasto (R$)' : 'Valor alvo (R$)'}</label>
                <input className="form-input" type="number" value={nova.valorAlvo} onChange={e => setNova({ ...nova, valorAlvo: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{nova.tipo === 'reducao' ? 'Gasto atual (R$)' : 'Já tenho poupado (R$)'}</label>
                <input className="form-input" type="number" value={nova.valorAtual} onChange={e => setNova({ ...nova, valorAtual: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Cor</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {CORES.map(c => (
                  <div key={c} onClick={() => setNova({ ...nova, cor: c })}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', border: nova.cor === c ? '3px solid white' : '3px solid transparent', transition: '0.2s' }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={addMeta}>Criar Meta</button>
              <button className="btn btn-ghost" onClick={() => setCriando(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* Metas list */}
      {metas.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🎯</div>
          <p>Nenhuma meta cadastrada ainda.</p>
          <p style={{ fontSize: 13, marginTop: 6, color: 'var(--text3)' }}>Crie sua primeira meta acima!</p>
        </div>
      ) : (
        metas.map(m => (
          <MetaCard key={m.id} meta={m} onUpdate={updateMeta} onDelete={deleteMeta} />
        ))
      )}
    </div>
  );
}
