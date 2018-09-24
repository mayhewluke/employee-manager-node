import WebSocket = require("ws");

import { useMongo, useWebsocketServer } from "test/helpers";

import { ClientEmployee, Employee, EmployeeModel } from "Employee";
import firebaseAdmin from "firebaseAdmin";
import { creators, MessageTypes } from "websocket/messages";

let client: WebSocket;
let originalVerify: any;
const mockVerify = jest.fn();
const uid = "uid1";

useMongo("create");
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
  const existingEmployee: Employee = {
    employeeName: "Taylor",
    phone: "555-5555",
    shift: "Monday",
    userUid: uid
  };
  beforeEach(async done => {
    mockVerify.mockImplementation(() => Promise.resolve({ uid }));
    await EmployeeModel.create(existingEmployee);
    client.on("message", (data: string) => {
      const response = JSON.parse(data);
      if (response.type === MessageTypes.AuthSuccess) done();
    });
    client.send(JSON.stringify(creators.authenticate(uid)));
  });

  describe("with a valid employee", () => {
    const employee: ClientEmployee = {
      employeeName: "Casey",
      phone: "123-456-7890",
      shift: "Friday"
    };
    const msg = JSON.stringify(creators.createEmployee(employee));

    it("adds the employee to the current user", done => {
      client.on("message", async () => {
        const [first, second] = await EmployeeModel.find({ userUid: uid });
        expect(first).toEqual(expect.objectContaining(existingEmployee));
        expect(second).toEqual(expect.objectContaining(employee));
        done();
      });

      client.send(msg);
    });

    it("sends a create success message then a list employees message", done => {
      let count = 0;
      client.on("message", (data: string) => {
        const response = JSON.parse(data);
        if (count === 0) {
          // eslint-disable-next-line operator-assignment
          count = count + 1;
          expect(response.type).toEqual(MessageTypes.CreateEmployeeSuccess);
        } else if (count === 1) {
          expect(response.type).toEqual(MessageTypes.EmployeesList);
          done();
        }
      });

      client.send(msg);
    });

    it("sends out the updated employees list", done => {
      client.on("message", (data: string) => {
        const { type, payload } = JSON.parse(data);
        if (type === MessageTypes.EmployeesList) {
          expect(payload).toContainEqual(
            expect.objectContaining(existingEmployee)
          );
          expect(payload).toContainEqual(expect.objectContaining(employee));
          expect(payload.length).toBe(2);
          done();
        }
      });

      client.send(msg);
    });
  });

  describe("with an invalid employee", () => {
    const employee = { foo: "bar" };
    const msg = JSON.stringify(creators.createEmployee(employee as any));

    it("returns an error message", done => {
      client.on("message", (data: string) => {
        const response = JSON.parse(data);
        expect(response.type).toEqual(MessageTypes.Error);
        done();
      });

      client.send(msg);
    });

    it("does not change the employees", async done => {
      const getEmployees = () => EmployeeModel.find({ userUid: uid });
      const originalEmployees = await getEmployees();
      expect(originalEmployees).toEqual([
        expect.objectContaining(existingEmployee)
      ]);

      client.on("message", async () => {
        expect(await getEmployees()).toEqual(originalEmployees);
        done();
      });

      client.send(msg);
    });
  });
});

describe("when not logged in", () => {
  const employee: ClientEmployee = {
    employeeName: "Casey",
    phone: "123-456-7890",
    shift: "Friday"
  };
  const msg = JSON.stringify(creators.createEmployee(employee));

  it("returns an error message", done => {
    client.on("message", (data: string) => {
      const response = JSON.parse(data);
      expect(response.type).toEqual(MessageTypes.Error);
      done();
    });

    client.send(msg);
  });
});
