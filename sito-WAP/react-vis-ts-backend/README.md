# Minimal TS Backend (Express + MySQL + WebSocket)

## Quick start
```bash
npm i
cp .env.example .env  # then edit
npm run migrate
npm run dev
```

## Endpoints
- `POST /api/auth/login` { username } -> { token, userId, username }
- `POST /api/chat/conversation` { userA, userB } -> { conversationId }
- `GET /api/chat/messages/:conversationId?limit=50` -> { items: [...] }

## WebSocket
Connect with: `ws://localhost:4000/ws?token=YOUR_JWT`
Send message:
```json
{ "type": "send", "conversationId": 1, "body": "hello" }
```
