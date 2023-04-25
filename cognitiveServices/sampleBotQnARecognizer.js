const { TelemetryClient } = require('applicationinsights')
const { QnAMaker } = require('botbuilder-ai')
const { WaterfallStepContext } = require('botbuilder-dialogs')
const { Accessors } = require('../statePropertyAccessors')

class SampleBotQnARecognizer {
  /**
   * @param {Object} qnaConfig
   * @param {TelemetryClient} telemetryClient
   * @param {Accessors} accessors
   * @param {Number} cogServicesTimeout
   * @param {Number} qnaThreshold
   */
  constructor(qnaConfig, telemetryClient, accessors) {
    if (!qnaConfig)
      throw new Error("[SampleBotQnARecognizer]: Missing parameter 'qnaConfig' is required")
    this.qnaConfig = qnaConfig

    if (!telemetryClient)
      throw new Error("[SampleBotQnARecognizer]: Missing parameter 'telemetryClient' is required")
    this.telemetryClient = telemetryClient

    if (!accessors)
      throw new Error("[SampleBotQnARecognizer]: Missing parameter 'accessors' is required")
    this.accessors = accessors

    const qnAIsConfigured =
      this.qnaConfig &&
      this.qnaConfig.knowledgeBaseId &&
      this.qnaConfig.endpointKey &&
      this.qnaConfig.host &&
      this.qnaConfig.timeout &&
      this.qnaConfig.threshold
    if (qnAIsConfigured) this.qnaRecognizer = new QnAMaker(this.qnaConfig)
  }

  get isConfigured() {
    return this.qnaRecognizer !== undefined
  }

  /**
   * Returns an object with preformatted QnA results for the bot's dialogs to consume.
   * @param {WaterfallStepContext} stepContext
   */
  async executeQnAQuery(stepContext) {
    try {
      const response = await this.qnaRecognizer.getAnswers(stepContext.context, {
        timeout: this.qnaConfig.timeout,
        scoreThreshold: this.qnaConfig.threshold,
      })

      return response
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error occurred when trying to make a call in QnaMaker from sampleBotQnARecognizer.js'
      throw error
    }
  }
}

module.exports.SampleBotQnARecognizer = SampleBotQnARecognizer
