// src/pages/Orcamento.js
import React, { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const fmt = (v) => {
  if (v === undefined || v === null || isNaN(v)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
};

const DEFAULT = {
  receitas: [
    { id: 1, nome: 'Salário', valor: 6507.12, fixo: true },
    { id: 2, nome: 'Pai mesada', valor: 5750, fixo: true },
    { id: 3, nome: 'Saldo Banco', valor: 500, fixo: true },
    { id: 4, nome: 'Bico 01', valor: 900, fixo: false },
    { id: 5, nome: 'Bico 02', valor: 0, fixo: false },
    { id: 6, nome: 'Bico 03', valor: 0, fixo: false },
  ],
  despesasFixas: [
    { id: 1, nome: 'Aluguel (dia 10)', valor: 1142.47, fixo: true },
    { id: 2, nome: 'Condomínio (dia 05)', valor: 1216.07, fixo: true },
    { id: 3, nome: 'Luz (dia 05)', valor: 127.79, fixo: false },
    { id: 4, nome: 'Gás (dia 28)', valor: 11.86, fixo: true },
    { id: 5, nome: 'Smartbuscas', valor: 75, fixo: true },
    { id: 6, nome: 'Gato Net PAI', valor: 35, fixo: true },
    { id: 7, nome: 'Gato Net SP', valor: 25, fixo: true },
  ],
  outrasDespesas: [
    { id: 1, nome: 'Gasolina', valor: 300, fixo: false },
    { id: 2, nome: 'Saúde', valor: 200, fixo: false },
    { id: 3, nome: 'Lazer', valor: 500, fixo: false },
    { id: 4, nome: 'Alimentação + Mercado', valor: 300, fixo: false },
  ],
  dividas: [
    { id: 1, nome: 'Cartão de Crédito (dia 10)', valor: 2854.4, fixo: false },
    { id: 2, nome: 'Plano de Saúde', valor: 1498.74, fixo: true },
    { id: 3, nome: 'IPTU', valor: 71.27, fixo: false },
  ],
  poupancaPct: 35,
};

const SECTION_COLORS = ['#4f8ef7', '#22d3a0', '#fbbf24', '#f87171', '#a78bfa'];

function ItemRow({ item, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(item.valor);
  const [nome, setNome] = useState(item.nome);

  const save = () => {
    onEdit({ ...item, valor: parseFloat(val) || 0, nome });
    setEditing(false);
  };

  if (editing) return (
    <tr>
      <td colSpan={2}>
        <div className="form-row-auto" style={{ margin: '4px 0' }}>
          <input className="form-input" style={{ flex: 2, minWidth: 120 }} value={nome} onChange={e => setNome(e.target.value)} />
          <input className="form-input" style={{ flex: 1, minWidth: 100 }} type="number" value={val} onChange={e => setVal(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={save}>✓</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>✕</button>
        </div>
      </td>
    </tr>
  );

  return (
    <tr>
      <td className="td-bold">
        {item.nome}
        {!item.fixo && <span className="badge badge-yellow" style={{ marginLeft: 6 }}>variável</span>}
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <span className="td-accent">{fmt(item.valor)}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-icon btn-sm" onClick={() => setEditing(true)} title="Editar">✎</button>
            <button className="btn-icon btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(item.id)} title="Excluir">✕</button>
          </div>
        </div>
      </td>
    </tr>
  );
}

function Section({ title, icon, items, onEdit, onDelete, onAdd, color }) {
  const [adding, setAdding] = useState(false);
  const [novo, setNovo] = useState({ nome: '', valor: '', fixo: false });
  const total = items.reduce((s, i) => s + (parseFloat(i.valor) || 0), 0);

  const add = () => {
    if (!novo.nome || !novo.valor) return;
    onAdd({ id: Date.now(), nome: novo.nome, valor: parseFloat(novo.valor), fixo: novo.fixo });
    setNovo({ nome: '', valor: '', fixo: false });
    setAdding(false);
  };

  return (
    <div className="card section">
      <div className="card-title" style={{ color }}>
        {icon} {title}
        <span style={{ marginLeft: 'auto', color: 'var(--text)', fontFamily: 'Syne', fontSize: 16 }}>{fmt(total)}</span>
      </div>
      <div className="table-wrap">
        <table>
          <tbody>
            {items.map(item => (
              <ItemRow key={item.id} item={item} onEdit={(updated) => onEdit(item.id, updated)} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>
      {adding ? (
        <div className="form-row-auto" style={{ marginTop: 12 }}>
          <input className="form-input" placeholder="Nome" value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} style={{ flex: 2, minWidth: 120 }} />
          <input className="form-input" placeholder="Valor R$" type="number" value={novo.valor} onChange={e => setNovo({ ...novo, valor: e.target.value })} style={{ flex: 1, minWidth: 100 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)', fontSize: 13, whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={novo.fixo} onChange={e => setNovo({ ...novo, fixo: e.target.checked })} />
            Fixo
          </label>
          <button className="btn btn-primary btn-sm" onClick={add}>Adicionar</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancelar</button>
        </div>
      ) : (
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setAdding(true)}>+ Adicionar item</button>
      )}
    </div>
  );
}

export default function Orcamento() {
  const { data, loading, save } = useFirestore('orcamento', DEFAULT);
  const [d, setD] = useState(DEFAULT);

  useEffect(() => { if (!loading) setD(data); }, [data, loading]);

  const totalReceitas = d.receitas?.reduce((s, i) => s + (i.valor || 0), 0) || 0;
  const totalFixas = d.despesasFixas?.reduce((s, i) => s + (i.valor || 0), 0) || 0;
  const totalOutras = d.outrasDespesas?.reduce((s, i) => s + (i.valor || 0), 0) || 0;
  const totalDividas = d.dividas?.reduce((s, i) => s + (i.valor || 0), 0) || 0;
  const valorPoupar = (totalReceitas * ((d.poupancaPct || 35) / 100));
  const totalDebitos = totalFixas + totalOutras + totalDividas;
  const saldoFinal = totalReceitas - totalDebitos - valorPoupar;

  const update = async (newData) => {
    setD(newData);
    await save(newData);
  };

  const editItem = async (section, id, updated) => {
    const novo = { ...d, [section]: d[section].map(i => i.id === id ? updated : i) };
    await update(novo);
  };
  const deleteItem = async (section, id) => {
    const novo = { ...d, [section]: d[section].filter(i => i.id !== id) };
    await update(novo);
  };
  const addItem = async (section, item) => {
    const novo = { ...d, [section]: [...d[section], item] };
    await update(novo);
  };

  const pieData = [
    { name: 'Despesas Fixas', value: totalFixas },
    { name: 'Outras Despesas', value: totalOutras },
    { name: 'Dívidas', value: totalDividas },
    { name: 'Poupança', value: valorPoupar },
    { name: 'Saldo Livre', value: Math.max(saldoFinal, 0) },
  ].filter(x => x.value > 0);

  const barData = [
    { name: 'Receitas', valor: totalReceitas, fill: '#22d3a0' },
    { name: 'Despesas', valor: totalDebitos, fill: '#f87171' },
    { name: 'Poupança', valor: valorPoupar, fill: '#4f8ef7' },
    { name: 'Saldo', valor: saldoFinal, fill: saldoFinal >= 0 ? '#a78bfa' : '#fb923c' },
  ];

  if (loading) return <div className="loading">⏳ Carregando orçamento...</div>;

  return (
    <div>
      {/* Stats */}
      <div className="grid-4 section">
        <div className="stat-card green">
          <div className="stat-label">Total Receitas</div>
          <div className="stat-value">{fmt(totalReceitas)}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Total Débitos</div>
          <div className="stat-value">{fmt(totalDebitos)}</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">Meta Poupança ({d.poupancaPct || 35}%)</div>
          <div className="stat-value">{fmt(valorPoupar)}</div>
        </div>
        <div className={`stat-card ${saldoFinal >= 0 ? 'purple' : 'red'}`}>
          <div className="stat-label">Saldo Final</div>
          <div className="stat-value">{fmt(saldoFinal)}</div>
        </div>
      </div>

      {/* Poupanca slider */}
      <div className="card section">
        <div className="card-title">🎯 Meta de Poupança</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input type="range" min={0} max={80} value={d.poupancaPct || 35}
            onChange={e => update({ ...d, poupancaPct: Number(e.target.value) })}
            style={{ flex: 1, accentColor: 'var(--accent)' }} />
          <span style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, color: 'var(--accent)', minWidth: 60 }}>
            {d.poupancaPct || 35}%
          </span>
          <span style={{ color: 'var(--text2)', fontSize: 14 }}>{fmt(valorPoupar)}/mês</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2 section">
        <div className="card">
          <div className="card-title">📊 Visão Geral</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis dataKey="name" tick={{ fill: '#8a93b0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8a93b0', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#181c25', border: '1px solid #252b3b', borderRadius: 8, color: '#e8ecf4' }} />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">🥧 Distribuição dos Gastos</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={SECTION_COLORS[i % SECTION_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#181c25', border: '1px solid #252b3b', borderRadius: 8, color: '#e8ecf4' }} />
              <Legend formatter={(v) => <span style={{ color: '#8a93b0', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sections */}
      <Section title="Receitas" icon="💰" items={d.receitas || []} color="var(--green)"
        onEdit={(id, u) => editItem('receitas', id, u)}
        onDelete={(id) => deleteItem('receitas', id)}
        onAdd={(item) => addItem('receitas', item)} />

      <Section title="Despesas Fixas" icon="🏠" items={d.despesasFixas || []} color="var(--accent)"
        onEdit={(id, u) => editItem('despesasFixas', id, u)}
        onDelete={(id) => deleteItem('despesasFixas', id)}
        onAdd={(item) => addItem('despesasFixas', item)} />

      <Section title="Outras Despesas" icon="🛒" items={d.outrasDespesas || []} color="var(--yellow)"
        onEdit={(id, u) => editItem('outrasDespesas', id, u)}
        onDelete={(id) => deleteItem('outrasDespesas', id)}
        onAdd={(item) => addItem('outrasDespesas', item)} />

      <Section title="Dívidas" icon="💳" items={d.dividas || []} color="var(--red)"
        onEdit={(id, u) => editItem('dividas', id, u)}
        onDelete={(id) => deleteItem('dividas', id)}
        onAdd={(item) => addItem('dividas', item)} />

      {/* Summary table */}
      <div className="card">
        <div className="card-title">📋 Resumo do Mês</div>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr><td>Receitas totais</td><td className="td-green">{fmt(totalReceitas)}</td></tr>
              <tr><td>Despesas Fixas</td><td className="td-accent">{fmt(totalFixas)}</td></tr>
              <tr><td>Outras Despesas</td><td className="td-yellow">{fmt(totalOutras)}</td></tr>
              <tr><td>Dívidas</td><td className="td-red">{fmt(totalDividas)}</td></tr>
              <tr><td>Total de Débitos</td><td className="td-bold">{fmt(totalDebitos)}</td></tr>
              <tr><td>Poupança ({d.poupancaPct || 35}%)</td><td className="td-accent">{fmt(valorPoupar)}</td></tr>
              <tr style={{ background: 'var(--bg3)' }}>
                <td className="td-bold" style={{ fontSize: 15 }}>Saldo Final</td>
                <td className={saldoFinal >= 0 ? 'td-green' : 'td-red'} style={{ fontSize: 15, fontWeight: 700 }}>{fmt(saldoFinal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
