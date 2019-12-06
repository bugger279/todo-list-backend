const express = require('express');
const router = express.Router();
const listController = require("../controllers/listController");
const appConfig = require("../../config/appConfig")

module.exports.setRouter = (app) => {
    let baseUrl = `${appConfig.apiVersion}/list`;
    app.get(`${baseUrl}/:listId`, listController.getList);
    app.get(`${baseUrl}`, listController.getAllList);
    app.post(`${baseUrl}/create`, listController.createList);
    app.post(`${baseUrl}/items/create/:listId`, listController.createItems);
    app.post(`${baseUrl}/delete/:listId`, listController.deleteList);
    app.post(`${baseUrl}/items/delete/:itemId`, listController.deleteItem);
    // app.post(`${baseUrl}/item/create`, listController.createItems);
}
