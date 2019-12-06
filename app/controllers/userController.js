const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib')
const passwordLib = require('./../libs/generatePasswordLib');
const token = require('./../libs/tokenLib');
const md5 = require('md5');
/* Models */
const UserModel = mongoose.model('User');
const AuthModel = mongoose.model('Auth');

// start user signup function
let signUpFunction = (req, res) => {
  // validate user input
  let validateUserInput = () => {
    return new Promise((resolve, reject) => {
      if (req.body.email) {
        if (!validateInput.Email(req.body.email)) {
          let apiResponse = response.generate(true, 'Email Does not met the requirement', 400, null);
          reject(apiResponse);
        } else if (check.isEmpty(req.body.password)) {
          let apiResponse = response.generate(true, 'password parameter is missing', 400, null);
          reject(apiResponse);
        } else if (check.isEmpty(req.body.mobileNumber)) {
          let apiResponse = response.generate(true, 'Mobile Number parameter is missing', 400, null);
          reject(apiResponse);
        } else {
          resolve(req);
        }
      } else {
        logger.error('Field Missing During User Creation', 'userController: createUser()', 5)
        let apiResponse = response.generate(true, 'One or More Parameter(s) is missing', 400, null)
        reject(apiResponse)
      }
    })
  }

  // Create new user after  validating users input
  let createUser = () => {
    return new Promise((resolve, reject) => {
      UserModel.findOne({ email: req.body.email })
        .exec((err, retrievedUserDetails) => {
          if (err) {
            logger.error(err.message, 'userController: createUser', 10);
            let apiResponse = response.generate(true, 'Failed To Create User', 500, null);
            reject(apiResponse);
          } else if (check.isEmpty(retrievedUserDetails)) {
            // console.log(req.body);
            let newUser = new UserModel({
              userId: shortid.generate(),
              firstName: req.body.firstName,
              lastName: req.body.lastName || '',
              email: req.body.email.toLowerCase(),
              mobileNumber: req.body.mobileNumber,
              password: passwordLib.hashpassword(req.body.password),
              createdOn: time.now()
            });

            newUser.save((err, newUser) => {
              if (err) {
                logger.error(err.message, 'userController: createUser', 10)
                let apiResponse = response.generate(true, 'Failed to create new User', 500, null)
                reject(apiResponse)
              } else {
                let newUserObj = newUser.toObject();
                resolve(newUserObj);
              }
            });
          } else {
            logger.error('User Cannot Be Created.User Already Present', 'userController: createUser', 4);
            let apiResponse = response.generate(true, 'User Already Present With this Email', 403, null);
            reject(apiResponse);
          }
        })
    })
  }
  // End of create User

  validateUserInput(req, res)
    .then(createUser)
    .then((resolve) => {
      delete resolve.password;
      let apiResponse = response.generate(false, 'User created', 200, resolve);
      console.log(apiResponse);
      res.send(apiResponse);
    })
    .catch((err) => {
      // console.log(err);
      res.send(err);
    })
}
// end user signup function

