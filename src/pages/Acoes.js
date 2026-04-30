import React from 'react';
import AssetTable from '../components/AssetTable';

const DEFAULT_ATIVOS = [
  { id: 1,  nome: 'BBAS3', atual: 24.19, ideal: 24.19 },
  { id: 2,  nome: 'VALE3', atual: 9.55,  ideal: 9.55  },
  { id: 3,  nome: 'AGRO3', atual: 8.25,  ideal: 8.25  },
  { id: 4,  nome: 'KLBN11',atual: 7.23,  ideal: 7.23  },
  { id: 5,  nome: 'AXIA6', atual: 6.92,  ideal: 6.92  },
  { id: 6,  nome: 'ITSA4', atual: 6.91,  ideal: 6.91  },
  { id: 7,  nome: 'EGIE3', atual: 6.90,  ideal: 6.90  },
  { id: 8,  nome: 'FLRY3', atual: 6.65,  ideal: 6.65  },
  { id: 9,  nome: 'UNIP6', atual: 5.80,  ideal: 5.80  },
  { id: 10, nome: 'WIZC3', atual: 4.26,  ideal: 4.26  },
  { id: 11, nome: 'PRIO3', atual: 3.87,  ideal: 3.87  },
  { id: 12, nome: 'CSMG3', atual: 3.42,  ideal: 3.42  },
  { id: 13, nome: 'BBSE3', atual: 3.19,  ideal: 3.19  },
  { id: 14, nome: 'SUZB3', atual: 2.86,  ideal: 2.86  },
];

export default function Acoes() {
  return (
    <AssetTable
      collectionName="acoes"
      tipo="b3"
      aporteFromPatrimonio="acoes"
      label="Ações"
      icon="📈"
      corAcento="#4f8ef7"
      defaultAtivos={DEFAULT_ATIVOS}
    />
  );
}
