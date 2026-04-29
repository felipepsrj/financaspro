// src/App.js
import React, { useState } from 'react';
import Orcamento from './pages/Orcamento';
import Patrimonio from './pages/Patrimonio';
import Acoes from './pages/Acoes';
import FIIs from './pages/FIIs';
import ETF from './pages/ETF';
import Cripto from './pages/Cripto';
import Metas from './pages/Metas';
import './App.css';

const TABS = [
  { id: 'orcamento', label: 'Orçamento', icon: '📊' },
  { id: 'patrimonio', label: 'Carteira', icon: '💼' },
  { id: 'acoes', label: 'Ações', icon: '📈' },
  { id: 'fiis', label: 'FIIs', icon: '🏢' },
  { id: 'etf', label: 'ETFs', icon: '🌐' },
  { id: 'cripto', label: 'Cripto', icon: '₿' },
  { id: 'metas', label: 'Metas', icon: '🎯' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('orcamento');
  const [menuOpen, setMenuOpen] = useState(false);

  const renderPage = () => {
    switch (activeTab) {
      case 'orcamento': return <Orcamento />;
      case 'patrimonio': return <Patrimonio />;
      case 'acoes': return <Acoes />;
      case 'fiis': return <FIIs />;
      case 'etf': return <ETF />;
      case 'cripto': return <Cripto />;
      case 'metas': return <Metas />;
      default: return <Orcamento />;
    }
  };

  const activeTabInfo = TABS.find(t => t.id === activeTab);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">◈</span>
            <span className="logo-text">FinançasPro</span>
          </div>
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
          <nav className={`nav-desktop`}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)}>
          <nav className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-logo">
              <span className="logo-icon">◈</span>
              <span className="logo-text">FinançasPro</span>
            </div>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`drawer-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.id); setMenuOpen(false); }}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Page title */}
      <div className="page-header">
        <span className="page-icon">{activeTabInfo?.icon}</span>
        <h1 className="page-title">{activeTabInfo?.label}</h1>
      </div>

      {/* Content */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`bottom-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="bottom-icon">{tab.icon}</span>
            <span className="bottom-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
