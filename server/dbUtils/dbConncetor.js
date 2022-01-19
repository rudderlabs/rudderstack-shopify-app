import mongoose from "mongoose";

export class DBConnector {
  constructor() {
    // this.client = null;
    this.config = null;
  }

  static setClientConfigFromEnv() {
    const dbConObject = new DBConnector();
    dbConObject.config = {
      PASSWORD: process.env.APP_CONFIG_PASSWORD,
      DB_NAME: process.env.APP_CONFIG_DB_NAME
    }
    return dbConObject;
  }

  async connect() {
    // TODO: change to mongoose.connect('mongodb://username:password@host:port/database?options...');
    if (!this.config) {
      throw new Error('[DbConnector]:: Could not connect to DB. config not set.');
    }
    await mongoose.connect(
      `mongodb+srv://mongoprod:${this.config.PASSWORD}@cluster0.rbjvc.mongodb.net/${this.config.DB_NAME}?retryWrites=true&w=majority`
    );
    return this;
  }
}