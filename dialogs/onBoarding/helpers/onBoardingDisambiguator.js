const { intents, buttons, dialogs, entities, steps } = require('../../../config')
const { GenericDisambiguator } = require('../../../helpers/dialogs/genericDisambiguator')
const { LanguageRecognition, SampleBotLuisRecognizer } = require('../../../cognitiveServices')
const { Accessors } = require('../../../statePropertyAccessors')
const { StringHandler } = require('../../../utils')
const messages = require('./messages')

class OnBoardingDisambiguator {
  /**
   * @param {GenericDisambiguator} genericDisambiguator
   * @param {StringHandler} stringHandler
   * @param {Accessors} accessors
   */
  constructor(genericDisambiguator, stringHandler, accessors) {
    if (!genericDisambiguator)
      throw new Error(
        "[OnBoardingDisambiguator]: Missing parameter 'genericDisambiguator' is required"
      )
    this.genericDisambiguator = genericDisambiguator

    if (!stringHandler)
      throw new Error("[OnBoardingDisambiguator]: Missing parameter 'stringHandler' is required")
    this.stringHandler = stringHandler

    if (!accessors)
      throw new Error("[OnBoardingDisambiguator]: Missing parameter 'accessors' is required")
    this.accessors = accessors
  }

  /**
   * @param {SampleBotLuisRecognizer} languageRecognition
   * @returns {Boolean}
   */
  async itsAboutFunctionality(languageRecognition) {
    return (
      languageRecognition.hasEntity(entities.about) &&
      languageRecognition.entities.about.some((value) => value.includes('functionality'))
    )
  }

  /**
   * @param {SampleBotLuisRecognizer} languageRecognition
   * @returns {Boolean}
   */
  async itsAboutOwnership(languageRecognition) {
    return (
      languageRecognition.hasEntity(entities.about) &&
      languageRecognition.entities.about.some((value) => value.includes('ownership'))
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
        "[OnBoardingDisambiguator-firstStepResponseHandlerByButton]: Missing parameter 'inputText' is required"
      )

    try {
      const inputTextNormalized = await this.stringHandler.normalizeString(inputText)
      if (inputTextNormalized === (await this.stringHandler.normalizeString(buttons.whatCanYouDo)))
        return {
          inputIdentified: true,
          nextStep: steps.continueWaterFall,
          choice: buttons.whatCanYouDo,
          stepData: {
            messages: { suggestedActionTitle: messages.fourthMessage },
            suggestedActions: messages.secondOnBoardingSuggestedActions,
          },
        }
      if (inputTextNormalized === (await this.stringHandler.normalizeString(buttons.whoBuiltYou)))
        return {
          inputIdentified: true,
          nextStep: steps.continueWaterFall,
          choice: buttons.whoBuiltYou,
          stepData: {
            messages: { suggestedActionTitle: messages.fifthMessage },
            suggestedActions: messages.thirdOnBoardingSuggestedActions,
          },
        }

      // Default check. If a button was clicked and the dialog still doesn't know what to do, it could mean two things
      // The first one being the fact that it could be missing one check in this method
      // The second one being a possible bug of a user clicking on an old button in the dialog implemented
      if (checkIfUserClickedButton)
        return {
          inputIdentified: true,
          nextStep: dialogs.exception,
          choice: null,
          stepData: null,
        }

      // If not identified, chances are that the user sent a text message to be identified by the NLP engine
      return { inputIdentified: false, nextStep: null, choice: null, stepData: null }
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Occurred in firstStepResponseSelectedByButton from onBoardingDisambiguator.js'
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
        "[OnBoardingDisambiguator-firstStepResponseHandlerByInputText]: Missing parameter 'languageRecognition' is required"
      )

    try {
      if (await this.itsAboutFunctionality(languageRecognition)) {
        return {
          inputIdentified: true,
          nextStep: steps.continueWaterFall,
          choice: buttons.whoBuiltYou,
          stepData: {
            messages: { suggestedActionTitle: messages.fourthMessage },
            suggestedActions: messages.secondOnBoardingSuggestedActions,
          },
        }
      }
      if (await this.itsAboutOwnership(languageRecognition)) {
        return {
          inputIdentified: true,
          nextStep: steps.continueWaterFall,
          choice: buttons.whatCanYouDo,
          stepData: {
            messages: { suggestedActionTitle: messages.fifthMessage },
            suggestedActions: messages.thirdOnBoardingSuggestedActions,
          },
        }
      }
      return {
        inputIdentified: false,
        nextStep: null,
        stepData: null,
      }
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Occurred in stepTwoSelectedByInputText in onBoardingDisambiguator.js'
      throw error
    }
  }

