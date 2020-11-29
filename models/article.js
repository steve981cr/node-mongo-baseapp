const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articleSchema = new Schema({
  // _id: { type: String, alias: "id" },
  title: { type: String },
  content: { type: String },
  published: { type: Boolean, default: false }
}, {timestamps: true});

/*articleSchema.virtual('id').get(() => { 
  return this._id;
});*/

module.exports = mongoose.model('Article', articleSchema);