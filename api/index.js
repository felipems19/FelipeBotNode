const messages = require('./messages')
const upgrade = require('./upgrade')

/**
 * @typedef {import('restify').Server} Server
 * @typedef {import('botbuilder').CloudAdapter} CloudAdapter
 * @typedef {import('../bots/sampleBot').SampleBot} SampleBot
 * @typedef {import('botbuilder').ConfigurationBotFrameworkAuthentication} ConfigurationBotFrameworkAuthentication
 * @typedef {import('../helpers').TurnError} TurnError
 * @param {Server} server
 * @param {CloudAdapter} adapter
 * @param {SampleBot} bot
 * @param {ConfigurationBotFrameworkAuthentication} botFrameworkAuthentication
 * @param {TurnError} turnError
 * @param {String} envTimeoutBotActivated
 */
const createRoutes = (
  server,
  adapter,
  bot,
  botFrameworkAuthentication,
  turnError,
  envTimeoutBotActivated
) => {
  messages(server, adapter, bot, envTimeoutBotActivated)
  upgrade(server, bot, botFrameworkAuthentication, turnError)
  return server
}

module.exports = {
  createRoutes,
}
