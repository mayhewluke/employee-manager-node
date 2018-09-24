import mongoose, { Document } from "mongoose"; // eslint-disable-line import/newline-after-import
import WebSocket = require("ws");

import { useMongo, useWebsocketServer } from "test/helpers";

import { ClientEmployee, Employee, EmployeeModel } from "Employee";
import firebaseAdmin from "firebaseAdmin";
import { creators, MessageTypes } from "websocket/messages";

let client: WebSocket;
let originalVerify: any;
const mockVerify = jest.fn();
const uid = "uid1";

useMongo("update");
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

describe("when logged in", () => {
  beforeEach(async done => {
    mockVerify.mockImplementation(() => Promise.resolve({ uid }));
    client.on("message", (data: string) => {
      const response = JSON.parse(data);
      if (response.type === MessageTypes.AuthSuccess) done();
    });
    client.send(JSON.stringify(creators.authenticate(uid)));
  });

  describe("when the Employee already exists", () => {
    const existingEmployee: Partial<Employee & Document> = {
      _id: new mongoose.Types.ObjectId(),
      employeeName: "Taylor",
      phone: "555-5555",
      shift: "Monday",
      userUid: uid
    };
    beforeEach(async () => {
      await EmployeeModel.create(existingEmployee);
    });

    describe("with a valid set of values", () => {
      const update: Partial<ClientEmployee & Document> = {
        _id: existingEmployee._id, // eslint-disable-line no-underscore-dangle
        employeeName: "Casey",
        phone: "123-456-7890",
        shift: "Friday"
      };
      const msg = JSON.stringify(creators.updateEmployee(update));

      it("updates the fields on the Employee", done => {
        client.on("message", async () => {
          const updatedEmployee = await EmployeeModel.findById(
            existingEmployee._id // eslint-disable-line no-underscore-dangle
          );
          expect(updatedEmployee).toEqual(expect.objectContaining(update));
          done();
        });

        client.send(msg);
      });

      it("sends an update success message then a list employees message", done => {
        let count = 0;
        client.on("message", (data: string) => {
          const response = JSON.parse(data);
          if (count === 0) {
            // eslint-disable-next-line operator-assignment
            count = count + 1;
            expect(response.type).toEqual(MessageTypes.UpdateEmployeeSuccess);
          } else if (count === 1) {
            expect(response.type).toEqual(MessageTypes.EmployeesList);
            done();
          }
        });

        client.send(msg);
      });

      it("sends out the updated employees list", done => {
        client.on("message", async (data: string) => {
          const { type, payload } = JSON.parse(data);
          if (type === MessageTypes.EmployeesList) {
            const employees = await EmployeeModel.find({ userUid: uid });
            // `expect` somehow picks up some weird kind of extra data if using
            // `expect` directly, so serialize the data to get around that
            expect(JSON.stringify(payload)).toEqual(JSON.stringify(employees));
            done();
          }
        });

        client.send(msg);
      });
    });

    describe("with an invalid update", () => {
      const update = { employeeName: 42 };
      const msg = JSON.stringify(creators.updateEmployee(update as any));

      // TODO get this working
      // Mongoose built in validators are *extremely* permissive, so this
      // doesn't work without some extra custom validation logic
      xit("returns an error message", done => {
        client.on("message", (data: string) => {
          const response = JSON.parse(data);
          expect(response.type).toEqual(MessageTypes.Error);
          done();
        });

        client.send(msg);
      });

      it("does not change the employee", async done => {
        // eslint-disable-next-line no-underscore-dangle
        const getEmployee = () => EmployeeModel.findById(existingEmployee._id);
        const originalEmployee = await getEmployee();

        client.on("message", async () => {
          expect(await getEmployee()).toEqual(originalEmployee);
          done();
        });

        client.send(msg);
      });
    });
  });
});

describe("when not logged in", () => {
  const update: Partial<ClientEmployee & Document> = {
    _id: new mongoose.Types.ObjectId(),
    employeeName: "Casey",
    phone: "123-456-7890",
    shift: "Friday"
  };
  const msg = JSON.stringify(creators.updateEmployee(update));

  it("returns an error message", done => {
    client.on("message", (data: string) => {
      const response = JSON.parse(data);
      expect(response.type).toEqual(MessageTypes.Error);
      done();
    });

    client.send(msg);
  });
});
