const config = require('../config');
const Logging = require('backend-kit').Logging;
      Logging.configure(config);

module.exports = Logging;