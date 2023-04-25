const { entities, buttons, dialogs } = require('../../../config')
const { GenericDisambiguator } = require('../../../helpers/dialogs/genericDisambiguator')
const { LanguageRecognition } = require('../../../cognitiveServices')
const { Accessors } = require('../../../statePropertyAccessors')
const { StringHandler } = require('../../../utils')

class FarewellDisambiguator {
  /**
   * @param {GenericDisambiguator} genericDisambiguator
   * @param {StringHandler} stringHandler
   * @param {Accessors} accessors
   */
  constructor(genericDisambiguator, stringHandler, accessors) {
    if (!genericDisambiguator)
      throw new Error(
        "[FarewellDisambiguator]: Missing parameter 'genericDisambiguator' is required"
      )
    this.genericDisambiguator = genericDisambiguator

    if (!stringHandler)
      throw new Error("[FarewellDisambiguator]: Missing parameter 'stringHandler' is required")
    this.stringHandler = stringHandler

    if (!accessors)
      throw new Error("[FarewellDisambiguator]: Missing parameter 'accessors' is required")
    this.accessors = accessors
  }

  /**
   * @param {LanguageRecognition} languageRecognition
   */
  async itContainsGreatFeedback(languageRecognition) {
    return (
      languageRecognition.hasEntity(entities.feedback) &&
      languageRecognition.entities.choice.some((value) => value.includes('greatFeedback'))
    )
  }

  /**
   * @param {LanguageRecognition} languageRecognition
   */
  async itContainsIntermediateFeedback(languageRecognition) {
    return (
      languageRecognition.hasEntity(entities.feedback) &&
      languageRecognition.entities.choice.some((value) => value.includes('intermediateFeedback'))
    )
  }

  /**
   * @param {LanguageRecognition} languageRecognition
   */
  async itContainsABadFeedback(languageRecognition) {
    return (
      languageRecognition.hasEntity(entities.feedback) &&
      languageRecognition.entities.choice.some((value) => value.includes('badFeedback'))
    )
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
        "[FarewellDisambiguator-firstStepResponseHandlerByButton]: Missing parameter 'inputText' is required"
      )

    try {
      const inputTextNormalized = await this.stringHandler.normalizeString(inputText)
      if (inputTextNormalized === (await this.stringHandler.normalizeString(buttons.iLovedIt)))
        return {
          inputIdentified: true,
          nextStep: null,
          choice: buttons.iLovedIt,
        }
      if (
        inputTextNormalized === (await this.stringHandler.normalizeString(buttons.iThoughtItWasOk))
      )
        return {
          inputIdentified: true,
          nextStep: null,
          choice: buttons.iThoughtItWasOk,
        }
      if (inputTextNormalized === (await this.stringHandler.normalizeString(buttons.iDidntLikeIt)))
        return {
          inputIdentified: true,
          nextStep: null,
          choice: buttons.iDidntLikeIt,
        }

      // Default check. If a button was clicked and the dialog still doesn't know what to do, it could mean two things
      // The first one being the fact that it could be missing one check in this method
      // The second one being a possible bug of a user clicking on an old button in the dialog implemented
      if (checkIfUserClickedButton)
        return {
          inputIdentified: true,
          nextStep: dialogs.exception,
          choice: null,
        }

      // If not identified, chances are that the user sent a text message to be identified by the NLP engine
      return { inputIdentified: false, nextStep: null, choice: null }
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Occurred in firstStepResponseSelectedByButton from farewellDisambiguator.js'
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
        "[FarewellDisambiguator-firstStepResponseHandlerByInputText]: Missing parameter 'languageRecognition' is required"
      )

    try {
      if (await this.itContainsGreatFeedback(languageRecognition)) {
        return {
          inputIdentified: true,
          nextStep: null,
          choice: buttons.iLovedIt,
        }
      }
      if (await this.itContainsIntermediateFeedback(languageRecognition)) {
        return {
          inputIdentified: true,
          nextStep: null,
          choice: buttons.iThoughtItWasOk,
        }
      }
      if (await this.itContainsABadFeedback(languageRecognition)) {
        return {
          inputIdentified: true,
          nextStep: null,
          choice: buttons.iDidntLikeIt,
        }
      }

      return { inputIdentified: false, nextStep: null, choice: null }
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Occurred in stepTwoSelectedByInputText in farewellDisambiguator.js'
      throw error
    }
  }
}

module.exports.FarewellDisambiguator = FarewellDisambiguator
