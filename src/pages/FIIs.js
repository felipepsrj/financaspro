// src/pages/FIIs.js
import React from 'react';
import AssetTable from '../components/AssetTable';
export default function FIIs() {
  return <AssetTable collectionName="fiis" tipo="b3" aporteFromPatrimonio="fiis" label="FIIs" icon="🏢" corAcento="#22d3a0" />;
}
