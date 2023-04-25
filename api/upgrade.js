const { CloudAdapter } = require('botbuilder')

/**
 * @typedef {import('restify').Server} Server
 * @typedef {import('../bots/sampleBot').SampleBot} SampleBot
 * @typedef {import('botbuilder').ConfigurationBotFrameworkAuthentication} ConfigurationBotFrameworkAuthentication
 * @typedef {import('../helpers').TurnError} TurnError
 * @param {Server} server
 * @param {SampleBot} bot
 * @param {ConfigurationBotFrameworkAuthentication} botFrameworkAuthentication
 * @param {TurnError} turnError
 */
module.exports = (server, bot, botFrameworkAuthentication, turnError) => {
  server.on('upgrade', async (req, socket, head) => {
    // Create an adapter scoped to this WebSocket connection to allow storing session data.
    const streamingAdapter = new CloudAdapter(botFrameworkAuthentication)

    // Set onTurnError for the CloudAdapter created for each connection.
    streamingAdapter.onTurnError = turnError.onTurnErrorHandler

    streamingAdapter.process(req, socket, head, async (context) => {
      await bot.run(context)
    })
  })
}
