// src/pages/Acoes.js
import React from 'react';
import AssetTable from '../components/AssetTable';
export default function Acoes() {
  return <AssetTable collectionName="acoes" tipo="b3" aporteFromPatrimonio="acoes" label="Ações" icon="📈" corAcento="#4f8ef7" />;
}
