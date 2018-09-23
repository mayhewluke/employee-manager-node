import WebSocket = require("ws");

import { useMongo, useWebsocketServer } from "test/helpers";

import { UserModel } from "authentication/User";
import firebaseAdmin from "firebaseAdmin";
import { creators, MessageTypes } from "websocket/messages";

let client: WebSocket;
let originalVerify: any;
const mockVerify = jest.fn();

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

    describe("if the user does not exist", () => {
      it("creates a user", async done => {
        expect(await UserModel.findById(uid)).toBeNull();

        client.on("message", async () => {
          expect(await UserModel.findById(uid)).toEqual(expect.anything());
          done();
        });

        client.send(payload);
      });

      it("sends an error if the creation fails", async done => {
        const error = new Error("Something went wrong!");
        // Force an error via mocking - otherwise the only option is to pass
        // parameters which are valid to the API but invalid to mongo, which
        // should not be possible due to validations etc.
        // TODO unfortunately this couples the test very tightly - find a better way
        jest
          .spyOn(UserModel, "updateOne")
          .mockImplementation((...args) => args.slice(-1)[0](error));

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

    describe("if the user exists", () => {
      let userCountBefore: number;
      beforeEach(async () => {
        await UserModel.create({ _id: uid });
        userCountBefore = await UserModel.countDocuments({});
      });

      it("does not create a user", async done => {
        client.on("message", async () => {
          expect(await UserModel.countDocuments({})).toEqual(userCountBefore);
          done();
        });

        client.send(payload);
      });

      it("does not send an error", done => {
        client.on("message", data => {
          expect(typeof data).toBe("string");
          if (typeof data === "string") {
            const response = JSON.parse(data);
            expect(response.type).not.toBe(MessageTypes.Error);
            done();
          }
        });

        client.send(payload);
      });
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

    it("does not create a user", async done => {
      const userCountBefore = await UserModel.countDocuments({});

      client.on("message", async () => {
        expect(await UserModel.countDocuments({})).toEqual(userCountBefore);
        done();
      });

      client.send(payload);
    });
  });
});
