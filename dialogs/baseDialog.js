const { ComponentDialog, WaterfallStepContext } = require('botbuilder-dialogs')
const { LanguageRecognition } = require('../cognitiveServices')
const { dialogs, steps, prompts } = require('../config')

class BaseDialog extends ComponentDialog {
  /**
   * @param {LanguageRecognition} languageRecognition
   * @param {Object} userData
   */
  async childrenThatCanHandle(languageRecognition, userData) {
    // NOTE: the position of an element in the dialogIds array indicates its priority. Lower indexes have more priority
    const dialogIds = [dialogs.menu, dialogs.farewell]

    if (dialogIds && Array.isArray(dialogIds) && dialogIds.length > 0) {
      return Promise.allSettled(
        dialogIds.map((dialogId) => {
          const dialog = this.findDialog(dialogId)
          if (dialog && typeof dialog.canHandle === 'function')
            return dialog.canHandle(languageRecognition, userData)
          return { dialogId: null, canHandle: false }
        })
      )

        .then((childrenPromisesResult) => {
          const children = []

          for (const promiseResult of childrenPromisesResult) {
            if (
              promiseResult &&
              promiseResult.value &&
              promiseResult.value.dialogId &&
              promiseResult.value.canHandle
            )
              children.push(promiseResult.value.dialogId)
          }

          return children
        })
        .catch((error) => {
          // eslint-disable-next-line no-param-reassign
          error.additionalDescription =
            error && error.additionalDescription
              ? error.additionalDescription
              : 'Error happened when executing Promise.allSettled from baseDialog.js'
          throw error
        })
    }
    return []
  }

  /**
   * Method responsible for executing a new dialog
   * @param {{nextStep: String, stepContext: WaterfallStepContext, options: Object}} parameters
   * @remarks Descritivo:
   *
   * - nextStep: next step name (including dialog name)
   * - stepContext: bot step context
   * - options: any extra data to send together with the new dialog execution
   *
   * @returns
   */
  async executeNewDialog(parameters) {
    const { nextStep, stepContext, options } = parameters

    if (!nextStep)
      throw new Error("[BaseDialog-executeNewDialog]: Missing parameter 'nextStep' is required")
    if (!stepContext)
      throw new Error("[BaseDialog-executeNewDialog]: Missing parameter 'stepContext' is required")

    try {
      // Making the decision regarding the next step
      if (nextStep === dialogs.main) return stepContext.beginDialog(dialogs.main, options)

      await this.accessors.dialogComplete.set(stepContext.context, true)
      return stepContext.replaceDialog(nextStep, options)
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Occurred in executeNewDialog in basedialog.js'
      throw error
    }
  }

  /**
   * Method responsible executing a next step
   * @param {{nextStep: String, stepContext: WaterfallStepContext, redirectTag: String, redirectData: Object, options: Object}} parameters
   * @remarks Descritivo:
   *
   * - nextStep: next step name (including dialog name)
   * - stepContext: bot step context
   * - redirectTag: a tag to be sent to the front-end in order to activate a visual feature
   * - redirectData: any extra data to send together with the redirectTag name
   * - options: any extra data to send together with the new dialog execution
   *
   * @returns
   */
  async executeNextStep(parameters) {
    const { nextStep, stepContext, redirectTag, redirectData, options } = parameters

    if (!nextStep)
      throw new Error("[BaseDialog-executeNextStep]: Missing parameter 'nextStep' is required")
    if (!stepContext)
      throw new Error("[BaseDialog-executeNextStep]: Missing parameter 'stepContext' is required")

    try {
      if (nextStep === steps.nextStep) return stepContext.next()

      if (redirectTag) {
        await this.accessors.dialogComplete.set(stepContext.context, true)

        await stepContext.context.sendActivity({
          type: redirectTag,
          value: redirectTag,
          attachments: redirectData ? [{ content: redirectData }] : undefined,
        })
        return stepContext.prompt(prompts.textPrompt)
      }

      return this.executeNewDialog({ nextStep, stepContext, options })
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Occurred in executeNextStep in baseDialog.js'
      throw error
    }
  }
}

module.exports.BaseDialog = BaseDialog
