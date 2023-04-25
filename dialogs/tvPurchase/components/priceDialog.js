const { MessageFactory, InputHints } = require('botbuilder')
const { TextPrompt, WaterfallDialog, WaterfallStepContext } = require('botbuilder-dialogs')
const { BaseDialog } = require('../../baseDialog')
const { TvPurchaseDisambiguator } = require('../helpers/tvPurchaseDisambiguator')
const { RecognitionHelper } = require('../../../cognitiveServices/helpers/recognitionHelper')
const { dialogs, prompts } = require('../../../config')
const messages = require('../helpers/messages')

const TV_PURCHASE_PRICE_WATERFALL_DIALOG = 'tvPurchasePriceComponentDialog'
const MAXIMUM_NUMBER_OF_ATTEMPTS = 1

class PriceDialog extends BaseDialog {
  /**
   * @param {RecognitionHelper} recognitionHelper
   * @param {TvPurchaseDisambiguator} tvPurchaseDisambiguator
   */
  constructor(recognitionHelper, genericDisambiguator, tvPurchaseDisambiguator) {
    super(dialogs.tvPurchasePriceComponent)

    if (!recognitionHelper)
      throw new Error("[PriceDialog]: Missing parameter 'recognitionHelper' is required")
    this.recognitionHelper = recognitionHelper

    if (!genericDisambiguator)
      throw new Error("[PriceDialog]: Missing parameter 'genericDisambiguator' is required")
    this.genericDisambiguator = genericDisambiguator

    if (!tvPurchaseDisambiguator)
      throw new Error("[PriceDialog]: Missing parameter 'tvPurchaseDisambiguator' is required")
    this.tvPurchaseDisambiguator = tvPurchaseDisambiguator

    this.addDialog(new TextPrompt(prompts.textPrompt)).addDialog(
      new WaterfallDialog(TV_PURCHASE_PRICE_WATERFALL_DIALOG, [
        this.initialStep.bind(this),
        this.finalStep.bind(this),
      ])
    )
    this.initialDialogId = TV_PURCHASE_PRICE_WATERFALL_DIALOG
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async initialStep(stepContext) {
    try {
      stepContext.values.numberOfAttempts = stepContext.options ? stepContext.options : 0

      return stepContext.prompt(prompts.textPrompt, {
        prompt: MessageFactory.text(
          messages.priceMessage,
          messages.priceMessage,
          InputHints.ExpectingInput
        ),
      })
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error occured when running initialStep from priceDialog.js'
      throw error
    }
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async finalStep(stepContext) {
    try {
      const languageRecognition = await this.recognitionHelper.generateLanguageRecognition(
        stepContext
      )

      const inputTextHandlerResponse =
        await this.tvPurchaseDisambiguator.brandResponseHandlerByInputText(languageRecognition)

      if (inputTextHandlerResponse.inputIdentified)
        return stepContext.endDialog(inputTextHandlerResponse.choice)

      if (stepContext.values && stepContext.values.numberOfAttempts < MAXIMUM_NUMBER_OF_ATTEMPTS)
        return stepContext.replaceDialog(
          TV_PURCHASE_PRICE_WATERFALL_DIALOG,
          stepContext.values.numberOfAttempts++
        )

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
          : 'Error occured when running finalStep from priceDialog.js'
      throw error
    }
  }
}

module.exports.PriceDialog = PriceDialog
