const { intents, entities, steps, dialogs } = require('../../../config')
const { GenericDisambiguator } = require('../../../helpers/dialogs/genericDisambiguator')
const { LanguageRecognition } = require('../../../cognitiveServices')
const { Accessors } = require('../../../statePropertyAccessors')
const { StringHandler } = require('../../../utils')

class TvPurchaseDisambiguator {
  /**
   * @param {GenericDisambiguator} genericDisambiguator
   * @param {StringHandler} stringHandler
   * @param {Accessors} accessors
   */
  constructor(genericDisambiguator, stringHandler, accessors) {
    if (!genericDisambiguator)
      throw new Error(
        "[TvPurchaseDisambiguator]: Missing parameter 'genericDisambiguator' is required"
      )
    this.genericDisambiguator = genericDisambiguator

    if (!stringHandler)
      throw new Error("[TvPurchaseDisambiguator]: Missing parameter 'stringHandler' is required")
    this.stringHandler = stringHandler

    if (!accessors)
      throw new Error("[TvPurchaseDisambiguator]: Missing parameter 'accessors' is required")
    this.accessors = accessors
  }

  /**
   * Method responsible for identifying user input through typed message
   * @param {LanguageRecognition} languageRecognition
   * @remarks Descritivo:
   *
   * - languageRecognition: object containing recognition results
   *
   * @returns identification object
   */
  async brandResponseHandlerByInputText(languageRecognition) {
    if (!languageRecognition)
      throw new Error(
        "[TvPurchaseDisambiguator-brandResponseHandlerByInputText]: Missing parameter 'languageRecognition' is required"
      )
    try {
      if (languageRecognition.hasEntity(entities.brand)) {
        return {
          inputIdentified: true,
          nextStep: steps.continueWaterFall,
          choice: languageRecognition.getListEntityValue(entities.brand),
        }
      }
      return { inputIdentified: false, nextStep: null, choice: null }
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Occurred in brandResponseHandlerByInputText in tvPurchaseDisambiguator.js'
      throw error
    }
  }

  /**
   * Method responsible for identifying user input through typed message
   * @param {LanguageRecognition} languageRecognition
   * @remarks Descritivo:
   *
   * - languageRecognition: object containing recognition results
   *
   * @returns identification object
   */
  async priceResponseHandlerByInputText(languageRecognition) {
    if (!languageRecognition)
      throw new Error(
        "[TvPurchaseDisambiguator-firstStepResponseHandlerByInputText]: Missing parameter 'languageRecognition' is required"
      )

    try {
      if (languageRecognition.hasIntentAboveThreshold(intents.purchaseTV)) {
        return {
          inputIdentified: true,
          nextStep: dialogs.tvPurchase,
        }
      }
      if (languageRecognition.hasIntentAboveThreshold(intents.farewell)) {
        return {
          inputIdentified: true,
          nextStep: dialogs.farewell,
        }
      }
      return { inputIdentified: false, nextStep: null }
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Occurred in stepTwoSelectedByInputText in tvPurchaseDisambiguator.js'
      throw error
    }
  }
}

module.exports.TvPurchaseDisambiguator = TvPurchaseDisambiguator
