# MyFit

Web app full-stack con **React + Vite + Tailwind (frontend)** e **Node.js + TypeScript + MySQL (backend)**.  
Supporta chat realtime via WebSocket, autenticazione con username/JWT e gestione conversazioni persistite su MySQL.

---

## 📂 Struttura progetto

```
MyFit/
├── client/                # Frontend React (Vite + TS + Tailwind)
├── react-vis-ts-backend/  # Backend Node + Express + MySQL + WS
└── README.md
```

---

## 🚀 Setup rapido

### 1. Clona il repo
```bash
git clone https://github.com/<tuo-user>/<repo>.git
cd MyFit
```
Installa Ollama sul PC per impostare la API per l'IA la configurazione è già pronta nel file .env

### 1.1 Guida rapida all'installazione di Ollama
verifica versione scrivendo in powerhell di windows >> ollama --version
a seguito se la versione è inferiore alla 3.2 installarla digitando questo comando >> ollama pull llama3.2
infine se si vuole provare direttamente un test in powershell si può scrivere questo comado esempio:
ollama run llama3.2 "Ciao! Suggeriscimi un allenamento total body di 20 minuti."


---

### 2. Backend (Node + MySQL)

```bash
cd react-vis-ts-backend
cp .env.example .env   # modifica con credenziali MySQL
npm install
npm run migrate        # crea le tabelle nel DB
npm run dev            # avvia in dev (porta 4000)
```

👉 Endpoints disponibili:
- `POST /api/auth/login` `{ username }`
- `POST /api/chat/conversation` `{ userA, userB }`
- `GET /api/chat/messages/:conversationId?limit=50`

👉 WebSocket:
- URL: `ws://localhost:4000/ws?token=JWT`
- Inviare messaggi:
  ```json
  { "type": "send", "conversationId": 1, "body": "ciao" }
  ```

---

### 3. Frontend (React + Vite + Tailwind)

```bash
cd ../client
npm install
npm run dev            # avvia dev server (porta 5173)
```

👉 Apri [http://localhost:5173](http://localhost:5173) nel browser.  
La home mostra logo, login/logout e schede introduttive. Dopo il login puoi collegarti al backend.

---

## ⚙️ Dipendenze principali

### Backend
- express, cors, mysql2, dotenv, zod
- ws (WebSocket)
- jsonwebtoken
- typescript, tsx
- bcryptjs
- multer
- -D @types/multer
- express-rate-limit

### Frontend
- react, react-dom
- vite, typescript
- tailwindcss, postcss, autoprefixer
- react-router-dom (per routing futuro)
- framer-motion
- html2canvas
- react-select

---

## 📦 Build produzione

### Backend
```bash
cd react-vis-ts-backend
npm run build
node dist/server.js
```

### Frontend
```bash
cd client
npm run build
# serve ./dist con nginx, serve, vercel ecc.
```

---

## 📝 Note
- Configura il DB in `.env` (mai pushare i segreti su GitHub).
- Tutto ciò che non serve è escluso in `.gitignore` (node_modules, build, env, ecc.).
- Per test locale serve MySQL attivo su `localhost:3306`.

---

## 👨‍💻 Autore
MyFit — progetto full-stack React + Node + MySQL
