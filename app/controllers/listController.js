const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('./../libs/checkLib');

/* Models */
const listModel = mongoose.model('List');
const itemModel = mongoose.model('Item');
const userModel = mongoose.model('User');

let createList = (req, res) => {
  /**
   * Validate Token
   * Insert Todo List Items + get UserID
   */

  let validateUserToken = () => {
    return new Promise((resolve, reject) => {
      userModel.findOne({ token: req.header("token") }, (err, data) => {
        if (err) {
          logger.error('Token Missing During List Creation', 'listController: createList()', 5)
          let apiResponse = response.generate(true, 'One or More Parameter(s) is missing', 400, null)
          reject(apiResponse)
        } else {
          resolve(data)
        }
      })
    })
  }

  let insertIntoList = (userData) => {
    return new Promise((resolve, reject) => {
      let newList = new listModel({
        listId: shortid.generate(),
        listOwnersId: [{ ownerId: userData.userId }],
        listTitle: req.body.listTitle,
        listStatus: true,
        listCreatedOn: time.now(),
      })

      newList.save((err, response) => {
        if (err) {
          logger.error(err.message, 'userController: createUser', 10)
          let apiResponse = response.generate(true, 'Failed to create new User', 500, null)
          reject(apiResponse)
        } else {
          resolve(response)
        }
      });
    })
  }

  validateUserToken()
    .then(insertIntoList)
    .then((listData) => {
      let apiResponse = response.generate(false, 'List created Succesfully', 200, listData);
      res.status(200).send(apiResponse)
    })
    .catch((err) => {
      console.log(err);
    })
}

let getList = (req, res) => {

  let validateUserToken = () => {
    return new Promise((resolve, reject) => {
      userModel.findOne({ token: req.header("token") }, (err, data) => {
        if (err) {
          logger.error('Field Missing During User Creation', 'userController: createUser()', 5)
          let apiResponse = response.generate(true, 'One or More Parameter(s) is missing', 400, null)
          reject(apiResponse)
        } else {
          resolve(data)
        }
      })
    })
  }

  // ownership of list
  let ownerShip = () => {
    return new Promise((resolve, reject) => {
      listModel.findOne({ listId: req.params.listId }, (err, data) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log(data);
          resolve(data);
        }
      })
    })
  }
  validateUserToken(req, res)
    .then(ownerShip)
}

// Find all Lists
let getAllList = (req, res) => {

  let validateUserToken = () => {
    return new Promise((resolve, reject) => {
      userModel.findOne({ token: req.header("token") }, (err, data) => {
        if (err) {
          logger.error('Field Missing During User Creation', 'userController: createUser()', 5)
          let apiResponse = response.generate(true, 'One or More Parameter(s) is missing', 400, null)
          reject(apiResponse)
        } else {
          resolve(data)
          console.log(data);
        }
      })
    })
  }

  let listsData = (userData) => {
    return new Promise((resolve, reject) => {
      listModel.find({ 'listOwnersId.ownerId': { $in: [userData.userId] } }, (err, data) => {
        if (err) {
          console.log();

        } else {
          console.log(data);
          resolve(data);
        }
      });
    });
  }

  validateUserToken(req, res)
    .then(listsData)
    .then((allData) => {
      let apiResponse = response.generate(false, 'List Fetched Succesfully', 200, allData);
      res.status(200).send(apiResponse)
    })
    .catch((err) => {
      console.log(err);
    })

}

let createItems = (req, res) => {
  /**
  * Validate List  Id
  * Insert Into designated Id
  */

  let validateListIdAndCreateItem = () => {
    return new Promise((resolve, reject) => {
      let listId = req.params.listId;
      listModel.findOne({ listId: listId }, (err, fetchedId) => {
        if (err) {
          logger.error(err.message, 'listController: createItems', 10)
          let apiResponse = response.generate(true, 'Failed to scan for ListId', 500, null);
          reject(apiResponse);
        } else if (!check.isEmpty(fetchedId)) {
          listModel.update(
            { listId: fetchedId.listId },
            { $push: { "listItems" : {itemsId: shortid.generate(), itemsName: req.body.itemsName} } }, ((err, newSavedItem) => {
              if (err) {
                logger.error(err.message, 'listController: createItem', 10);
                let apiResponse = response.generate(true, 'Failed to create new Item', 500, null);
                reject(apiResponse);
              } else {
                listModel.findOne({ listId: listId }, (err, data) =>  {
                  resolve(data);
                });
              }
            })
        );
        } else {
          logger.error('Items Cannot Be Created. No Such ListId found', 'listController: createList', 4);
          let apiResponse = response.generate(true, 'Items Cannot Be Created. No Such ListId found', 403, null);
          reject(apiResponse);
        }
      })
    });
  }

  // Calling Promises
  validateListIdAndCreateItem(req, res)
    .then((resolve) => {
      let apiResponse = response.generate(false, 'Item created', 200, resolve);
      res.status(200).send(apiResponse);
    })
    .catch((err) => {
      res.send(err);
    })
}

