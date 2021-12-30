import { v4 as uuidv4 } from "uuid";
class AppContext {
  constructor() {
    this.id = uuidv4();
    this.info = "rudder-app-context";
    this.state = new Map();
  }
}

export default new AppContext();
