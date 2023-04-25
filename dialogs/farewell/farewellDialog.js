const { MessageFactory, InputHints, ActivityTypes } = require('botbuilder')
const { TextPrompt, WaterfallDialog, WaterfallStepContext } = require('botbuilder-dialogs')
const {
  LanguageRecognition,
  SampleBotLuisRecognizer,
  SampleBotQnARecognizer,
} = require('../../cognitiveServices')
const { RecognitionHelper } = require('../../cognitiveServices/helpers/recognitionHelper')
const { Accessors } = require('../../statePropertyAccessors')
const { BaseDialog } = require('../baseDialog')
const { GenericDisambiguator } = require('../../helpers/dialogs/genericDisambiguator')
const { FarewellDisambiguator } = require('./helpers/farewellDisambiguator')

const { dialogs, prompts } = require('../../config')
const messages = require('./helpers/messages')

const ONBOARDING_WATERFALL_DIALOG = 'onBoardingDialog'

class FarewellDialog extends BaseDialog {
  /**
   * @param {SampleBotLuisRecognizer} luisRecognizer
   * @param {SampleBotQnARecognizer} qnaRecognizer
   * @param {RecognitionHelper} recognitionHelper
   * @param {GenericDisambiguator} genericDisambiguator
   * @param {FarewellDisambiguator} farewellDisambiguator
   * @param {Accessors} accessors
   */
  constructor(
    luisRecognizer,
    qnaRecognizer,
    recognitionHelper,
    genericDisambiguator,
    farewellDisambiguator,
    accessors
  ) {
    super(dialogs.farewell)

    if (!luisRecognizer)
      throw new Error("[FarewellDialog]: Missing parameter 'luisRecognizer' is required")
    this.luisRecognizer = luisRecognizer

    if (!qnaRecognizer)
      throw new Error("[FarewellDialog]: Missing parameter 'qnaRecognizer' is required")
    this.qnaRecognizer = qnaRecognizer

    if (!recognitionHelper)
      throw new Error("[FarewellDialog]: Missing parameter 'recognitionHelper' is required")
    this.recognitionHelper = recognitionHelper

    if (!genericDisambiguator)
      throw new Error("[FarewellDialog]: Missing parameter 'genericDisambiguator' is required")
    this.genericDisambiguator = genericDisambiguator

    if (!farewellDisambiguator)
      throw new Error("[FarewellDialog]: Missing parameter 'farewellDisambiguator' is required")
    this.farewellDisambiguator = farewellDisambiguator

    if (!accessors) throw new Error("[FarewellDialog]: Missing parameter 'accessors' is required")
    this.accessors = accessors

    this.addDialog(new TextPrompt(prompts.textPrompt)).addDialog(
      new WaterfallDialog(ONBOARDING_WATERFALL_DIALOG, [
        this.initialStep.bind(this),
        this.finalStep.bind(this),
      ])
    )
    this.initialDialogId = ONBOARDING_WATERFALL_DIALOG
  }

  /**
   * @param {LanguageRecognition} languageRecognition
   * @param {Object} userData
   * @returns {Object}
   */
  async canHandle(languageRecognition, userData) {
    try {
      if (userData.version && userData.version < process.env.BOT_V1)
        return { dialogId: dialogs.mainFarewell, canHandle: false }

      if (await this.genericDisambiguator.activateFarewell(languageRecognition))
        return { dialogId: dialogs.mainFarewell, canHandle: true }

      return { dialogId: dialogs.mainFarewell, canHandle: false }
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error happened when checking whether FarewellDialog could handle user input'
      throw error
    }
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async initialStep(stepContext) {
    try {
      await this.accessors.currentDialog.set(stepContext.context, dialogs.farewell)
      await this.accessors.dialogComplete.set(stepContext.context, false)

      await stepContext.context.sendActivities([
        { type: ActivityTypes.Typing },
        { type: 'delay', value: 1000 },
      ])

      return stepContext.prompt(prompts.textPrompt, {
        prompt: MessageFactory.suggestedActions(
          messages.npsSuggestedActions,
          messages.firstMessage,
          messages.firstMessage,
          InputHints.ExpectingInput
        ),
      })
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error occured when running initialStep from farewellDialog.js'
      throw error
    }
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async finalStep(stepContext) {
    try {
      const checkIfUserClickedButton = await this.genericDisambiguator.checkIfUserClickedButton(
        stepContext.context.activity.value
      )

      let npsResult
      let languageRecognition

      const buttonHandlerResponse =
        await this.farewellDisambiguator.firstStepResponseHandlerByButton({
          inputText:
            stepContext.context && stepContext.activity
              ? stepContext.context.activity.text
              : stepContext.result,
          checkIfUserClickedButton,
        })

      if (buttonHandlerResponse.inputIdentified) npsResult = buttonHandlerResponse.choice
      else {
        languageRecognition = await this.recognitionHelper.generateLanguageRecognition(stepContext)

        const inputTextHandlerResponse =
          await this.farewellDisambiguator.firstStepResponseHandlerByInputText(languageRecognition)

        if (inputTextHandlerResponse.inputIdentified) npsResult = buttonHandlerResponse.choice
      }

      if (npsResult) {
        // NOTE: Feel free to log NPS results here

        // Sending final messages
        await stepContext.context.sendActivities([
          { type: ActivityTypes.Typing },
          { type: 'delay', value: 1000 },
          MessageFactory.text(
            messages.secondMessage,
            messages.secondMessage,
            InputHints.IgnoringInput
          ),
          { type: ActivityTypes.Typing },
          { type: 'delay', value: 1000 },
        ])
        return stepContext.prompt(prompts.textPrompt, {
          prompt: MessageFactory.text(
            messages.thirdMessage,
            messages.thirdMessage,
            InputHints.IgnoringInput
          ),
        })
      }

      const finalDialogReplacementResponse =
        await this.genericDisambiguator.checkIfUserInputActivatedAnotherDialog({
          languageRecognition,
          stepContext,
        })

      return this.executeNextStep({
        nextStep: finalDialogReplacementResponse.nextStep,
        stepContext,
      })
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error when executing the secondStep of onBoardingDialog.js'
      throw new Error(error)
    }
  }
}

module.exports.FarewellDialog = FarewellDialog
