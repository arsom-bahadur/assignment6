/********************************************************************************* 

WEB322 – Assignment 02 
I declare that this assignment is my own work in accordance with Seneca
Academic Policy.  No part of this assignment has been copied manually or 
electronically from any other source (including 3rd party web sites) or 
distributed to other students. I acknoledge that violation of this policy
to any degree results in a ZERO for this assignment and possible failure of
the course. 

Name: Ashis Roka Som Bahadur
Student ID: 135377216
Date: 2023/08/12
Cyclic Web App URL: https://tiny-gray-sawfish-robe.cyclic.app
GitHub Repository URL: https://github.com/arsom-bahadur/assignment6

********************************************************************************/

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs"); // Step 2: Import bcrypt module

const userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String, // This will be the hashed password
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

let User;

module.exports = {
  initialize: function () {
    return new Promise(function (resolve, reject) {
      let db = mongoose.createConnection(
        `mongodb+srv://kneerose02:nppro456@senecaweb.lvjfvlg.mongodb.net/`,
        { useNewUrlParser: true, useUnifiedTopology: true }
      );

      db.on("error", (err) => {
        reject(err);
      });
      db.once("open", () => {
        User = db.model("User", userSchema);
        resolve();
      });
    });
  },

  registerUser: function (userData) {
    return new Promise(function (resolve, reject) {
      if (userData.password !== userData.password2) {
        reject("Passwords do not match");
      } else {
        bcrypt
          .hash(userData.password, 10) // Step 3: Hash the password
          .then((hash) => {
            userData.password = hash; // Update the password with the hash
            let newUser = new User(userData);
            newUser.save((err) => {
              if (err) {
                if (err.code === 11000) {
                  reject("User Name already taken");
                } else {
                  reject(`There was an error creating the user: ${err}`);
                }
              } else {
                resolve();
              }
            });
          })
          .catch((err) => {
            reject("There was an error encrypting the password");
          });
      }
    });
  },

  checkUser: function (userData) {
    return new Promise(function (resolve, reject) {
      User.findOne({ userName: userData.userName }) // Use findOne to get a single user
        .then((user) => {
          if (!user) {
            reject(`Unable to find user: ${userData.userName}`);
          } else {
            bcrypt
              .compare(userData.password, user.password) // Compare hashed passwords
              .then((result) => {
                if (result) {
                  user.loginHistory.push({
                    dateTime: new Date().toString(),
                    userAgent: userData.userAgent,
                  });
                  User.updateOne(
                    { userName: user.userName },
                    { $set: { loginHistory: user.loginHistory } }
                  )
                    .then(() => {
                      resolve(user);
                    })
                    .catch((err) => {
                      reject(`There was an error verifying the user: ${err}`);
                    });
                } else {
                  reject(`Incorrect Password for user: ${userData.userName}`);
                }
              })
              .catch((err) => {
                reject(`There was an error verifying the user: ${err}`);
              });
          }
        })
        .catch(() => {
          reject(`Unable to find user: ${userData.userName}`);
        });
    });
  },
};
