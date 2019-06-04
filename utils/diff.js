const _ = require('lodash')

class Diff {
    processDiff(data, prevData) {
        const diff = [];
        _.each(data, (val, key) => {
            if (_.isObject(val) && !_.isArray(val)) {
                this._processObj(diff, val, key, data, prevData)
            } else {
                const valueBefore = _.get(prevData, key);
                const valueAfter = _.get(data, key)

                if (!_.isEqual(valueBefore, valueAfter)) {
                    diff.push({
                        path: key,
                        valueAfter,
                        valueBefore
                    })
                }
            }
        })
        // Check if fields were deleted
        _.each(prevData, (val, key) => {
            if(_.isObject(val) && _.isEmpty(data[key])){
                this._processObj(diff,val, key, data, prevData)
            }
            else if (_.isUndefined(data[key])) {
                diff.push({
                    path: key,
                    valueBefore: prevData[key],
                    valueAfter: null,
                });
            }
        });

        return diff;
    }

    _processObj(diffObj, obj, path, data, prevData) {
        _.each(obj, (val, key) => {
            const fullPath = `${path}[${key}]`;
            if (_.isObject(val) && !_.isArray(val)) {
                this._processObj(diffObj, val, fullPath, data, prevData)

            } else {
                const valueBefore = _.get(prevData, fullPath);
                const valueAfter = _.get(data, fullPath)
                if (!_.isEqual(valueBefore, valueAfter)) {
                    diffObj.push({
                        path: fullPath,
                        valueBefore,
                        valueAfter,
                    });
                }
            }
        })

    }
}

module.exports = new Diff();