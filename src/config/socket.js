const { Server } = require("socket.io");
const Message = require("./models/Message.js");

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
    });

    socket.on("sendMessage", async ({ roomId, senderId, text }) => {
      try {
        const message = await Message.create({
          chatRoom: roomId,
          sender: senderId,
          text,
        });
        io.to(roomId).emit("newMessage", message);
      } catch {
        socket.emit("errorMessage", "Failed to send message.");
      }
    });

    socket.on("disconnect", () => {
      // optional: handle disconnect logic silently
    });
  });
}

module.exports = setupSocket;