  /**
   * Method responsible for identifying user input through button click
   * @param {{inputText: String, firstStepChoice: String, checkIfUserClickedButton: Boolean}} parameters
   * @remarks Descritivo:
   *
   * - inputText: user message
   * - firstStepChoice: user choice from first step
   * - checkIfUserClickedButton: (optional) check whether user clicked on a button or not
   *
   * @returns identification object
   */
  async secondStepResponseHandlerByButton(parameters) {
    const { inputText, firstStepChoice, checkIfUserClickedButton } = parameters

    if (!inputText)
      throw new Error(
        "[OnBoardingDisambiguator-secondStepResponseHandlerByButton]: Missing parameter 'inputText' is required"
      )
    if (!firstStepChoice)
      throw new Error(
        "[OnBoardingDisambiguator-secondStepResponseHandlerByButton]: Missing parameter 'firstStepChoice' is required"
      )

    try {
      const handlerOptions = {}
      if (firstStepChoice === buttons.whatCanYouDo) {
        handlerOptions.button = buttons.whoBuiltYou
        handlerOptions.message = messages.fifthMessage
      } else {
        handlerOptions.button = buttons.whatCanYouDo
        handlerOptions.message = messages.fourthMessage
      }
      const inputTextNormalized = await this.stringHandler.normalizeString(inputText)
      if (inputTextNormalized === (await this.stringHandler.normalizeString(handlerOptions.button)))
        return {
          inputIdentified: true,
          nextStep: steps.continueWaterFall,
          choice: handlerOptions.button,
          stepData: {
            message: handlerOptions.message,
          },
        }
      if (inputTextNormalized === (await this.stringHandler.normalizeString(buttons.menu)))
        return {
          inputIdentified: true,
          nextStep: dialogs.menu,
          choice: buttons.menu,
          stepData: null,
        }

      // Default check. If a button was clicked and the dialog still doesn't know what to do, it could mean two things
      // The first one being the fact that it could be missing one check in this method
      // The second one being a possible bug of a user clicking on an old button in the dialog implemented
      if (checkIfUserClickedButton)
        return {
          inputIdentified: true,
          nextStep: dialogs.exception,
          choice: null,
          stepData: null,
        }

      // If not identified, chances are that the user sent a text message to be identified by the NLP engine
      return { inputIdentified: false, nextStep: null, choice: null, stepData: null }
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Occurred in firstStepResponseSelectedByButton from onBoardingDisambiguator.js'
      throw error
    }
  }

  /**
   * Method responsible for identifying user input through typed message
   *
   * @param {{languageRecognition: LanguageRecognition, firstStepChoice: String}} parameters
   * @remarks Descritivo:
   *
   * - languageRecognition: object containing recognition results
   * - firstStepChoice: user choice from first step
   *
   * @returns identification object
   */
  async secondStepResponseHandlerByInputText(parameters) {
    const { languageRecognition, firstStepChoice } = parameters

    if (!languageRecognition)
      throw new Error(
        "[OnBoardingDisambiguator-secondStepResponseHandlerByInputText]: Missing parameter 'languageRecognition' is required"
      )

    if (!firstStepChoice)
      throw new Error(
        "[OnBoardingDisambiguator-secondStepResponseHandlerByInputText]: Missing parameter 'firstStepChoice' is required"
      )

    try {
      const handlerOptions = {}
      if (firstStepChoice === buttons.whatCanYouDo) {
        handlerOptions.button = buttons.whoBuiltYou
        handlerOptions.itsCoreIsCapableToHandle = await this.itsAboutOwnership(languageRecognition)
        handlerOptions.message = messages.fifthMessage
      } else {
        handlerOptions.button = buttons.whatCanYouDo
        handlerOptions.itsCoreIsCapableToHandle = await this.itsAboutFunctionality(
          languageRecognition
        )
        handlerOptions.message = messages.fourthMessage
      }

      if (handlerOptions.itsCoreIsCapableToHandle)
        return {
          inputIdentified: true,
          nextStep: steps.continueWaterFall,
          choice: handlerOptions.button,
          stepData: {
            message: handlerOptions.message,
          },
        }

      if (languageRecognition.hasIntentAboveThreshold(intents.menu)) {
        return {
          inputIdentified: true,
          nextStep: dialogs.menu,
          choice: buttons.menu,
          stepData: null,
        }
      }

      return {
        inputIdentified: false,
        nextStep: null,
        stepData: null,
      }
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Occurred in stepTwoSelectedByInputText in onBoardingDisambiguator.js'
      throw error
    }
  }
}

module.exports.OnBoardingDisambiguator = OnBoardingDisambiguator
