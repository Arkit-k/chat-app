import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8000 });

interface User {
    socket: WebSocket;
    room: string;
}

let allsocket: Set<User> = new Set(); // Using a Set to prevent duplicate entries
let userRoomMap = new Map<WebSocket, string>(); // Faster room lookup

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
                        if (user.room === currentUserRoom && user.socket !== socket && user.socket.readyState === WebSocket.OPEN) {
                            user.socket.send(
                                JSON.stringify({
                                    type: "chat",
                                    message: parsedMessage.payload.message,
                                })
                            );
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error processing message:", error);
            socket.send(
                JSON.stringify({
                    error: "Invalid message format or unexpected error",
                })
            );
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
