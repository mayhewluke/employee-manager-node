import WebSocket = require("ws");

import { useMongo, useWebsocketServer } from "test/helpers";

import firebaseAdmin from "firebaseAdmin";
import { creators, MessageTypes } from "websocket/messages";

let client: WebSocket;
let originalVerify: any;
const mockVerify = jest.fn();

useMongo("authentication");
const getClient = useWebsocketServer();

beforeEach(() => {
  client = getClient();
});

// Manually mock the verifyIdToken method
beforeAll(() => {
  const auth = firebaseAdmin.auth();
  originalVerify = auth.verifyIdToken;
  auth.verifyIdToken = mockVerify;
});
afterAll(() => {
  firebaseAdmin.auth().verifyIdToken = originalVerify;
});

describe("authentication", () => {
  const token = "1234";
  const payload = JSON.stringify(creators.authenticate(token));
  beforeEach(() => {
    mockVerify.mockImplementation(() => Promise.resolve());
  });

  it("checks the client's auth token against firebase", done => {
    client.on("message", () => {
      expect(mockVerify).toHaveBeenCalledTimes(1);
      expect(mockVerify).toHaveBeenCalledWith(token);
      done();
    });

    client.send(payload);
  });

  describe("when successful", () => {
    const uid = "uid1";
    const returnToken = { uid };
    beforeEach(() => {
      mockVerify.mockImplementation(() => Promise.resolve(returnToken));
    });

    it("responds with an authSuccess message", done => {
      client.on("message", data => {
        expect(typeof data).toBe("string");
        if (typeof data === "string") {
          const response = JSON.parse(data);
          expect(response.type).toBe(MessageTypes.AuthSuccess);
          done();
        }
      });

      client.send(payload);
    });
  });

  describe("when unsuccessful", () => {
    const error = new Error("Something went wrong!");
    beforeEach(() => {
      mockVerify.mockImplementation(() => Promise.reject(error));
    });

    it("responds with the error from firebase", done => {
      client.on("message", data => {
        expect(typeof data).toBe("string");
        if (typeof data === "string") {
          const response = JSON.parse(data);
          expect(response.type).toBe(MessageTypes.Error);
          expect(response.payload.message).toEqual(error.message);
          done();
        }
      });

      client.send(payload);
    });
  });
});
