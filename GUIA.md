# 🚀 FinançasPro — Guia Completo

## O que é o FinançasPro?

Sistema de finanças pessoais completo com 7 telas:
- **Orçamento** — receitas, despesas, dívidas e poupança
- **Carteira** — patrimônio total e alocação por classe de ativo
- **Ações** — ativos B3 com cotação automática
- **FIIs** — fundos imobiliários com cotação automática
- **ETFs** — fundos internacionais (VOO, QQQ)
- **Cripto** — BTC, ETH, BNB etc. via CoinGecko
- **Metas** — objetivos com barra de progresso e histórico

---

## ⚙️ Configuração do Firebase (OBRIGATÓRIO antes de usar)

### Passo 1 — Criar projeto no Firebase

1. Acesse: https://console.firebase.google.com
2. Clique em **"Adicionar projeto"**
3. Dê um nome (ex: `financaspro`)
4. Pode desabilitar Google Analytics (não precisa)
5. Aguarde a criação e clique em **"Continuar"**

### Passo 2 — Criar o Firestore Database

1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Modo de teste"** (permite leitura/escrita sem autenticação por 30 dias)
4. Escolha a região mais próxima: `southamerica-east1 (São Paulo)` ✅
5. Clique em **"Ativar"**

### Passo 3 — Registrar o App Web

1. Na página inicial do projeto, clique no ícone **`</>`** (Web)
2. Dê um apelido ao app (ex: `financaspro-web`)
3. **NÃO** marque Firebase Hosting por enquanto
4. Clique em **"Registrar app"**
5. Você verá um bloco `firebaseConfig` — **COPIE ESSES DADOS!**

### Passo 4 — Colar as credenciais no código

Abra o arquivo `src/lib/firebase.js` e substitua os valores:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",           // cole sua apiKey
  authDomain: "financaspro.firebaseapp.com",
  projectId: "financaspro",
  storageBucket: "financaspro.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Passo 5 — Regras do Firestore (para uso pessoal)

No Firebase Console > Firestore > **Regras**, substitua por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // acesso público (sem autenticação)
    }
  }
}
```

> 💡 Para uso pessoal isso é suficiente. No futuro posso adicionar autenticação por e-mail/Google.

---

## 🖥️ Como rodar localmente

### Pré-requisitos
- Node.js 18+ instalado: https://nodejs.org

### Comandos

```bash
# Entrar na pasta do projeto
cd financeapp

# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm start
```

O sistema abrirá automaticamente em `http://localhost:3000`

---

## 🌐 Deploy no Netlify (Gratuito)

### Método 1 — Via Interface (mais fácil)

1. Faça o build do projeto:
   ```bash
   npm run build
   ```
2. Acesse: https://app.netlify.com
3. Crie uma conta gratuita (pode usar seu GitHub)
4. Na tela inicial, arraste e solte a pasta **`build/`** para a área indicada
5. Pronto! Você receberá um link como `https://meu-financas.netlify.app`

### Método 2 — Via GitHub + Netlify (deploy automático)

1. Crie um repositório no GitHub e envie o código:
   ```bash
   git init
   git add .
   git commit -m "FinançasPro v1"
   git remote add origin https://github.com/SEU_USUARIO/financaspro.git
   git push -u origin main
   ```
2. Acesse https://app.netlify.com > **"Add new site"** > **"Import from Git"**
3. Autorize o GitHub e selecione o repositório
4. Configure:
   - Build command: `npm run build`
   - Publish directory: `build`
5. Clique em **"Deploy site"**
6. A cada `git push`, o Netlify faz o deploy automático! ✅

---

## 🔥 Deploy no Firebase Hosting (Alternativa)

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar no projeto
firebase init hosting
# - Use existing project: selecione seu projeto
# - Public directory: build
# - Single-page app: Yes
# - Overwrite index.html: No

# Build e deploy
npm run build
firebase deploy
```

Você receberá um link como `https://financaspro.web.app`

---

## 📱 Como usar o sistema

### Orçamento
- **Primeira vez**: os dados da sua planilha já vieram pré-carregados
- **Editar um item**: clique no ✎ ao lado do valor
- **Itens variáveis** (bicos, gasolina, luz): edite mês a mês conforme a realidade
- **Itens fixos** (aluguel, condomínio): basta configurar uma vez
- **Meta de poupança**: arraste o slider para ajustar o percentual

### Carteira
- Informe o **patrimônio total atual** e **quanto vai aportar**
- Para **Renda Fixa + Tesouro Direto**: clique em "Editar" e informe os valores separadamente — o sistema soma automaticamente
- Edite os percentuais **Atual** e **Ideal** diretamente na tabela
- O sistema calcula automaticamente quanto aportar em cada classe

### Ações / FIIs / ETFs / Cripto
- Informe o **patrimônio atual naquela classe**
- O **aporte sugerido** é calculado automaticamente pela tela Carteira
- Informe o **% atual** e **% ideal** de cada ativo
- Clique em **"Buscar Cotações"** para puxar os preços automaticamente
- Se a cotação não aparecer (limite de requisições), informe o preço manualmente
- O sistema calcular **quantas cotas comprar** com o valor sugerido

### Metas
- Clique em **"+ Nova Meta"**
- Tipos disponíveis: Poupança para objetivo, Redução de gasto, Reserva de emergência, Viagem
- Informe o valor alvo e quanto já tem
- A cada mês, clique em **"Adicionar aporte"** para registrar o progresso
- O histórico aparece em um gráfico de linha

---

## 🔄 Fluxo recomendado mensal

1. **Início do mês**: Abra o **Orçamento** e atualize valores variáveis (bicos, gastos variáveis)
2. **Após receber**: Confira o saldo final calculado
3. **Na hora de investir**: Abra **Carteira** → atualize o patrimônio total e o valor do aporte
4. **Em cada aba** (Ações, FIIs etc): clique em "Buscar Cotações" e veja quantas cotas comprar
5. **Metas**: atualize o progresso de cada objetivo

---

## 🛠️ Tecnologias utilizadas

- **React 18** — interface web responsiva
- **Firebase Firestore** — banco de dados em nuvem (gratuito)
- **Recharts** — gráficos bonitos e responsivos
- **BRAPI** — cotações da B3 (gratuito)
- **CoinGecko** — cotações de cripto (gratuito)
- **Netlify** — hospedagem gratuita com HTTPS

---

## 🐛 Problemas comuns

**"Dados não salvam"**
→ Verifique se o `firebase.js` tem as credenciais corretas
→ Verifique as regras do Firestore (devem permitir leitura/escrita)

**"Cotações não carregam"**
→ APIs gratuitas têm limite de requisições. Aguarde alguns minutos e tente novamente
→ Use o campo de preço manual como alternativa

**"Tela em branco"**
→ Abra o Console do navegador (F12) e veja o erro
→ Geralmente é credencial do Firebase incorreta

---

## 🚀 Próximas melhorias possíveis

- Login com Google (Firebase Auth)
- Histórico mensal de orçamento
- Exportar relatório em PDF
- Notificações de metas atingidas
- Integração com Open Finance (extrato automático)
