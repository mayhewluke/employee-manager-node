import mongoose from "mongoose";

const useMongo = (dbName: string) => {
  mongoose.Promise = global.Promise;

  beforeAll(async () => {
    // Ensure each test suite has a unique database to run off of, so that
    // tests can be run in parallel without conflicting with each other
    await mongoose.connect(
      `mongodb://127.0.0.1/jest-${dbName}`,
      { useNewUrlParser: true }
    );
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
};

export default useMongo;
