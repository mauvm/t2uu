import { CronJob } from 'cron'
import T2 from './T2'
import TPLINK from './TPLINK'
import config from './config'
import log from './log'

const t2 = new T2(config.t2)
const tplink = new TPLINK(config.tplink)

async function check () {
	log.debug({ type: 'status' }, 'checking')
	const { used, total } = await t2.usage()
	if (used > total - config.bufferMB) await tplink.requestExtraGB()
}

new CronJob('17 */10 * * * *', check, null, true, 'Europe/Amsterdam')
log.info({ type: 'status' }, 'started')
