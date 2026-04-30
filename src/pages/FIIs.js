import React from 'react';
import AssetTable from '../components/AssetTable';

const DEFAULT_ATIVOS = [
  { id: 1,  nome: 'IRIM11', atual: 11.71, ideal: 11.71 },
  { id: 2,  nome: 'VGHF11', atual: 9.37,  ideal: 9.37  },
  { id: 3,  nome: 'VRTA11', atual: 7.87,  ideal: 7.87  },
  { id: 4,  nome: 'XPML11', atual: 6.91,  ideal: 6.91  },
  { id: 5,  nome: 'VISC11', atual: 7.12,  ideal: 7.12  },
  { id: 6,  nome: 'LVBI11', atual: 6.45,  ideal: 6.45  },
  { id: 7,  nome: 'VGIP11', atual: 5.29,  ideal: 5.29  },
  { id: 8,  nome: 'XPLG11', atual: 5.50,  ideal: 5.50  },
  { id: 9,  nome: 'HGRU11', atual: 4.31,  ideal: 4.31  },
  { id: 10, nome: 'MCCI11', atual: 4.10,  ideal: 4.10  },
  { id: 11, nome: 'BTLG11', atual: 3.67,  ideal: 3.67  },
  { id: 12, nome: 'HGLG11', atual: 3.28,  ideal: 3.28  },
];

export default function FIIs() {
  return (
    <AssetTable
      collectionName="fiis"
      tipo="b3"
      aporteFromPatrimonio="fiis"
      label="FIIs"
      icon="🏢"
      corAcento="#22d3a0"
      defaultAtivos={DEFAULT_ATIVOS}
    />
  );
}
