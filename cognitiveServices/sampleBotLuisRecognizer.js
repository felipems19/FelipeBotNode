const { TelemetryClient } = require('applicationinsights')
const { LuisRecognizer } = require('botbuilder-ai')
const { WaterfallStepContext } = require('botbuilder-dialogs')
const { Accessors } = require('../statePropertyAccessors')

class SampleBotLuisRecognizer {
  /**
   * @param {Object} config
   * @param {TelemetryClient} telemetryClient
   * @param {Accessors} accessors
   */
  constructor(config, telemetryClient, accessors) {
    if (!config)
      throw new Error("[SampleBotLuisRecognizer]: Missing parameter 'config' is required")
    this.config = config

    if (!telemetryClient)
      throw new Error("[SampleBotLuisRecognizer]: Missing parameter 'telemetryClient' is required")
    this.telemetryClient = telemetryClient

    if (!accessors)
      throw new Error("[SampleBotLuisRecognizer]: Missing parameter 'accessors' is required")
    this.accessors = accessors

    const luisIsConfigured =
      this.config && this.config.applicationId && this.config.endpointKey && this.config.endpoint
    if (luisIsConfigured) {
      const recognizerOptions = {
        apiVersion: 'v3',
        telemetryClient: this.telemetryClient,
        includeAllIntents: true,
      }

      this.recognizer = new LuisRecognizer(this.config, recognizerOptions)
    }
  }

  get isConfigured() {
    return this.recognizer !== undefined
  }

  /**
   * Method responsible for getting luis response
   * @param {{stepContext: WaterfallStepContext, userMessage: String}} parameters
   * @remarks Descritivo:
   *
   * - stepContext: bot step context
   * - userMessage: (optional) a message being sent instead of a stepContext object
   *
   * @returns a luis response
   */
  /**
   * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
   * @param {WaterfallStepContext} stepContext
   */
  async executeLuisQuery(parameters) {
    const { stepContext, userMessage } = parameters

    if (!stepContext)
      throw new Error(
        "[SampleBotLuisRecognizer-executeLuisQuery]: Missing parameter 'stepContext' is required"
      )
    if (!this.recognizer)
      throw new Error('[SampleBotLuisRecognizer-executeLuisQuery]: Luis configuration not set!')

    try {
      let response = {}
      if (userMessage !== undefined) response = await this.recognizer.recognize(userMessage)
      else response = await this.recognizer.recognize(stepContext.context)

      return response
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error occurred when trying to make a call in LUIS from sampleBotLuisRecognizer.js'
      throw error
    }
  }
}

module.exports.SampleBotLuisRecognizer = SampleBotLuisRecognizer
