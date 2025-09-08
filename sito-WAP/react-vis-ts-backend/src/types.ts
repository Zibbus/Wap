export type User = {
  id: number;
  username: string;
  created_at: string;
};

export type Conversation = {
  id: number;
  created_at: string;
};

export type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  created_at: string;
};

export type WsClient = {
  userId: number;
};
