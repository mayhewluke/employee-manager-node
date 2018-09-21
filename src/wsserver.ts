import WebSocket = require("ws");

export default (
  server: WebSocket.ServerOptions["server"],
  callback?: () => void
) => {
  const wss = new WebSocket.Server({ server }, callback);
  return wss.on("connection", (ws, _) => {
    ws.on("message", message => {
      ws.send(message);
    });

    ws.send("Connected successfully");
  });
};
