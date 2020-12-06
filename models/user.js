const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String, index: true, unique: true },
  password: { type: String },
  role: { type: String },
  activationToken: { type: String },
  activated: { type: Boolean, default: false },
  resetToken: { type: String },
  resetSentAt: { type: Date }
}, {timestamps: true});

// Virtual field for user URL
userSchema.virtual('url').get(function() {
  return '/users/' + this.id;
});

module.exports = mongoose.model('User', userSchema);