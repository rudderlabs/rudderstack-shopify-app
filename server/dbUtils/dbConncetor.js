import mongoose from "mongoose";

export class DBConnector {
  constructor() {
    this.config = null;
  }

  static setConfigFromEnv() {
    const dbConObject = new DBConnector();
    dbConObject.config = {
      PASSWORD: process.env.APP_CONFIG_PASSWORD,
      DB_NAME: process.env.APP_CONFIG_DB_NAME,
      USERNAME: process.env.APP_CONFIG_USERNAME,
      HOST: process.env.APP_CONFIG_HOST,
      PORT: process.env.APP_CONFIG_PORT
    }
    return dbConObject;
  }

  async connect() {
    if (!this.config) {
      throw new Error('[DbConnector]:: Could not connect to DB. config not set.');
    }
    await mongoose.connect(
      // `mongodb://${this.config.USERNAME}:${this.config.PASSWORD}@${this.config.HOST}:${this.config.PORT}/${this.config.DB_NAME}?retryWrites=true&w=majority`
    );
    return this;
  }
}