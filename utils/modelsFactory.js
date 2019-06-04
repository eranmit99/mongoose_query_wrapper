'use strict';
const _ = require('lodash');
const models = require('../models');

class ModelFactory {

    constructor() {
        // initialize all models
        this._currentSchemas = models();

        //save all created mongoose models
        this._curretModels = {};
    }

    // create the model name according to the tenant and schema
    _getModelName(tenant, schemaName) {
        return `${tenant}_${schemaName}`;
    }
    
    // create a new model
    _createModel(tenant, schemaName) {
        let modelName = this._getModelName(tenant, schemaName);

        this._curretModels[modelName] = this._currentSchemas[schemaName](modelName);
    }

    getModel(tenant, schemaName) {
        let modelName = this._getModelName(tenant, schemaName);

        //if the mongoose tenant model was not registered, create a new one
        if (!this._curretModels[modelName]) {
            this._createModel(tenant, schemaName);
        }
        // return the tenant model
        return this._curretModels[modelName];
    };
}

module.exports = new ModelFactory();