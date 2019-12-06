const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib');
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib');
const passwordLib = require('./../libs/generatePasswordLib');

const UserModel = mongoose.model('User');
const AuthModel = mongoose.model('Auth');

let signUpFunction = (req, res) => {
  // validate userInput
  let validateUserInput = () => {
    return new Promise ((resolve, reject) =>  {
      if (req.body.email) {
        if (!validateInput.Email(req.body.email)) {
          let apiResponse = response.generate(true, 'Email Id not correct', 400, null);
        } else if (check.isEmpty(req.body.password)) {
          let apiResponse = response.generate(true, 'password parameter is missing', 400, null);
        } else if (check.isEmpty(req.body.mobileNumber)) {
          let apiResponse = response.generate(true, 'Mobile Number parameter is missing', 400, null);
          reject(apiResponse);
        } else {
          resolve(req);
        }
      } else {
        logger.error('Field Missing During User Creation', 'userController: createUser()', 5);
        let apiResponse = response.generate(true, 'One or More Parameter(s) is missing', 400, null);
        reject(apiResponse);
      }
    })
  }

  // Creating a new user based on resolved data
  let createUser = () => {
    return new Promise((resolve, reject) => {
      UserModel.findOne({email: req.body.email}, (err, retreivedUserDetails) => {
        if (err) {
          logger.error(err.message, 'userController: createUser', 10);
          let apiResponse = response.generate(true, 'Failed To Create User', 500, null);
          reject(apiResponse);
        } else if (check.isEmpty(retreivedUserDetails)) {
          // console.log(req.body);
          let newUserObj = new UserModel({
            userId: shortid.generate(),
            firstName: req.body.firstName,
            lastName: req.body.lastName || '',
            email: req.body.email.toLowerCase(),
            mobileNumber: req.body.mobileNumber,
            password: passwordLib.hashpassword(req.body.password),
            createdOn: time.now()
          });

          newUser.save((err, newUserObj) => {
            if (err) {
              logger.error(err.message, 'userController: createUser', 10);
              let apiResponse = respon.generate(true, 'Failed to create new User', 500, null);
              reject(apiResponse);
            } else {
              let newUserObj = newUser.toObject();
              resolve(newUserObj);
            }
          });
        } else {
          logger.error('User Cannot Be Created. User Already Present', 'userController: createUser', 4);
          let apiResponse = response.generate(true, 'User Already Present With this Email', 403, null);
          reject(apiResponse);
        }
      });
    });
  }

  validateUserInput(req, res)
    .then(createUser)
    .then((data) => {
      // console.log(data);
      delete data.password;
      let apiResponse = response.generate(false, 'User Created', 200, resolve);
      res.send(apiResponse);
    })
    .catch((err) => {
      // console.log(err);
      res.send(err);
    })

}
// End of Signup function


// Login Function
let loginFunction = (req, res) => {
  // Find User
  let findUser = () => {
    return new Promise((resolve, reject) => {
      if (req.body.email) {
        UserModel.findOne({email: req.body.email}, (err, userDetails) => {
          if (err) {
            logger.error('Failed To Retrieve User Data', 'userController: findUser()', 10);
            let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null);
            reject(apiResponse);
          } else if (check.isEmpty(userDetails)) {
            logger.error('No User Found', 'userController: findUser()', 7);
            let apiResponse = response.generate(true, 'No User Details Found', 404, null);
            reject(apiResponse);
          } else {
            logger.info('User Found', 'userController: findUser()', 10);
            resolve(userDetails);
          }
        });
      } else {
        let apiResponse = response.generate(true, '"email/password" parameter is missing', 400, null);
        reject(apiResponse);
      }
    })
  }
  // End of find user

  // Validate password
  let validatePassword = (retreivedUserDetails) => {
    // console.log(retreivedUserDetails);
    return new Promise((resolve, reject) => {
      passwordLib.comparePassword(req.body.password, retreivedUserDetails.password, (err, isMatch) => {
        if (err) {
          logger.error(err.message, 'userController: validatePassword()', 10);
          let apiResponse = response.generate(true, 'Login Failed', 500, null);
          reject(apiResponse);
        } else if (isMatch) {
          let retreivedUserDetailsObj = retrievedUserDetails.toObject();
          delete retrievedUserDetailsObj.password;
          delete retrievedUserDetailsObj._id;
          delete retrievedUserDetailsObj.__v;
          delete retrievedUserDetailsObj.createdOn;
          delete retrievedUserDetailsObj.modifiedOn;

          resolve(retrievedUserDetailsObj)
        } else {
          logger.info('Login Failed Due To Invalid Password', 'userController: validatePassword()', 10);
          let apiResponse = response.generate(true, 'Wrong Password.Login Failed', 400, null);
          reject(apiResponse);
        }
      });
    });
  }
  // End of Validate password

  // Generate Token
  let generatToken = (userDetails) => {
    return new Promise ((resolve, reject) => {
      token.generatToken(userDetails, (err, tokenDetails) => {
        if (err) {
          let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null);
          reject(apiResponse);
        } else {
          tokenDetails.userId = userDetails.userId;
          tokenDetails.userDetails = userDetails;
          resolve(tokenDetails);
        }
      });
    });
  }
  // End of Generate Token

  // Save Token
  let saveToken = (userDetails) => {
    // console.log(userDetails);
    return new Promise ((resolve, reject) => {
      AuthModel.findOne({userId: tokenDetails.userId}, (err, retrievedTokenDetails) => {
        if (err) {
          logger.error(err.message, 'userController: saveToken', 10);
          let  apiResponse = response.generate(true, 'Failed To Generate Token', 500, null);
          reject(apiResponse)
        } else if (check.isEmpty(retreivedUserDetails)) {
          let newAuthToken = new AuthModel({
            userId: tokenDetails.userId,
            authToken: tokenDetails.authToken,
            tokenSecret: tokenDetails.tokenSecret,
            tokenGenerationTime: time.now()
          });
          newAuthToken.save((err, newTokenDetails) => {
            if (err) {
              logger.error(err.message, 'userController: saveToken', 10);
              let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null);
              reject(apiResponse);
            } else {
              let responseBody = {
                authToken: newTokenDetails.authToken,
                userDetails: tokenDetails.userDetails
              }
              resolve(apiResponse);
            }
          });
        } else {
          retreivedUserDetails.authToken = tokenDetails.authToken;
          retreivedUserDetails.tokenSecret = tokenDetails.tokenSecret;
          retreivedUserDetails.tokenGenerationTime = time.now();
          retreivedUserDetails.save((err, newTokenDetails) => {
            if (err) {
              logger.error(err.message, 'userController: saveToken', 10)
              let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
              reject(apiResponse)
            } else {
              let responseBody = {
                authToken: newTokenDetails.authToken,
                userDetails: tokenDetails.userDetails
              }
              resolve(responseBody);
            }
          });
        }
      });
    });
  }

  // calling promises
  findUser(req, res)
    .then(validatePassword)
    .then(generatToken)
    .then(saveToken)
    .then((data) => {
      let apiResponse = response.generate(false, 'Login Successful', 200, resolve);
      res.status(200);
      res.send(apiResponse);
    })
    .catch((err) => {
      // console.log("Login Function errorhandler");
      // console.log(err);
      res.status(err.status)
      res.send(err)
    })
}
// End of Login Functions


// Exporting modules
module.exports = {
  signUpFunction: signUpFunction
}
// End Exports