// start of login function
let loginFunction = (req, res) => {
  // find User
  let findUser = () => {
    return new Promise((resolve, reject) => {
      if (req.body.email) {
        // Check if email is present or not
        // console.log(req.body);
        UserModel.findOne({ email: req.body.email }, (err, userDetails) => {
          if (err) {
            // Handle Error
            // Database Error
            logger.error('Failed To Retrieve User Data', 'userController: findUser()', 10);
            /* generate the error message and the api response message here */
            let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null);
            reject(apiResponse);
          } else if (check.isEmpty(userDetails)) {
            // if No users with that email found
            logger.error('No User Found', 'userController: findUser()', 7);
            let apiResponse = response.generate(true, 'No User Details Found', 404, null);
            reject(apiResponse);
          } else {
            // If user found Sucessfully!!
            logger.info('User Found', 'userController: findUser()', 10);
            resolve(userDetails);
          }
        });
      } else {
        let apiResponse = response.generate(true, '"email" parameter is missing', 400, null);
        reject(apiResponse);
      }
    })
  }

  // Validate Password
  let validatePassword = (retrievedUserDetails) => {
    // console.log(retrievedUserDetails);
    return new Promise((resolve, reject) => {
      passwordLib.comparePassword(req.body.password, retrievedUserDetails.password, (err, isMatch) => {
        if (err) {
          logger.error(err.message, 'userController: validatePassword()', 10);
          let apiResponse = response.generate(true, 'Login Failed', 500, null);
          reject(apiResponse);
        } else if (isMatch) {
          let retrievedUserDetailsObj = retrievedUserDetails.toObject();
          delete retrievedUserDetailsObj.password
          delete retrievedUserDetailsObj._id
          delete retrievedUserDetailsObj.__v
          delete retrievedUserDetailsObj.createdOn
          delete retrievedUserDetailsObj.modifiedOn
          // Deteleting unnecessat data then resolving it
          resolve(retrievedUserDetailsObj)
        } else {
          logger.info('Login Failed Due To Invalid Password', 'userController: validatePassword()', 10);
          let apiResponse = response.generate(true, 'Wrong Password.Login Failed', 400, null);
          reject(apiResponse);
        }
      })
    })
  }

  // generate Token
  // let generateToken = (userDetails) => {
  //   return new Promise((resolve, reject) => {
  //     token.generateToken(userDetails, (err, tokenDetails) => {
  //       if (err) {
  //         let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
  //         reject(apiResponse)
  //       } else {
  //         tokenDetails.userId = userDetails.userId
  //         tokenDetails.userDetails = userDetails
  //         resolve(tokenDetails)
  //       }
  //     })
  //   })
  // }

  // // Save Token
  // let saveToken = (userDetails) => {
  //   console.log(userDetails);
  //   return new Promise((resolve, reject) => {
  //     AuthModel.findOne({ userId: userDetails.userId }, (err, retrievedTokenDetails) => {
  //       if (err) {
  //         console.log(err.message, 'userController: saveToken', 10)
  //         let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
  //         reject(apiResponse);
  //       } else if (check.isEmpty(retrievedTokenDetails)) {
  //         let newAuthToken = new AuthModel({
  //           userId: userDetails.userId,
  //           authToken: userDetails.authToken,
  //           tokenSecret: userDetails.tokenSecret,
  //           tokenGenerationTime: time.now()
  //         });
  //         newAuthToken.save((err, newTokenDetails) => {
  //           if (err) {
  //             logger.error(err.message, 'userController: saveToken', 10)
  //             let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
  //             reject(apiResponse)
  //           } else {
  //             console.log("eeheheheh" + newTokenDetails);
  //             let responseBody = {
  //               authToken: newTokenDetails.token,
  //               userDetails: tokenDetails.userDetails
  //             }
  //             resolve(responseBody);
  //           }
  //         });
  //       } else {
  //         retrievedTokenDetails.authToken = userDetails.authToken;
  //         retrievedTokenDetails.tokenSecret = userDetails.tokenSecret;
  //         retrievedTokenDetails.tokenGenerationTime = time.now();
  //         retrievedTokenDetails.save((err, newTokenDetails) => {
  //           if (err) {
  //             logger.error(err.message, 'userController: saveToken', 10)
  //             let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
  //             reject(apiResponse)
  //           } else {
  //             let responseBody = {
  //               authToken: newTokenDetails.token,
  //               userDetails: userDetails.userDetails
  //             }
  //             resolve(responseBody)
  //           }
  //         });
  //       }
  //     })
  //   })
  // }

let generateToken = (usersData) =>  {
  return new Promise ((resolve, reject) => {
    let token = md5(usersData.email + time.now());
    usersData.token = token;
    resolve(usersData);
  })
}

  // calling promises
  findUser(req, res)
    .then(validatePassword)
    // .then(generateToken)
    // .then(saveToken)
    .then(generateToken)
    .then((resolve) => {
      let token = resolve.token;
      delete resolve.token;
      let apiResponse = response.generate(false, 'Login Successful', 200, resolve);

      var query = {'token': token };
      UserModel.findOneAndUpdate({ email: resolve.email }, {'token': token }, {upsert: true}, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          console.log(data);
        }
      }, {useFindAndModify: false});

      res.status(200)
      res.header('token', token);
      res.send(apiResponse)
    })
    .catch((err) => {
      // console.log("Login Function errorhandler");
      // console.log(err);
      res.status(err.status)
      res.send(err)
    })
}
// end of the login function

// Start logout function
let logout = (req, res) => { }
// end of the logout function.


module.exports = {
  signUpFunction: signUpFunction,
  loginFunction: loginFunction,
  logout: logout
}// end exports
