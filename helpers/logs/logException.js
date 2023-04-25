const { TurnContext, Severity } = require('botbuilder-core')

class LogException {
  constructor(telemetryClient, accessors) {
    if (!telemetryClient)
      throw new Error("[LogException]: Missing parameter 'telemetryClient' is required")
    this.telemetryClient = telemetryClient

    if (!accessors) throw new Error("[LogException]: Missing parameter 'accessors' is required")
    this.accessors = accessors
  }

  /**
   * @param {TurnContext} context
   * @param {String} botAnswer
   * @param {Object} turnError
   */
  async telemetryClientException(context, botAnswer, turnError) {
    try {
      if (!context || !botAnswer || !turnError) {
        throw new Error('Wrong parameters on trackException')
      }
      const userData = await this.accessors.userData.get(context, {})
      return this.telemetryClient.trackEvent({
        name: 'Exception',
        properties: {
          source: 'Bot',
          userId: userData.id,
          userPhoneNumber: userData.phoneNumber,
          conversationId: userData.conversationId,
          channel: userData.channel,
          version: userData && userData.version ? userData.version : null,
          previousDialog: await this.accessors.currentDialog.get(context, ''),
          currentDialog: 'turnError',
          userInput: context.activity.text,
          botAnswer,
          severityLevel: Severity.Critical,
          stackTrace: await this.chosenStack(turnError),
          additionalDescription:
            turnError && turnError.error && turnError.error.additionalDescription
              ? turnError.error.additionalDescription
              : null,
        },
      })
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Occurred when trying to create event tracking on logException.js'
      throw error
    }
  }

  async chosenStack(turnError) {
    try {
      if (turnError && turnError.error && turnError.error.stack) return turnError.error.stack
      if (turnError && turnError.stack) return turnError.stack
      return null
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Occurred when executing chosenStack method from logException.js'
      throw error
    }
  }
}

module.exports.LogException = LogException
