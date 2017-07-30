import _ from 'lodash'
import requestPromise from 'request-promise'
import cheerio from 'cheerio'
import urlResolver from 'url'
import log from './log'

function parseForm (res) {
	let $ = cheerio.load(res.body)
	let $form = $('form').first()

	if ($form.length === 0) {
		throw new Error(`No form found (status code ${res.statusCode})!`)
	}

	let url = $form.attr('action')
	let form = {}

	$form.find('input').each(function () {
		form[$(this).attr('name')] = $(this).attr('value')
	})

	if (url.startsWith('/') || url.startsWith('.')) {
		url = urlResolver.resolve(res.request.uri.href, url)
	}

	return { url, form }
}

function submitResponseForm (request, res, customFields = {}) {
	var { url, form } = parseForm(res)
	Object.assign(form, customFields)

	return request({
		url,
		method: 'POST',
		form,
		resolveWithFullResponse: true,
		simple: false,
		followAllRedirects: true,
	})
}

export default class T2 {
	constructor (options) {
		this.options = options
		this.session = {}
	}

	get baseURL () {
		return this.options.baseURL
	}

	async sessionID () {
		if ( ! this.session.id) await this.login()
		return this.session.id
	}
	async service () {
		if ( ! this.session.service) await this.login()
		return this.session.service
	}
	async resource () {
		if ( ! this.session.resource) await this.login()
		return this.session.resource
	}

	async login () {
		log.info({ type: 't2' }, 'login')

		const baseURL = this.baseURL
		const { username, password } = this.options

		const jar = requestPromise.jar()
		const request = requestPromise.defaults({
			headers: {
				'DNT': '1',
				'User-Agent': [
					'Mozzarella/2.0',
					'(X11; Linux x86_64)',
					'AppleBandit/537.36',
					'(KPOPHTML, like Wacko)',
					'Cr/24.Ar.3d5.4s1',
					'WildLifeSpotting/101',
				].join(' '),
			},
			jar,
		})

		var res = await request({
			url: `${baseURL}/4G/login.html`,
			resolveWithFullResponse: true,
		})
		res = await submitResponseForm(request, res)
		res = await submitResponseForm(request, res, { username, password, action: '' })
		res = await submitResponseForm(request, res)
		await submitResponseForm(request, res)

		let id = _.find(jar._jar.serializeSync().cookies, ({ key, domain }) => {
			return key === 'JSESSIONID' && domain === baseURL.match(/\/\/(.+?)\//)[1]
		}).value

		// Must be fetched in order to prevent following error when fetching usage:
		// 404 Not Found; No bundles found for the identifier ''
		await request({ url: `${baseURL}/4G/getSsoCustomer.do`, json: true })

		// TODO: Improve determining the correct service and resource.
		let services = await request({ url: `${baseURL}/4G/V4g/users/SELF/services`, json: true })
		let service = services[0].link

		let resources = await request({ url: `${baseURL}/4G/V4g/${service}/resources`, json: true })
		let resource = resources[0].identifier

		this.session = { id, service, resource }
	}
	clearSession () {
		this.session = {}
	}

	async usage (retry = true) {
		const service = await this.service()
		const resource = await this.resource()

		try {
			const usages = await requestPromise({
				url: `${this.baseURL}/4G/V4g/services/${service}/usage`,
				qs: {
					resource,
					level: '1',
					d: new Date().toString(),
				},
				json: true,
			})
			const usage = _.find(_.get(usages, '[0].bundles', []), (usage) => usage.unit === 'UNLIMITED_DATA')

			if ( ! usage) throw new Error('Missing UNLIMITED_DATA bundle.')

			return {
				used: usage.used,
				used_percent: usage.used_percent / 100,
				remaining: usage.remaining,
				total: usage.start,
			}
		} catch (err) {
			// Retry with new session
			if (retry) {
				this.clearSession()
				return await this.usage(false)
			}

			throw err
		}
	}
}
