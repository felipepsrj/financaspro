import React from 'react';
import AssetTable from '../components/AssetTable';

const DEFAULT_ATIVOS = [
  { id: 1, nome: 'ETH', atual: 51.95, ideal: 51.95 },
  { id: 2, nome: 'BTC', atual: 43.35, ideal: 43.35 },
  { id: 3, nome: 'BNB', atual: 4.70,  ideal: 4.70  },
];

export default function Cripto() {
  return (
    <AssetTable
      collectionName="cripto"
      tipo="cripto"
      aporteFromPatrimonio="cripto"
      label="Cripto"
      icon="₿"
      corAcento="#fbbf24"
      defaultAtivos={DEFAULT_ATIVOS}
    />
  );
}
