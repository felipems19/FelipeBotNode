const { ActivityTypes, InputHints } = require('botbuilder')
const { MessageFactory } = require('botbuilder-core')
const log = require('loglevel')

class TurnError {
  constructor(accessors, telemetryClient, logException) {
    if (!accessors) throw new Error("[TurnError]: Missing parameter 'accessors' is required")
    this.accessors = accessors

    if (!telemetryClient)
      throw new Error("[TurnError]: Missing parameter 'telemetryClient' is required")
    this.telemetryClient = telemetryClient

    if (!logException) throw new Error("[TurnError]: Missing parameter 'logException' is required")
    this.logException = logException
  }

  onTurnErrorHandler = async (context, turnError) => {
    try {
      log.error('Error detected via [onTurnError]. Additional description: \n', turnError)

      try {
        // TODO: remove below comment once logException is configured
        // await this.logException.telemetryClientException(context, botAnswer, turnError)
      } catch (error) {
        log.error('Error occurred when trying to create event tracking on logException.js: ', error)
      }

      const onTurnErrorMessage = 'The bot encountered an error or bug.'
      const onTurnErrorMessageTwo = 'To continue to run this bot, please fix the bot source code.'

      await context.sendActivities([
        { type: ActivityTypes.Typing },
        { type: 'delay', value: 1000 },
        MessageFactory.text(onTurnErrorMessage, onTurnErrorMessage, InputHints.IgnoringInput),
        { type: ActivityTypes.Typing },
        { type: 'delay', value: 1000 },
        MessageFactory.text(
          onTurnErrorMessageTwo,
          onTurnErrorMessageTwo,
          InputHints.ExpectingInput
        ),
      ])

      // Clear out state
      await this.accessors.conversationState.delete(context)
      return this.accessors.conversationState.saveChanges(context)
    } catch (error) {
      return log.error(
        'Error when trying to do turnError tasks, which includes cancelling all dialogs from turnError. Additional description: ',
        error
      )
    }
  }
}

module.exports.TurnError = TurnError
