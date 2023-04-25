const { WaterfallStepContext } = require('botbuilder-dialogs')
const { ActivityTypes, InputHints } = require('botbuilder')
const { MessageFactory } = require('botbuilder-core')
const { TextPrompt, WaterfallDialog } = require('botbuilder-dialogs')
const { BaseDialog } = require('../baseDialog')
const { dialogs, prompts } = require('../../config')
const messages = require('./helpers/messages')
const {
  LanguageRecognition,
  SampleBotLuisRecognizer,
  SampleBotQnARecognizer,
} = require('../../cognitiveServices')
const { RecognitionHelper } = require('../../cognitiveServices/helpers/recognitionHelper')
const { Accessors } = require('../../statePropertyAccessors/accessors')
const { GenericDisambiguator } = require('../../helpers/dialogs/genericDisambiguator')
const { MenuDisambiguator } = require('./helpers/menuDisambiguator')

const MENU_WATERFALL_DIALOG = 'menuDialog'

class MenuDialog extends BaseDialog {
  /**
   * @param {SampleBotLuisRecognizer} luisRecognizer
   * @param {SampleBotQnARecognizer} qnaRecognizer
   * @param {RecognitionHelper} recognitionHelper
   * @param {GenericDisambiguator} genericDisambiguator
   * @param {MenuDisambiguator} menuDisambiguator
   * @param {Accessors} accessors
   * @param {Number} botVersionRequired
   */
  constructor(
    luisRecognizer,
    qnaRecognizer,
    recognitionHelper,
    genericDisambiguator,
    menuDisambiguator,
    accessors,
    botVersionRequired
  ) {
    super(dialogs.menu)

    if (!luisRecognizer)
      throw new Error("[MenuDialog]: Missing parameter 'luisRecognizer' is required")
    this.luisRecognizer = luisRecognizer

    if (!qnaRecognizer)
      throw new Error("[MenuDialog]: Missing parameter 'qnaRecognizer' is required")
    this.qnaRecognizer = qnaRecognizer

    if (!recognitionHelper)
      throw new Error("[MenuDialog]: Missing parameter 'recognitionHelper' is required")
    this.recognitionHelper = recognitionHelper

    if (!genericDisambiguator)
      throw new Error("[MenuDialog]: Missing parameter 'genericDisambiguator' is required")
    this.genericDisambiguator = genericDisambiguator

    if (!menuDisambiguator)
      throw new Error("[MenuDialog]: Missing parameter 'menuDisambiguator' is required")
    this.menuDisambiguator = menuDisambiguator

    if (!accessors) throw new Error("[MenuDialog]: Missing parameter 'accessors' is required")
    this.accessors = accessors

    if (!botVersionRequired)
      throw new Error("[MenuDialog]: Missing parameter 'botVersionRequired' is required")
    this.botVersionRequired = botVersionRequired

    this.addDialog(new TextPrompt(prompts.textPrompt)).addDialog(
      new WaterfallDialog(MENU_WATERFALL_DIALOG, [
        this.firstStep.bind(this),
        this.finalStep.bind(this),
      ])
    )

    this.initialDialogId = MENU_WATERFALL_DIALOG
  }

  /**
   * @param {LanguageRecognition} languageRecognition
   * @param {Object} userData
   * @returns {Object}
   */
  async canHandle(languageRecognition, userData) {
    try {
      if (!userData.activateMenu && userData.version && userData.version < this.botVersionRequired)
        return { dialogId: dialogs.menu, canHandle: false }

      if (
        userData.activateMenu ||
        (await this.genericDisambiguator.activateMenu(languageRecognition))
      )
        return { dialogId: dialogs.menu, canHandle: true }

      return { dialogId: dialogs.menu, canHandle: false }
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error happened when checking whether MenuDialog could handle user input'
      throw new Error(error)
    }
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async firstStep(stepContext) {
    try {
      await this.accessors.currentDialog.set(stepContext.context, dialogs.menu)
      await this.accessors.dialogComplete.set(stepContext.context, false)

      const menuTitle =
        stepContext.options && stepContext.options.menuTitle === undefined
          ? messages.defaultMenuMessage
          : stepContext.options.menuTitle

      await stepContext.context.sendActivities([
        { type: ActivityTypes.Typing },
        { type: 'delay', value: 1000 },
      ])

      return stepContext.prompt(prompts.textPrompt, {
        prompt: MessageFactory.suggestedActions(
          messages.menuSuggestedActions,
          menuTitle,
          menuTitle,
          InputHints.ExpectingInput
        ),
      })
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error when executing the first step of menuDialog.js'
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

      const buttonHandlerResponse = await this.menuDisambiguator.firstStepResponseHandlerByButton({
        inputText:
          stepContext.context && stepContext.activity
            ? stepContext.context.activity.text
            : stepContext.result,
        checkIfUserClickedButton,
      })

      if (buttonHandlerResponse.inputIdentified) {
        return this.executeNextStep({ nextStep: buttonHandlerResponse.nextStep, stepContext })
      }

      const languageRecognition = await this.recognitionHelper.generateLanguageRecognition(
        stepContext
      )

      const inputTextHandlerResponse =
        await this.menuDisambiguator.firstStepResponseHandlerByInputText(languageRecognition)

      if (inputTextHandlerResponse.inputIdentified)
        return this.executeNextStep({ nextStep: inputTextHandlerResponse.nextStep, stepContext })

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
          : 'Error when executing the finalStep step of menuDialog.js'
      throw new Error(error)
    }
  }
}

module.exports.MenuDialog = MenuDialog
