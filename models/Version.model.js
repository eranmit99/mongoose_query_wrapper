'use strict';
const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

module.exports = (modelName) => {

    let Schema = mongoose.Schema;

    let versionSchema = new Schema({
        timestamp: {
            type: Date,
            required: true
        },
        customer_id: {
            type: Number,
            required: false
        },
        customer_name: {
            type: String,
            required: false
        },
        user_name: {
            type: String,
            required: false
        },
        event_type: {
            type: String,
            enum: ['add', 'edit', 'delete']
        },
        object_id: {
            type: String
        },
        object_owner_id: {
            type: Number,
            required: false
        },
        object_name: {
            type: String
        },
        object_type: {
            type: String
        },
        data: {
            type: Schema.Types.Mixed,
            required: false
        },
        diff: {
            type: Schema.Types.Mixed,
            required: false
        }
    });

    versionSchema.plugin(autoIncrement.plugin, {model: modelName, field: 'transaction_id'});

    return mongoose.model(modelName, versionSchema);
};

