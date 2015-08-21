"use strict";

var request = require("request");
var fs = require("fs");

var config = {
  writeToFile: false
};

/**
 * Constructor
 * defaults: list of options to override the config object
 **/
var RUG = function (defaults) {
  //constructor
  this.API_URL = "randomuser.me/api";
  this.LOGGER = true;

  if (defaults && defaults.writeToFile !== undefined) {
    config.writeToFile = defaults.writeToFile;
  }
};

/**
 * getOne
 * This function will return a single user
 * cb: A callback function that is called when the function is done
 * The parameter of the function is the single user object
 **/
RUG.prototype.getOne = function (options, cb) {
  //If there is no options, cb is the first param
  if (cb === undefined && typeof options === "function") {
    cb = options;
    options = {};
  }

  this.log("Intiating getOne() function");

  this.getMany(1, options, function (users) {
    cb(users[0]);
  });

  return;
};

/**
 * getMany
 * This function returns a group of users
 * howMany: A number indicating the number of users in the array
 * cb: A callback function that is called when the function is done
 * The parameter of the function is an array of users
 **/
RUG.prototype.getMany = function (howMany, options, cb) {
  //If there is no options, cb is the first param
  if (cb === undefined && typeof options === "function") {
    cb = options;
    options = {};
  }

  if (typeof howMany !== "number") {
    throw "The first parameter of getMany() should be a number";
  }

  this.log("Intiating getMany() function");
  var self = this;

  request.get("http://" + this.API_URL + "?results=" + howMany, function (error, response, body) {
    if (error) {
      throw "Could not reach server";
    }

    self.log("Got a valid response");

    body = JSON.parse(body);

    //If the API is down, it send an object with an error property
    if (body.error) {
      throw body.error;
    }

    var users = [];

    for (var i = 0; i < howMany; i++) {
      //Transform users
      var newUser = {};
      if (options && options.fields) {
        //Only specific fields
        for (var j = 0; j < options.fields.length; j++) {
          var field = options.fields[j];
          newUser[field] = (body.results[i].user[field]) ? body.results[i].user[field] : undefined;
        }
      } else {
        newUser = body.results[i].user;
      }

      //Then push it
      users.push(newUser);
    }

    //TODO Fix this code smell
    if (config.writeToFile) {
      self.outputToFile(users, function () {
        cb(users);
      });
    } else {
      cb(users);
    }
  });

  return;
};

/**
 * log
 * A simple and naive console logger
 * text: The text to be logged
 **/
RUG.prototype.log = function (text) {
  if (this.LOGGER) {
    console.log(text);
  }

  return true;
};

/**
 * outputToFile
 * This function outputs data to a filename that is specified in the config.writeToFile
 * data: Data to write to file
 * cb: The callback function
 **/
RUG.prototype.outputToFile = function (data, cb) {
  var filename = config.writeToFile || "output.txt";

  this.log("Outputting to file " + config.writeToFile);

  fs.writeFile(filename, JSON.stringify(data), function (err) {
    if (err) {
      throw err;
    }

    cb(data);
  }); 
};

export default RUG;