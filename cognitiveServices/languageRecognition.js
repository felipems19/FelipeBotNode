const { LuisRecognizer } = require('botbuilder-ai')
const { intents } = require('../config')

class LanguageRecognition {
  /**
   * @param {Object} recognitionResult
   * @param {Number} luisThreshold
   */
  constructor(recognitionResult, luisThreshold) {
    if (!recognitionResult)
      throw new Error("[LanguageRecognition]: Missing parameter 'recognitionResult' is required")
    this.recognitionResult = recognitionResult

    if (!luisThreshold)
      throw new Error("[LanguageRecognition]: Missing parameter 'luisThreshold' is required")
    this.luisThreshold = luisThreshold
  }

  get result() {
    return this.recognitionResult
  }

  get topIntent() {
    return LuisRecognizer.topIntent(this.recognitionResult, intents.none, this.luisThreshold)
  }

  get entities() {
    return this.recognitionResult.entities
  }

  get intents() {
    return this.recognitionResult.intents
  }

  get sortedIntents() {
    return LuisRecognizer.sortedIntents(this.recognitionResult)
  }

  getListEntityValue(listEntity) {
    return this.recognitionResult.entities[listEntity][0][0]
  }

  doesntHavetopIntent() {
    const sortedIntents = LuisRecognizer.sortedIntents(this.recognitionResult, this.luisThreshold)
    return !(sortedIntents.length > 0)
  }

  doesntHavetopIntentBesides(exceptionIntent) {
    const sortedIntents = LuisRecognizer.sortedIntents(this.recognitionResult, this.luisThreshold)
    if (sortedIntents.length === 0) return true
    // doesntHaveTopIntent
    if (sortedIntents.length === 1) {
      // just one intent found
      if (sortedIntents.some((values) => values.intent.includes(exceptionIntent))) return true
      // if intent found was exception, return true
      return false
    }
    return false // meaning that a top intent other than the exception was found
  }

  hasIntentAboveThreshold(intent) {
    const intentsAboveThreshold = LuisRecognizer.sortedIntents(
      this.recognitionResult,
      this.luisThreshold
    )
    return intentsAboveThreshold.some((value) => value.intent === intent)
  }

  hasTopIntent(...intentList) {
    return intentList.includes(this.topIntent)
  }

  hasEntity(...entityList) {
    const names = Object.keys(this.entities)
    return entityList.some((v) => names.includes(v))
  }

  hasOnlyEntity(entity) {
    const names = Object.keys(this.entities)
    if (names.length === 2 && names[0] === entity) return true
    return false
  }
}

module.exports.LanguageRecognition = LanguageRecognition
