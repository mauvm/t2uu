import { CronJob } from 'cron'
import T2 from './T2'
import TPLINK from './TPLINK'
import config from './config'
import log from './log'

const t2 = new T2(config.t2)
const tplink = new TPLINK(config.tplink)

async function check () {
	log.debug({ type: 'check' }, 'starting')

	try {
		const { used, total } = await t2.usage()
		log.info({ type: 'check', used, total }, 'usage')
		if (used > total - config.bufferMB) await tplink.requestExtraGB()
	} catch (err) {
		log.error({ type: 'check' }, err)
	}
}

new CronJob('17 */10 * * * *', check, null, true, 'Europe/Amsterdam')
log.info({ type: 'status' }, 'started')
check()
