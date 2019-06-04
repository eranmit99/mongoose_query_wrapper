/**
 * Created by eran.mitrani on 8/15/2016.
 */
'use strict';
const _ = require('lodash');
const qs = require('koa-qs');
const deepDiff = require('deep-diff');
const config = require('../config');
const QueryBuilder = require('../utils/queryBuilder');
const modelFactory = require('../utils/modelsFactory');
const graylog = require('../utils/graylogWriter');
const diff = require('../utils/diff');

class Version {

    // log entity version in mongo
    static *logVersion() {
        let versionData = this.request.body,
            tenantName = _.get(this.request.body, 'dbName'),
            model,
            VersionModel;
        /*
         * we need the tenant name in order to create a
         * new collection(mongoose model) per tenant
         */
        if (!tenantName) {
            this.throw('Missing a valid tenant name', 500);
        }

        VersionModel = modelFactory.getModel(tenantName, 'Version');

        versionData.timestamp = new Date();

        if (versionData.event_type === 'delete') {
            /*
             *  since we don't have relevant data on deleted records
             *  fetch the data from the last recorded
             *  entity in the application
             */
            let query = VersionModel
                .findOne({
                    object_id: versionData.object_id,
                    timestamp: {$lt: versionData.timestamp}
                })
                .sort({timestamp: -1})
                .select('data object_name');

            let objectData = yield query.exec();

            versionData.object_name = objectData.object_name;
            versionData.data = objectData.data;
        }

        // Compare to the last object and compare
        let recordsQuery = new QueryBuilder(VersionModel);

        try {
            let prevObj = yield recordsQuery
                .setParams({
                    where: [{
                        field: "object_type",
                        operator: "equals",
                        value: versionData.object_type
                    }, {
                        field: "object_id",
                        operator: "equals",
                        value: versionData.object_id,
                    }]
                })
                .exec();

            if (prevObj.length) {
                const prevData = _.last(prevObj).data;
                versionData.diff = diff.processDiff(versionData.data, prevData)
            }
        } catch (e) {
            console.error("could not get the changes obj", e)
        }

        // create a new schema.js according to model data
        model = new VersionModel(versionData);
        try {
            // save version into mongo
            yield model.save();
            // send same data to graylog (UDP)
            graylog.save(model, tenantName);
            this.body = 'success';
        }
        catch (e) {
            this.throw(e, 500);
        }
    }

    // get the saved versions from mongo according to mongo params
    static *getVersion() {
        let params = this.query,
            resObject = {},
            customerSelector,
            tenantName = _.get(params, 'dbName'),
            VersionModel;

        /*
         * we need the tenant name in order to create a
         * new collection(mongoose model) per tenant
         */
        if (!tenantName) {
            this.throw('Missing a valid tenant name', 500);
        }

        VersionModel = modelFactory.getModel(tenantName, 'Version');

        //return audits relevant only to customer id or system id
        if (params.customer_id || params.customers) {
            let customers;
            if (params.customers && _.isArray(params.customers)) {
                customers = params.customers;
            } else if (params.customer_id && !isNaN(params.customer_id)) {
                customers = [config.systemCustomerId, parseInt(params.customer_id)]
            } else {
                this.throw('Invalid customer id', 500);
            }

            if (!params.customer_id && isNaN(params.customer_id)) {
                this.throw('Invalid customer id', 500);
            }
            if (parseInt(params.customer_id) !== config.systemCustomerId) {

                customerSelector = {
                    field: "object_owner_id",
                    operator: "in",
                    value: customers
                };

                // insert the params in the where query
                if (!params.where) {
                    params.where = [];
                }

                params.where.push(customerSelector);
            }
        }


        // count all data rows
        if (params.count) {
            let countQuery = new QueryBuilder(VersionModel);
            try {
                resObject.count = yield countQuery
                    .setParams({count: true})
                    .exec();
            }
            catch(e) {
                this.throw(`Error fetching version count data: ${e}`, 500);
            }
        }

        // count all filtered data rows
        if ((params.find || (params.where && params.where.length) > 0) && params.count) {
            let filteredCountQuery = new QueryBuilder(VersionModel);
            try {
                resObject.filteredCount = yield filteredCountQuery
                    .setParams(_.omit(params, ['limit', 'skip']))
                    .exec();
            }
            catch(e) {
                this.throw(`Error fetching version count filtered data: ${e}`, 500);
            }
        }

        // get all data according
        let recordsQuery = new QueryBuilder(VersionModel);
        try {
            resObject.records = yield recordsQuery
                .setParams(_.omit(params, ['count']))
                .exec();
        }
        catch(e) {
            this.throw(`Error fetching version data rows: ${e}`, 500);
        }
        //return the queried data
        this.body = resObject;
    }

    // gets a time stamp and saves it for version labeling
    static *addVersionLabel() {

        let labelData = this.request.body,
            tenantName = _.get(labelData, 'dbName'),
            VersionLabelModel,
            model;

        if (!tenantName) {
            this.throw('Missing a valid tenant name', 500);
        }

        VersionLabelModel = modelFactory.getModel(tenantName, 'VersionLabel');
        model = new VersionLabelModel(labelData);

        try {
            // send information to mongo
            yield model.save();
            // send same data to graylog (UDP)
            graylog.save(model, tenantName);
            //set action response
            this.body = 'success';
        }
        catch(e) {
            this.throw(`Error saving label data: ${e}`, 500);
        }
    }

    // get the difference between two objects
    static* compareVersions() {

        let params = this.request.body;
        let obj1Query = _.get(params, 'obj1Query');
        let obj2Query = _.get(params, 'obj2Query');
        let tenantName = _.get(params, 'tenantName');

        /*
         * we need the tenant name in order to create a
         * new collection(mongoose model) per tenant
         */
        if (!tenantName) {
            this.throw('Missing a valid tenant name', 500);
        }

        let VersionModel = modelFactory.getModel(tenantName, 'Version');
        let recordsQuery = new QueryBuilder(VersionModel);

        try {
            // fetch the objects according to the provided query
            let obj1 = yield recordsQuery
                .setParams(obj1Query)
                .exec();

            let obj2 = yield recordsQuery
                .setParams(obj2Query)
                .exec();

            this.body =  {
                changeDate: _.get(obj2, '[0].timestamp'),
                userName: _.get(obj2, '[0].user_name'),
                diff: deepDiff(_.get(obj1, '[0].data'), _.get(obj2, '[0].data'))
            }



        }
        catch (e) {
            this.throw(`Error comparing versions: ${e}`, 500);
        }
    }
}

module.exports = Version;