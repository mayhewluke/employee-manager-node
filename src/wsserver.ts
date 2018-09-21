import firebaseAdmin from "firebaseAdmin";

import WebSocket = require("ws");

export default (
  server: WebSocket.ServerOptions["server"],
  callback?: () => void
) => {
  const wss = new WebSocket.Server({ server }, callback);
  return wss.on("connection", (ws, _) => {
    ws.on("message", data => {
      if (typeof data !== "string") {
        return ws.send(
          JSON.stringify({
            event: "error",
            message: `Messages must be strings, received ${typeof data}`
          })
        );
      }
      let message;
      try {
        message = JSON.parse(data);
      } catch (e) {
        return ws.send(
          JSON.stringify({
            event: "error",
            message: `Could not parse the message. Make sure it is valid JSON.
                Received: ${data}`
          })
        );
      }
      if (message.event === "authenticate") {
        return firebaseAdmin
          .auth()
          .verifyIdToken(message.token)
          .then(() => {
            ws.send(JSON.stringify({ event: "authSuccess" }));
          })
          .catch(error => {
            ws.send(JSON.stringify({ event: "error", message: error.message }));
          });
      }
      return ws.send(data);
    });

    ws.send("Connected successfully");
  });
};
