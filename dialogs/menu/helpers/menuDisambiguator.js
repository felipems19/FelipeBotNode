const { intents, buttons, dialogs } = require('../../../config')
const { GenericDisambiguator } = require('../../../helpers/dialogs/genericDisambiguator')
const { LanguageRecognition } = require('../../../cognitiveServices')
const { Accessors } = require('../../../statePropertyAccessors')
const { StringHandler } = require('../../../utils')

class MenuDisambiguator {
  /**
   * @param {GenericDisambiguator} genericDisambiguator
   * @param {StringHandler} stringHandler
   * @param {Accessors} accessors
   */
  constructor(genericDisambiguator, stringHandler, accessors) {
    if (!genericDisambiguator)
      throw new Error("[MenuDisambiguator]: Missing parameter 'genericDisambiguator' is required")
    this.genericDisambiguator = genericDisambiguator

    if (!stringHandler)
      throw new Error("[MenuDisambiguator]: Missing parameter 'stringHandler' is required")
    this.stringHandler = stringHandler

    if (!accessors)
      throw new Error("[MenuDisambiguator]: Missing parameter 'accessors' is required")
    this.accessors = accessors
  }

  /**
   * Method responsible for identifying user input through button click
   * @param {{inputText: String, checkIfUserClickedButton: Boolean}} parameters
   * @remarks Descritivo:
   *
   * - inputText: user message
   * - checkIfUserClickedButton: (optional) check whether user clicked on a button or not
   *
   * @returns identification object
   */
  async firstStepResponseHandlerByButton(parameters) {
    const { inputText, checkIfUserClickedButton } = parameters

    if (!inputText)
      throw new Error(
        "[MenuDisambiguator-firstStepResponseHandlerByButton]: Missing parameter 'inputText' is required"
      )

    try {
      const inputTextNormalized = await this.stringHandler.normalizeString(inputText)
      if (inputTextNormalized === (await this.stringHandler.normalizeString(buttons.purchaseTV)))
        return {
          inputIdentified: true,
          nextStep: dialogs.tvPurchase,
        }
      if (
        inputTextNormalized === (await this.stringHandler.normalizeString(buttons.thatsAllForToday))
      )
        return {
          inputIdentified: true,
          nextStep: dialogs.farewell,
        }

      // Default check. If a button was clicked and the dialog still doesn't know what to do, it could mean two things
      // The first one being the fact that it could be missing one check in this method
      // The second one being a possible bug of a user clicking on an old button in the dialog implemented
      if (checkIfUserClickedButton)
        return {
          inputIdentified: true,
          nextStep: dialogs.exception,
        }

      // If not identified, chances are that the user sent a text message to be identified by the NLP engine
      return { inputIdentified: false, nextStep: null }
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Occurred in firstStepResponseSelectedByButton from menuDisambiguator.js'
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
  async firstStepResponseHandlerByInputText(languageRecognition) {
    if (!languageRecognition)
      throw new Error(
        "[MenuDisambiguator-firstStepResponseHandlerByInputText]: Missing parameter 'languageRecognition' is required"
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
          : 'Occurred in stepTwoSelectedByInputText in menuDisambiguator.js'
      throw error
    }
  }
}

module.exports.MenuDisambiguator = MenuDisambiguator
