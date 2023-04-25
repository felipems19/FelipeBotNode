const { InputHints, ActivityTypes } = require('botbuilder')
const { MessageFactory } = require('botbuilder-core')
const { TextPrompt, WaterfallDialog, WaterfallStepContext } = require('botbuilder-dialogs')
const { BaseDialog } = require('../baseDialog')
const { dialogs, prompts } = require('../../config')
const messages = require('./helpers/messages')

const EXCEPTION_WATERFALL_DIALOG = 'exceptionDialog'

class ExceptionDialog extends BaseDialog {
  constructor(luisRecognizer, accessors, arrayHandler) {
    super(dialogs.exception)

    if (!luisRecognizer)
      throw new Error("[ExceptionDialog]: Missing parameter 'luisRecognizer' is required")
    this.luisRecognizer = luisRecognizer

    if (!accessors) throw new Error("[ExceptionDialog]: Missing parameter 'accessors' is required")
    this.accessors = accessors

    if (!arrayHandler)
      throw new Error("[ExceptionDialog]: Missing parameter 'arrayHandler' is required")
    this.arrayHandler = arrayHandler

    this.addDialog(new TextPrompt(prompts.textPrompt)).addDialog(
      new WaterfallDialog(EXCEPTION_WATERFALL_DIALOG, [
        this.introStep.bind(this),
        this.actStep.bind(this),
      ])
    )

    this.initialDialogId = EXCEPTION_WATERFALL_DIALOG
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async introStep(stepContext) {
    try {
      await this.accessors.currentDialog.set(stepContext.context, dialogs.exception)
      await this.accessors.dialogComplete.set(stepContext.context, false)

      let firstMessage = ''
      let secondMessage = ''

      const isSecondException = await this.accessors.isSecondException.get(
        stepContext.context,
        false
      )
      if (!isSecondException) {
        firstMessage = await this.arrayHandler.randomItemFromArray(
          [messages.commonFirstExceptionMessage11, messages.commonFirstExceptionMessage12],
          stepContext
        )
        secondMessage = messages.commonFirstExceptionMessage2
      } else {
        firstMessage = messages.commonSecondExceptionMessage1
        secondMessage = messages.commonSecondExceptionMessage2
      }

      await stepContext.context.sendActivities([
        { type: ActivityTypes.Typing },
        { type: 'delay', value: 1000 },
        MessageFactory.text(firstMessage, firstMessage, InputHints.IgnoringInput),
        { type: ActivityTypes.Typing },
        { type: 'delay', value: 1000 },
        MessageFactory.text(secondMessage, secondMessage, InputHints.IgnoringInput),
      ])

      return stepContext.prompt(prompts.textPrompt, {
        prompt: MessageFactory.suggestedActions(
          messages.exceptionSuggestions,
          null,
          null,
          InputHints.ExpectingInput
        ),
      })
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error when running intro step in exceptionDialog.js'
      throw error
    }
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async actStep(stepContext) {
    try {
      await this.accessors.dialogComplete.set(stepContext.context, true)
      await stepContext.cancelAllDialogs()

      await this.accessors.isSecondException.set(stepContext.context, true)

      return stepContext.beginDialog(dialogs.main, { callCanHandle: true })
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error when identifying user action in exceptionDialog.js'
      throw error
    }
  }
}

module.exports.ExceptionDialog = ExceptionDialog
