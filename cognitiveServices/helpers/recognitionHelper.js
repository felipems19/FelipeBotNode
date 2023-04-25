/* eslint-disable no-underscore-dangle */
const { WaterfallStepContext } = require('botbuilder-dialogs')
const { SampleBotLuisRecognizer } = require('..')
const { LanguageRecognition } = require('../index')
const { Accessors } = require('../../statePropertyAccessors/accessors')

class RecognitionHelper {
  /**
   * @param {SampleBotLuisRecognizer} luisRecognizer
   * @param {Accessors} accessors
   */
  constructor(luisRecognizer, luisThreshold, accessors) {
    if (!luisRecognizer)
      throw new Error("[RecognitionHelper]: Missing parameter 'luisRecognizer' is required")
    this.luisRecognizer = luisRecognizer

    if (!luisThreshold)
      throw new Error("[RecognitionHelper]: Missing parameter 'luisThreshold' is required")
    this.luisThreshold = luisThreshold

    if (!accessors)
      throw new Error("[RecognitionHelper]: Missing parameter 'accessors' is required")
    this.accessors = accessors
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async generateLanguageRecognition(stepContext) {
    try {
      const recognitionResult = await this.luisRecognizer.executeLuisQuery({ stepContext })
      return new LanguageRecognition(recognitionResult, this.luisThreshold)
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error occured when executing generateLanguageRecognition from recognizedHelper.js'
      throw error
    }
  }

  /**
   * @param {LanguageRecognition} languageRecognition
   * @param {WaterfallStepContext} stepContext
   */
  async saveLanguageRecognition(languageRecognition, stepContext) {
    try {
      const conversationData = await this.accessors.conversationData.get(stepContext.context, {})
      conversationData.languageRecognition = languageRecognition
      await this.accessors.conversationData.set(stepContext.context, conversationData)
      return
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error occured when executing saveLanguageRecognition from recognizedHelper.js'
      throw error
    }
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async getSavedLanguageRecognition(stepContext) {
    try {
      const conversationData = await this.accessors.conversationData.get(stepContext.context, {})
      return conversationData.languageRecognition
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error occured when executing getSavedLanguageRecognition from recognizedHelper.js'
      throw error
    }
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async getLanguageRecognition(stepContext) {
    try {
      let languageRecognition = await this.getSavedLanguageRecognition(stepContext)
      if (!languageRecognition) {
        languageRecognition = this.generateLanguageRecognition(stepContext)
      }
      return languageRecognition
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error occured when executing getLanguageRecognition from recognizedHelper.js'
      throw error
    }
  }
}

module.exports.RecognitionHelper = RecognitionHelper
