const WebSocket = require("ws");

module.exports = function (server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("🔌 WebSocket client connected");
  });

  const broadcastBooking = (message) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "NEW_BOOKING",
          message: message || "🚨 تم تسجيل حجز جديد",
        }));
      }
    });
  };

  return { wss, broadcastBooking };
};
