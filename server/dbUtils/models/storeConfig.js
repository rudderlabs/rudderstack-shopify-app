import mongoose from "mongoose";

const storeConfigSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  shopname: { type : String , unique : true, required : true, dropDups: true },
  config: Object
});

export default mongoose.model('StoreConfig', storeConfigSchema);