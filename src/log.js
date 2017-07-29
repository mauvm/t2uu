import path from 'path'
import bunyan from 'bunyan'
import config from './config'

const log = bunyan.createLogger({
	name: 't2uu',
	streams: [{
		level: 'trace',
		path: path.resolve(config.logPath),
	}],
})

export default log
