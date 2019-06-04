const _ = require('lodash');

/**
 * Created by eran.mitrani on 8/15/2016.
 *
 * usage example:
 * {
 *    find: [{object_id: "00000"}, {object_name: "tester"}],
 *    select: "object_id,object_type,object_name",
 *    where: [{
 *      field: "object_type",
 *      operator: "equals",
 *      value: "Feeds"
 *    }],
 *    limit: 10,
 *    skip: 5,
 *    sort: { object_id : "desc" }
 * }
 */

class QueryBuilder {

    constructor(schema) {
        this._schema = schema;
        this._chain = {};

        /*
         * @predicate:[{ field name: string }]
         *
         */
        this._chain.setFind = (predicate) => {
            if (predicate.find) {
                let condition = predicate.find;
                _.each(condition, (item)=> {
                    _.forOwn(item, (value, key) => {
                        item[key] = new RegExp(value, 'i');
                    });
                });
                if (condition.length > 1) {
                    this._schema = this._schema.find({$or: condition});
                }
                if (condition.length === 1) {
                    this._schema = this._schema.find(condition[0]);
                }
            } else {
                this._schema = this._schema.find();
            }
        };
        /*
         * @predicate:[{
         *    field: string,
         *    operator: equals|in|lt|gt,
         *    value: string | number
         * }]
         *
         */
        this._chain.setWhere = (predicate) => {
            if (predicate.where) {
                let condition = predicate.where;
                _.each(condition, (item) => {
                    let {field, operator, value}= item;
                    if (operator.toLowerCase() === "in") {
                        value = _.values(value);
                    }
                    this._schema = this._schema.where(field)[operator](value);
                });
            }
        };
        /*
         * @predicate: number
         *
         */
        this._chain.setLimit = (predicate) => {
            if (predicate.limit) {
                let condition = parseInt(predicate.limit);
                this._schema = this._schema.limit(condition);
            }
        };
        /*
         * @predicate: number
         *
         */
        this._chain.setSkip = (predicate) => {
            if (predicate.skip) {
                let condition = parseInt(predicate.skip);
                this._schema = this._schema.skip(condition);
            }
        };
        /*
         * @predicate: string
         *
         */
        this._chain.setSort = (predicate) => {
            if (predicate.sort) {
                let sortVal = {};

                if (typeof predicate.sort === 'string') {
                    sortVal = predicate.sort;
                } else {
                    _.forOwn(predicate.sort, (value, key) => {
                        sortVal[key] = value === 'desc' ? -1 : 1;
                    });
                }
                this._schema = this._schema.sort(sortVal);
            }
        };
        /*
         * @predicate: string
         *
         */
        this._chain.setSelect = (predicate) => {
            if (predicate.select) {
                let condition = predicate.select
                    .toString()
                    .replace(",", " ");
                this._schema = this._schema.select(condition);
            }
        };

        /*
         * @predicate: boolean
         *
         */
        this._chain.setCount = (predicate) => {
            if (predicate.count) {
                this._schema = this._schema.count();
            }
        }
    }
    setParams(options) {
        _.forOwn(this._chain, (generator) => {
            generator(options);
        });
        return this._schema;
    }
    exec(){
      return this._schema.exec();
    }
}

module.exports = QueryBuilder;