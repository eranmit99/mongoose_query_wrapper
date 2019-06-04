'use strict';
const mongoose = require('mongoose');

module.exports = (modelName) => {

    /*
     * version label in the application
     * in order to wrap a group of
     * entities to a single version
     */

    let Schema = mongoose.Schema;

    let versionLabelSchema = new Schema({
        timestamp: {
            type: Date,
            required: true
        },
        descriptions: {
            type: String,
            required: false
        }
    });

    return mongoose.model(modelName, versionLabelSchema);
};

