'use strict'
/**
 * Module Dependencies
 */

const ItemSchema = require('../models/Items');
const mongoose = require('mongoose'),
Schema = mongoose.Schema;

// Creating Schema
let OwnersSchema = new Schema({
  ownerId: { type: String, default: '', index: true },
});


let ListSchema = new Schema({
  listId: { type: String, default: '', index: true, unique: true },
  listOwnersId:[OwnersSchema],
  listTitle: { type: String, default: '' },
  listStatus: { type: Boolean, default: 0 },
  listItems: [ItemSchema],
  listCreatedOn: { type: Date, default: Date.now() }
});

mongoose.model('List', ListSchema);
