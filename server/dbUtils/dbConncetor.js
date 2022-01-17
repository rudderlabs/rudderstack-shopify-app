import { Client } from "pg";

export class DBConnector {
  constructor() {
    this.client = null;
  }

  static setClientConfigFromEnv() {
    const dbConObject = new DBConnector();
    dbConObject.client = new Client({
      user: process.env.APP_CONFIG_USER,
      host: process.env.APP_CONFIG_HOST,
      database: process.env.APP_CONFIG_DB_NAME,
      password: process.env.APP_CONFIG_PASSWORD,
      port: process.env.APP_CONFIG_PORT,
    });
    return dbConObject;
  }

  static setConfigAndConnect() {
    return this.setClientConfigFromEnv().connect();
  }

  connect() {
    if (!this.client) {
      throw new Error('[DbConnector]:: DB client not created');
    }
    this.client.connect(err => {
      if (err) {
        throw err;
      }
      console.log('[DbConnector]:: Connected to DB');
    });
    return this;
  }

  getClient() {
    return this.client;
  }
}