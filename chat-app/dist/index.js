"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8000 });
let allsocket = new Set(); // Using a Set to prevent duplicate entries
let userRoomMap = new Map(); // Faster room lookup
wss.on("connection", (socket) => {
    console.log("New connection established");
    socket.on("message", (message) => {
        console.log("Message received:", message.toString());
        try {
            const parsedMessage = JSON.parse(message.toString());
            console.log("Parsed message:", parsedMessage);
            if (parsedMessage.type === "join") {
                const roomId = parsedMessage.payload.roomId;
                userRoomMap.set(socket, roomId);
                allsocket.add({ socket, room: roomId });
            }
            if (parsedMessage.type === "chat") {
                const currentUserRoom = userRoomMap.get(socket);
                if (currentUserRoom) {
                    for (let user of allsocket) {
                        if (user.room === currentUserRoom && user.socket !== socket && user.socket.readyState === ws_1.WebSocket.OPEN) {
                            user.socket.send(JSON.stringify({
                                type: "chat",
                                message: parsedMessage.payload.message,
                            }));
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error("Error processing message:", error);
            socket.send(JSON.stringify({
                error: "Invalid message format or unexpected error",
            }));
        }
    });
    socket.on("close", () => {
        console.log("User disconnected");
        allsocket.forEach((user) => {
            if (user.socket === socket) {
                allsocket.delete(user);
                userRoomMap.delete(socket);
            }
        });
    });
});
