import mongoose from "mongoose";

const useMongo = () => {
  mongoose.Promise = global.Promise;

  beforeAll(async () => {
    await mongoose.connect(
      "mongodb://127.0.0.1/jest",
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
