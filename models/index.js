'use strict';
const fs = require('fs');
const path = require('path');


module.exports = function () {

    // Require all model files in the directory.
    let rModelFile = /\.model\.js$/,
        currentModels = {};

    fs.readdir(__dirname, function (err, files) {
        if (err) {
            throw err;
        }

        files.filter(function (file) {
            return rModelFile.test(file);
        }).forEach(function (file) {
            // set model name according to the file name
            let schemaName = file.split('.')[0];
            currentModels[schemaName] = require(path.join(__dirname, file));
        });
    });

    // return all models in an object
    return currentModels;
};