let deleteList = (req, res) => {
  // Validate token
  let validateUserToken = () => {
    return new Promise((resolve, reject) => {
      userModel.findOne({ token: req.header("token") }, (err, data) => {
        if (err) {
          logger.error('Token Missing During List Creation', 'listController: createList()', 5)
          let apiResponse = response.generate(true, 'Invalid token or token doesnt exist', 400, null)
          reject(apiResponse)
        } else {
          resolve(data)
        }
      })
    })
  }

  // find List if exist then delete if found
  let deleteRequestedList = (fetchedOwnerData) => {
    return new Promise((resolve, reject) => {
      if (!check.isEmpty(req.params.listId)) {
        listModel.findOne({listId: req.params.listId}, (err, data) => {
          if (err) {
            logger.error('Failed to fetch List', 'listController: deleteList()', 5);
            let apiResponse = response.generate(true, 'Failed to fetch the List', 400, null);
            reject(apiResponse);
          } else {
            listModel.findOneAndDelete({$and: [{listId: req.params.listId}, { 'listOwnersId.ownerId' : { $in: [fetchedOwnerData.userId] } }]}, (err, data) => {
              if (err) {
                logger.error('Failed to delete List', 'listController: deleteList()', 5);
                let apiResponse = response.generate(true, 'Failed to delete List', 400, null);
                reject(apiResponse);
              } else {
                resolve(data);
              }
            });
          }
        })
      } else {
        logger.error('Missing Data ListId', 'ListController: deleteList()', 4);
        let apiResponse = response.generate(true, 'Token or ListId is missing', 403, null);
        reject(apiResponse);
      }
    });
  }

  // calling promises
  validateUserToken(req, res)
    .then(deleteRequestedList)
    .then((resolve) => {
      let apiResponse = response.generate(false, 'List Deleted Succesfully', 200, resolve);
      res.status(200).send(apiResponse)
    })
    .catch((err) => {
      res.status(400).send(apiResponse);
    })

}

let deleteItem = (req, res) => {
  let itemToBeDeleted = () => {
    return new Promise ((resolve, reject) => {
      // listModel.findOneAndDelete({ 'listItems.itemsId': { $in: [req.params.itemId] } }, (err, data) => {
      //   if (err) {
      //     logger.error('Failed to delete Item/ Item Not Found', 'listController: deleteItems()', 5);
      //     let apiResponse = response.generate(true, 'Failed to delete List', 400, null);
      //     reject(apiResponse);
      //   } else {
      //     resolve(data);
      //   }
      // });

      listModel.updateOne(
        {listId: req.params.listId}, { $pull: { listItems: { itemsId: req.params.itemId } } }, (err, data) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve(data);
          }
        }
        );

      // listModel.findOneAndUpdate({ 'listItems.itemsId': { $in: [req.params.itemId] }}, { $pull: {itemsId: req.params.itemId }}, { multi: true }, (err, data) => {
      //   if (err) {
      //     logger.error('Failed to delete Item/ Item Not Found', 'listController: deleteItems()', 5);
      //     let apiResponse = response.generate(true, 'Failed to delete List', 400, null);
      //     reject(apiResponse);
      //   } else {
      //     if (data) {
      //       let keyData =  data.listItems.pull({itemsId: req.params.itemId })
      //       resolve(keyData);
      //     }
      //   }
      // });
    });
  }

  // calling promise
  itemToBeDeleted(req, res)
    .then((resolve) => {
      console.log("===============");
      console.log(resolve);
      console.log("===============");

      let apiResponse = response.generate(false, 'Item Deleted Succesfully', 200, resolve);
      res.status(200).send(apiResponse)
    })
    .catch((err) => {
      console.log(err);
      let apiResponse = response.generate(true, 'Failed to delete Item: Item Not found or There is some problem while deleting', 400, null);
      res.status(400).send(apiResponse)
    })
}

module.exports = {
  createList, getList, getAllList, createItems, deleteList, deleteItem
}
