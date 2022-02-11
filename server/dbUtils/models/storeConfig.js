import mongoose from "mongoose";

const schemaOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
};

const storeConfigSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  shopname: { type : String , unique : true, required : true, dropDups: true },
  config: Object
}, { timestamps: true });

export default mongoose.model('StoreConfig', storeConfigSchema);