'use strict'
const mongoose = require('mongoose'),
Schema = mongoose.Schema;

// Creating Schema
let ItemSchema = new Schema({
  itemsId: { type: String, default: '', index: true, unique: true },
  itemsName: { type: String, required: true }
});

mongoose.model('Item', ItemSchema);
