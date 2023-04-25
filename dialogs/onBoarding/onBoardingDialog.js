const { MessageFactory, InputHints, ActivityTypes } = require('botbuilder')
const { TextPrompt, WaterfallDialog, WaterfallStepContext } = require('botbuilder-dialogs')
const { SampleBotLuisRecognizer, SampleBotQnARecognizer } = require('../../cognitiveServices')
const { RecognitionHelper } = require('../../cognitiveServices/helpers/recognitionHelper')
const { Accessors } = require('../../statePropertyAccessors')
const { BaseDialog } = require('../baseDialog')
const { GenericDisambiguator } = require('../../helpers/dialogs/genericDisambiguator')
const { OnBoardingDisambiguator } = require('./helpers/onBoardingDisambiguator')

const { dialogs, steps, prompts } = require('../../config')
const messages = require('./helpers/messages')

const ONBOARDING_WATERFALL_DIALOG = 'onBoardingDialog'

class OnBoardingDialog extends BaseDialog {
  /**
   * @param {SampleBotLuisRecognizer} luisRecognizer
   * @param {SampleBotQnARecognizer} qnaRecognizer
   * @param {RecognitionHelper} recognitionHelper
   * @param {GenericDisambiguator} genericDisambiguator
   * @param {OnBoardingDisambiguator} onBoardingDisambiguator
   * @param {Accessors} accessors
   */
  constructor(
    luisRecognizer,
    qnaRecognizer,
    recognitionHelper,
    genericDisambiguator,
    onBoardingDisambiguator,
    accessors
  ) {
    super(dialogs.onBoarding)

    if (!luisRecognizer)
      throw new Error("[OnBoardingDialog]: Missing parameter 'luisRecognizer' is required")
    this.luisRecognizer = luisRecognizer

    if (!qnaRecognizer)
      throw new Error("[OnBoardingDialog]: Missing parameter 'qnaRecognizer' is required")
    this.qnaRecognizer = qnaRecognizer

    if (!recognitionHelper)
      throw new Error("[OnBoardingDialog]: Missing parameter 'recognitionHelper' is required")
    this.recognitionHelper = recognitionHelper

    if (!genericDisambiguator)
      throw new Error("[OnBoardingDialog]: Missing parameter 'genericDisambiguator' is required")
    this.genericDisambiguator = genericDisambiguator

    if (!onBoardingDisambiguator)
      throw new Error("[OnBoardingDialog]: Missing parameter 'onBoardingDisambiguator' is required")
    this.onBoardingDisambiguator = onBoardingDisambiguator

    if (!accessors) throw new Error("[OnBoardingDialog]: Missing parameter 'accessors' is required")
    this.accessors = accessors

    this.addDialog(new TextPrompt(prompts.textPrompt)).addDialog(
      new WaterfallDialog(ONBOARDING_WATERFALL_DIALOG, [
        this.initialStep.bind(this),
        this.secondStep.bind(this),
        this.finalStep.bind(this),
      ])
    )
    this.initialDialogId = ONBOARDING_WATERFALL_DIALOG
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async initialStep(stepContext) {
    try {
      await this.accessors.currentDialog.set(stepContext.context, dialogs.onBoarding)
      await this.accessors.dialogComplete.set(stepContext.context, false)

      await stepContext.context.sendActivities([
        { type: ActivityTypes.Typing },
        { type: 'delay', value: 1000 },
        MessageFactory.text(messages.firstMessage, messages.firstMessage, InputHints.IgnoringInput),
        { type: ActivityTypes.Typing },
        { type: 'delay', value: 1000 },
        MessageFactory.text(
          messages.secondMessage(this.luisRecognizer.isConfigured),
          messages.secondMessage(this.luisRecognizer.isConfigured),
          InputHints.IgnoringInput
        ),
        { type: ActivityTypes.Typing },
        { type: 'delay', value: 1000 },
      ])

      return stepContext.prompt(prompts.textPrompt, {
        prompt: MessageFactory.suggestedActions(
          messages.firstOnBoardingSuggestedActions,
          messages.thirdMessage,
          messages.thirdMessage,
          InputHints.ExpectingInput
        ),
      })
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error occured when running initialStep from onBoardingDialog.js'
      throw error
    }
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async secondStep(stepContext) {
    try {
      const checkIfUserClickedButton = await this.genericDisambiguator.checkIfUserClickedButton(
        stepContext.context.activity.value
      )

      let nextStep
      let firstStepChoice
      let stepData
      let languageRecognition

      const buttonHandlerResponse =
        await this.onBoardingDisambiguator.firstStepResponseHandlerByButton({
          inputText:
            stepContext.context && stepContext.activity
              ? stepContext.context.activity.text
              : stepContext.result,
          checkIfUserClickedButton,
        })

      if (buttonHandlerResponse.inputIdentified) {
        nextStep = buttonHandlerResponse.nextStep
        firstStepChoice = buttonHandlerResponse.choice
        stepData = buttonHandlerResponse.stepData
      } else {
        languageRecognition = await this.recognitionHelper.generateLanguageRecognition(stepContext)

        const inputTextHandlerResponse =
          await this.onBoardingDisambiguator.firstStepResponseHandlerByInputText(
            languageRecognition
          )

        if (inputTextHandlerResponse.inputIdentified) {
          nextStep = inputTextHandlerResponse.nextStep
          firstStepChoice = inputTextHandlerResponse.choice
          stepData = inputTextHandlerResponse.stepData
        }
      }

      if (nextStep === steps.continueWaterFall && stepData) {
        await this.accessors.conversationData.update(stepContext.context, { firstStepChoice })

        await stepContext.context.sendActivities([
          { type: ActivityTypes.Typing },
          { type: 'delay', value: 1000 },
        ])
        return stepContext.prompt(prompts.textPrompt, {
          prompt: MessageFactory.suggestedActions(
            stepData.suggestedActions,
            stepData.messages.suggestedActionTitle,
            stepData.messages.suggestedActionTitle,
            InputHints.ExpectingInput
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

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async finalStep(stepContext) {
    try {
      const checkIfUserClickedButton = await this.genericDisambiguator.checkIfUserClickedButton(
        stepContext.context.activity.value
      )

      let nextStep
      let stepData
      let languageRecognition

      const { firstStepChoice } = await this.accessors.conversationData.get(stepContext.context, {})

      const buttonHandlerResponse =
        await this.onBoardingDisambiguator.secondStepResponseHandlerByButton({
          inputText:
            stepContext.context && stepContext.context.activity
              ? stepContext.context.activity.text
              : stepContext.result,
          checkIfUserClickedButton,
          firstStepChoice,
        })

      if (buttonHandlerResponse.inputIdentified) {
        nextStep = buttonHandlerResponse.nextStep
        stepData = buttonHandlerResponse.stepData
      } else {
        languageRecognition = await this.recognitionHelper.generateLanguageRecognition(stepContext)

        const inputTextHandlerResponse =
          await this.onBoardingDisambiguator.secondStepResponseHandlerByInputText({
            languageRecognition,
            firstStepChoice,
          })

        if (inputTextHandlerResponse.inputIdentified) {
          nextStep = inputTextHandlerResponse.nextStep
          stepData = inputTextHandlerResponse.stepData
        }
      }

      if (nextStep === steps.continueWaterFall && stepData) {
        await stepContext.context.sendActivities([
          { type: ActivityTypes.Typing },
          { type: 'delay', value: 1000 },
          MessageFactory.text(stepData.message, stepData.message, InputHints.IgnoringInput),
        ])
        return stepContext.replaceDialog(dialogs.menu)
      }

      if (nextStep === dialogs.menu) return stepContext.replaceDialog(dialogs.menu)

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
          : 'Error occured when running finalStep from onBoardingDialog.js'
      throw error
    }
  }
}

module.exports.OnBoardingDialog = OnBoardingDialog
