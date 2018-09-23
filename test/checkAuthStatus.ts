import WebSocket = require("ws");

import { useMongo, useWebsocketServer } from "test/helpers";

import firebaseAdmin from "firebaseAdmin";
import { creators, MessageTypes } from "websocket/messages";

let client: WebSocket;
let originalVerify: any;
const mockVerify = jest.fn();
const msg = JSON.stringify(creators.checkAuthStatus());

useMongo();
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

describe("when authenticated", () => {
  beforeEach(done => {
    mockVerify.mockImplementation(() => Promise.resolve({ uid: "uid1" }));
    const checkForLoginSuccess = (data: string) => {
      const response = JSON.parse(data);
      if (response.type === MessageTypes.AuthSuccess) {
        done();
      }
    };
    client.on("message", checkForLoginSuccess);
    client.send(JSON.stringify(creators.authenticate("1234")));
  });

  it("returns the auth status message with true", done => {
    client.on("message", data => {
      expect(typeof data).toEqual("string");
      if (typeof data === "string") {
        const response = JSON.parse(data);
        expect(response).toEqual(creators.authStatus(true));
        done();
      }
    });

    client.send(msg);
  });
});

describe("when unauthenticated", () => {
  it("returns the auth status message with false", done => {
    client.on("message", data => {
      expect(typeof data).toEqual("string");
      if (typeof data === "string") {
        const response = JSON.parse(data);
        expect(response).toEqual(creators.authStatus(false));
        done();
      }
    });

    client.send(msg);
  });
});
