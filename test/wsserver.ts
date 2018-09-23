import WebSocket = require("ws");

import { useWebsocketServer } from "test/helpers";

import { MessageTypes } from "websocket/messages";

let client: WebSocket;

const getClient = useWebsocketServer();

beforeEach(() => {
  client = getClient();
});

describe("websockets", () => {
  describe("message validation", () => {
    const payload = "}{lk}{[]a12}";
    it("responds with an error if the payload is not valid JSON", done => {
      client.on("message", data => {
        expect(typeof data).toBe("string");
        if (typeof data === "string") {
          const response = JSON.parse(data);
          expect(response.type).toBe(MessageTypes.Error);
          done();
        }
      });

      client.send(payload);
    });

    it("keeps working even after an error", done => {
      let count = 0;

      client.on("message", data => {
        expect(typeof data).toBe("string");
        if (typeof data === "string") {
          const response = JSON.parse(data);
          /* eslint-disable-next-line operator-assignment */
          count = count + 1;
          expect(response.type).toBe(MessageTypes.Error);
          if (count === 2) done();
        }
      });

      client.send(payload);
      client.send(payload);
    });
  });
});
