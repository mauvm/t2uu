import request from 'request-promise'
import log from './log'

export default class TPLINK {
	constructor (options) {
		this.options = options
		this.separator = '\r\n'
	}

	call (body) {
		body = (Array.isArray(body) ? body.join(this.separator) : body) + this.separator
		let token = new Buffer(this.options.password).toString('base64')

		return request({
			url: `http://${this.options.host}/cgi`,
			headers: {
				'Content-Type': 'text/plain',
				'Cookie': `Authorization=Basic ${token}`,
			},
			body,
		}).then((data) => {
			if (data === '[error]0') return
			throw new Error('Error response: ' + data)
		})
	}

	async requestExtraGB () {
		log.info({ type: 'tplink' }, 'request-extra-gb')

		return this.call([
			'[LTE_SMS_SENDNEWMSG#0,0,0,0,0,0#0,0,0,0,0,0]0,3',
			'index=1',
			'to=1280',
			'textContent=NOG 1GB',
		])
	}
}
