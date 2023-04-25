const { Accessors } = require('../../statePropertyAccessors')
const {
  LanguageRecognition,
  SampleBotLuisRecognizer,
  SampleBotQnARecognizer,
} = require('../../cognitiveServices')
const { intents, dialogs, entities, buttons } = require('../../config')

class GenericDisambiguator {
  /**
   * @param {SampleBotQnARecognizer} qnaRecognizer
   * @param {Accessors} accessors
   */
  constructor(qnaRecognizer, accessors) {
    if (!qnaRecognizer)
      throw new Error("[GenericDisambiguator]: Missing parameter 'qnaRecognizer' is required")
    this.qnaRecognizer = qnaRecognizer

    if (!accessors)
      throw new Error("[GenericDisambiguator]: Missing parameter 'accessors' is required")
    this.accessors = accessors
  }

  /**
   * @param {SampleBotLuisRecognizer} languageRecognition
   * @returns {Boolean}
   */
  async activateMenu(languageRecognition) {
    return (
      languageRecognition.hasIntentAboveThreshold(intents.menu) ||
      (languageRecognition.hasEntity(entities.help) &&
        (languageRecognition.entities.help.some((value) => value.includes('doubt')) ||
          languageRecognition.entities.help.some((value) => value.includes('help'))))
    )
  }

  /**
   * @param {SampleBotLuisRecognizer} languageRecognition
   * @returns {Boolean}
   */
  async activateFarewell(languageRecognition) {
    return languageRecognition.hasIntentAboveThreshold(intents.farewell)
  }

  /**
   * @param {Object}
   * @returns {Boolean}
   */
  async checkIfUserClickedButton(value) {
    return value && value.source.toLowerCase() === buttons.button.toLowerCase()
  }

  /**
   *
   * @param {import('botbuilder-ai').QnAMakerResult} qnaResult
   * @returns {Boolean}
   */
  async doesntHaveQnAAnswer(qnaResult) {
    return (
      !qnaResult ||
      (qnaResult && !Array.isArray(qnaResult)) ||
      (qnaResult && Array.isArray(qnaResult) && qnaResult.length === 0)
    )
  }

  /**
   * @param {LanguageRecognition} languageRecognition
   * @returns {Boolean}
   */
  async comeBack(languageRecognition) {
    return (
      languageRecognition.hasEntity(entities.action) &&
      languageRecognition.entities.action.some((value) => value.includes('return'))
    )
  }

  /**
   * Method responsible for identifying user input through button click
   * @param {{languageRecognition: LanguageRecognition, stepContext: import('botbuilder-dialogs').WaterfallStepContext, qnaResult: import('botbuilder-ai').QnAMakerResult}} parameters
   * @remarks Descritivo:
   *
   * - languageRecognition: object containing recognition results
   * - stepContext: bot step context
   * - qnaResult: (optional) object containing qna results
   *
   * @returns object containing next steps
   */
  async checkIfUserInputActivatedAnotherDialog(parameters) {
    const { languageRecognition, stepContext, qnaResult } = parameters

    if (!languageRecognition)
      throw new Error("[GenericDisambiguator]: Missing parameter 'languageRecognition' is required")

    if (!stepContext)
      throw new Error("[GenericDisambiguator]: Missing parameter 'stepContext' is required")

    try {
      // if no intent was identified, the chatbot will look for other options
      if (languageRecognition.doesntHavetopIntent()) {
        const newQnaResult = qnaResult || (await this.qnARecognizer.executeQnAQuery(stepContext))

        // Checking whether the user asked about something that the FAQ could help
        if (newQnaResult && Array.isArray(newQnaResult) && newQnaResult.length > 0)
          return { nextStep: dialogs.faq, options: { qnaResult: newQnaResult } }

        // Checking whether the user has requested to return
        if (await this.comeBack(languageRecognition)) {
          const previousDialog = await this.accessors.previousDialog.get(stepContext.context, false)
          const nameNextStep = previousDialog || dialogs.menu
          return { nextStep: nameNextStep }
        }

        // By default, if nothing was identified, user is forwarded to exception dialog
        return { nextStep: dialogs.exception }
      }

      // If the user message triggered an intent that the current dialog was not expecting, the chatbot forwards the context to the canHandle method
      // in order to figure out which other dialog could help handle the user input sent in the current dialog
      // it is likely that the user changed the subject in the middle of the current dialog when this return is activated
      return { nextStep: dialogs.main, options: { languageRecognition, callCanHandle: true } }
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Occurred in checkIfUserInputActivatedAnotherDialog in genericDisambiguator.js'
      throw error
    }
  }
}

module.exports.GenericDisambiguator = GenericDisambiguator
