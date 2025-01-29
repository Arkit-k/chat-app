import React, { useState, useEffect, useRef } from "react";
import { Send, Users, LogOut, Plus, LogIn as Login } from "lucide-react";

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  isCurrentUser?: boolean;
}

function App() {
  const [roomId, setRoomId] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [roomName, setRoomName] = useState("");

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isInRoom && roomId) {
      socketRef.current = new WebSocket("ws://localhost:8000");

      socketRef.current.onopen = () => {
        console.log("Connected to WebSocket");
        socketRef.current?.send(
          JSON.stringify({ type: "join", payload: { roomId } })
        );
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "chat") {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              sender: "User",
              content: data.message,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        }
      };

      return () => {
        socketRef.current?.close();
      };
    }
  }, [isInRoom, roomId]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) setIsInRoom(true);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      setRoomId(roomName);
      setIsInRoom(true);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && socketRef.current) {
      socketRef.current.send(
        JSON.stringify({ type: "chat", payload: { message } })
      );
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          sender: "You",
          content: message,
          timestamp: new Date().toLocaleTimeString(),
          isCurrentUser: true,
        },
      ]);
      setMessage("");
    }
  };

  const handleLeaveRoom = () => {
    setIsInRoom(false);
    setRoomId("");
    setRoomName("");
    socketRef.current?.close();
    setMessages([]);
  };

  return isInRoom ? (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="bg-zinc-950 border-b border-purple-900 p-4 flex justify-between">
        <h1 className="text-xl font-semibold text-white">Room: {roomId}</h1>
        <button onClick={handleLeaveRoom} className="text-purple-300 hover:text-purple-400">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.isCurrentUser ? "text-right" : "text-left"}>
            <p className="text-purple-400 text-sm">{msg.sender}</p>
            <div className="bg-zinc-800 p-3 rounded-lg text-white inline-block max-w-xs break-words">
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="p-4 flex">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-2 rounded-lg bg-black border border-purple-900 text-white"
          placeholder="Type a message..."
        />
        <button type="submit" className="ml-2 bg-purple-700 p-2 rounded-lg">
          <Send />
        </button>
      </form>
    </div>
  ) : (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
      <div className="bg-zinc-950 p-6 rounded-xl shadow-lg w-full max-w-lg border border-purple-900">
        <div className="flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-purple-500" />
        </div>
        <div className="flex justify-center space-x-4 mb-6">
          <button onClick={() => setIsCreating(false)} className={`px-4 py-2 rounded-lg transition-all ${!isCreating ? "bg-purple-700 text-white" : "text-purple-400 hover:text-purple-300"}`}>
            <Login className="w-4 h-4" /> Join Room
          </button>
          <button onClick={() => setIsCreating(true)} className={`px-4 py-2 rounded-lg transition-all ${isCreating ? "bg-purple-700 text-white" : "text-purple-400 hover:text-purple-300"}`}>
            <Plus className="w-4 h-4" /> Create Room
          </button>
        </div>
        {isCreating ? (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <label className="block text-purple-300">Room Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-purple-900 rounded-lg text-white"
              placeholder="Enter room name"
              required
            />
            <button type="submit" className="w-full bg-purple-700 text-white py-2 rounded-lg hover:bg-purple-600">Create Room</button>
          </form>
        ) : (
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <label className="block text-purple-300">Room ID</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-purple-900 rounded-lg text-white"
              placeholder="Enter room ID"
              required
            />
            <button type="submit" className="w-full bg-purple-700 text-white py-2 rounded-lg hover:bg-purple-600">Join Room</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;
