import WebSocket = require("ws");

export default (
  server: WebSocket.ServerOptions["server"],
  callback?: () => void
) => {
  const wss = new WebSocket.Server({ server }, callback);
  return wss.on("connection", (ws, _) => {
    ws.on("message", data => {
      if (typeof data !== "string") {
        ws.send(
          JSON.stringify({
            event: "error",
            message: `Messages must be strings, received ${typeof data}`
          })
        );
      } else {
        try {
          JSON.parse(data);
          ws.send(data);
        } catch (e) {
          ws.send(
            JSON.stringify({
              event: "error",
              message: `Could not parse the message. Make sure it is valid JSON.
                Received: ${data}`
            })
          );
        }
      }
    });

    ws.send("Connected successfully");
  });
};
