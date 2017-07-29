require('dotenv').config()

export default {
	logPath: process.env.LOG_PATH,

	bufferMB: process.env.UPDATE_ON_REMAINING_MB,

	tplink: {
		host: process.env.TPLINK_HOST,
		password: process.env.TPLINK_PASSWORD,
	},

	t2: {
		baseURL: process.env.T2_BASE_URL,
		username: process.env.T2_USERNAME,
		password: process.env.T2_PASSWORD,
	},
}
