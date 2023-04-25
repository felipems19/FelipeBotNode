/**
 * @typedef {import('restify').Server} Server
 * @typedef {import('botbuilder').CloudAdapter} CloudAdapter
 * @typedef {import('../bots/sampleBot').SampleBot} SampleBot
 * @param {Server} server
 * @param {CloudAdapter} adapter
 * @param {SampleBot} bot
 * @param {String} envTimeoutBotActivated
 */

module.exports = (server, adapter, bot, envTimeoutBotActivated) => {
  server.post('/api/messages', async (req, res) => {
    // In order to activate the bot framework default bot timeout, set the environment variable envTimeoutBotActivated to true. Otherwise, false.
    if (envTimeoutBotActivated === 'true') {
      adapter.process(req, res, bot.run.bind(bot))
    } else {
      adapter.process(req, res, async (turnContext) => {
        res.send(200)
        await bot.run(turnContext)
      })
    }
  })
}
