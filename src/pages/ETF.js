import React from 'react';
import AssetTable from '../components/AssetTable';

const DEFAULT_ATIVOS = [
  { id: 1, nome: 'VOO',  atual: 46.45, ideal: 46.45 },
  { id: 2, nome: 'QQQ',  atual: 43.23, ideal: 43.23 },
  { id: 3, nome: 'AVDV', atual: 10.32, ideal: 10.32 },
];

export default function ETF() {
  return (
    <AssetTable
      collectionName="etf"
      tipo="etf"
      aporteFromPatrimonio="etf"
      label="ETFs"
      icon="🌐"
      corAcento="#a78bfa"
      defaultAtivos={DEFAULT_ATIVOS}
    />
  );
}
