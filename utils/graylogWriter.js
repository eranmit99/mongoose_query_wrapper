const config = require('../config');
const graylogClient = require('gelf-pro');
const GRAYLOG_SERVICE_NAME = "cms_audit"
const SEND_MODE = "udp"
// This is for Graylog, setting level field to INFO,
// to avoid errors when level inserted automatically as number if is not specified
const LEVEL_FIELD_OVERRIDE_VALUE = "INFO"

// The class provides graylog client, and a function to send data
class GraylogWriter {
    constructor() {
        // configure settings for graylog client
        graylogClient.setConfig({
          // those default "fields" will be added for every sent message
          fields: {
              service: GRAYLOG_SERVICE_NAME,
              environment_type: config.environment
          },
          adapterName: SEND_MODE,
          adapterOptions: {
            host: config.graylog.connection,
            port: config.graylog.port
          }
        });
    }

    // send the object as string to Graylog
    save(model, tenantName) {
        // must get only the fields from "model" because there are many other objects and functions there
		let environmentName = this.getEnvironmentName(tenantName)
        let auditData = {
            level: LEVEL_FIELD_OVERRIDE_VALUE,
            rds_name: tenantName,
            customer_env: environmentName,
            user_name: model.user_name,
            customer_id: model.customer_id,
            customer_name: model.customer_name,
            event_type: model.event_type,
            object_id: model.object_id,
            object_owner_id: model.object_owner_id,
            object_name: model.object_name,
            object_type: model.object_type,
			grafana_annotation: model.object_name + " | " + model.object_type + " | " + model.user_name
        }
        // this sends UDP to graylog
        graylogClient.info(JSON.stringify(model.data), auditData)
    }
	
	// cut the last part of "_" separated string, it's the environment name
	getEnvironmentName(tenantName) {
		return tenantName.split("_").slice(-1)[0]
	}
}

module.exports = new GraylogWriter();