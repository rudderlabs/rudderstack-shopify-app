import { v4 as uuidv4 } from "uuid";
class AppContext {
  constructor() {
    this.id = uuidv4();
    this.info = "rudder-app-context";
    this.state = new Map(); // TODO: change the map to cache
    this.dbConObject = null;
  }

  setDBConnector(dbConObject) {
    this.dbConObject = dbConObject;
  }

  getDBConnector() {
    return this.dbConObject;
  }
}

export default new AppContext();
