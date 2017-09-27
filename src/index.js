import { CronJob } from 'cron'
import T2 from './T2'
import TPLINK from './TPLINK'
import config from './config'
import log from './log'

const t2 = new T2(config.t2)
const tplink = new TPLINK(config.tplink)

t2.on('login-attempt', () => log.info({ type: 't2' }, 'login-attempt'))
t2.on('login', () => log.info({ type: 't2', session_id: t2.sessionID() }, 'login'))

async function check () {
	log.debug({ type: 'check' }, 'started')

	try {
		const { used, total, updated_at } = await t2.usage()
		log.info({ type: 'check', used, total, updated_at }, 'usage')

		if (used > total - config.bufferMB) {
			log.info({ type: 'tplink' }, 'request-extra-gb')
			await tplink.requestExtraGB()
		}
	} catch (err) {
		log.error({ type: 'check' }, err)
	}
}

new CronJob('17 */5 * * * *', check, null, true, 'Europe/Amsterdam')
log.info({ type: 'status' }, 'started')
check()
