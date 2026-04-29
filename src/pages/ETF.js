// src/pages/ETF.js
import React from 'react';
import AssetTable from '../components/AssetTable';
export default function ETF() {
  return <AssetTable collectionName="etf" tipo="b3" aporteFromPatrimonio="etf" label="ETFs" icon="🌐" corAcento="#a78bfa" />;
}
