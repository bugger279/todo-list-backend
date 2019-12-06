'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
Schema = mongoose.Schema;

// Creating Schema
let userSchema = new Schema({
  userId: { type: String, default: '', index: true, unique: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  password: { type: String, default: 'password' },
  email: { type: String, default: '' },
  token: { type: String, default: '' },
  mobileNumber: { type: Number, default: 0 },
  createdOn :{ type:Date, default: Date.now() }
});

mongoose.model('User', userSchema);
