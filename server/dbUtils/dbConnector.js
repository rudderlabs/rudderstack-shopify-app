import mongoose from "mongoose";

export class DBConnector {
  constructor() {
    this.config = null;
  }

  static setConfigFromEnv() {
    const dbConObject = new DBConnector();
    dbConObject.config = {
      PASSWORD: encodeURIComponent(process.env.DB_PASSWORD),
      DB_NAME: process.env.DB_NAME,
      USERNAME: encodeURIComponent(process.env.DB_USER),
      HOST: process.env.DB_HOST,
      PORT: process.env.DB_PORT
    }
    return dbConObject;
  }

  async connect() {
    console.log("inside dbconnector connect");
    if (!this.config) {
      throw new Error('[DbConnector]:: Could not connect to DB. config not set.');
    }
    
    let connectionUrl = `mongodb://${this.config.USERNAME}:${this.config.PASSWORD}@${this.config.HOST}:${this.config.PORT}/${this.config.DB_NAME}?retryWrites=true&w=majority`;
    let options = {};

    if (!process.env.MODE || process.env.MODE !== 'local') {
      console.log("Trying connection to remote DB");
      options = {
        ssl: true,
        sslValidate: true,
        sslCA: process.env.DB_SSL_CA_PATH
      };
      connectionUrl = `mongodb://${this.config.USERNAME}:${this.config.PASSWORD}@${this.config.HOST}:${this.config.PORT}/${this.config.DB_NAME}?replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`
      
    }
    
    console.log("calling connect");
    await mongoose.connect(
      connectionUrl, 
      options
    );
  }
}