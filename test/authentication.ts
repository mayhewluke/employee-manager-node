import http from "http";
import mongoose from "mongoose";
import { AddressInfo } from "net"; // eslint-disable-line import/newline-after-import
import WebSocket = require("ws");

import { UserModel } from "authentication/User";
import firebaseAdmin from "firebaseAdmin";
import { creators, MessageTypes } from "websocket/messages";
import wsserver from "wsserver";

let server: http.Server;
let serverAddress: string | AddressInfo;
let wss: WebSocket.Server;
let client: WebSocket;

beforeAll(async () => {
  mongoose.Promise = global.Promise;
  await mongoose.connect("mongodb://127.0.0.1/wombat");
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
});

// Set up WebSocket and HTTP servers
beforeAll(done => {
  server = http.createServer().listen();
  serverAddress = server.address();
  wss = wsserver(server);
  wss.on("listening", done);
});

// Set up the WebSocket client
beforeEach(done => {
  if (typeof serverAddress === "string") {
    throw new Error("serverAddress was a pipe or UNIX domain socket");
  }
  // Brackets are needed in case it's IPv6
  client = new WebSocket(
    `ws://[${serverAddress.address}]:${serverAddress.port}`
  );
  client.on("open", done);
});

// Tear down the WebSocket client
afterEach(done => {
  // `onclose` passes an error along, so wrap in a fn that swallows the error or
  // else the tests will fail
  client.onclose = () => done();
  client.close();
});

// Tear down WebSocket and HTTP servers
afterAll(done => {
  wss.close(() => {
    server.close(done);
  });
});

describe("authentication", () => {
  let originalAuth: any;
  let mockVerify: any;
  const token = "1234";
  const payload = JSON.stringify(creators.authenticate(token));
  beforeEach(() => {
    mockVerify = jest.fn(() => Promise.resolve());
    // `auth` is a getter so it can't be automocked or assigned to with `=`
    originalAuth = firebaseAdmin.auth;
    Object.defineProperty(firebaseAdmin, "auth", {
      configurable: true,
      value: jest.fn(() => ({
        verifyIdToken: mockVerify
      }))
    });
  });
  afterEach(() => {
    Object.defineProperty(firebaseAdmin, "auth", {
      configurable: true,
      value: originalAuth
    });
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
