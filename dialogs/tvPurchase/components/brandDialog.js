const { MessageFactory, InputHints } = require('botbuilder')
const { TextPrompt, WaterfallDialog, WaterfallStepContext } = require('botbuilder-dialogs')
const { BaseDialog } = require('../../baseDialog')
const { TvPurchaseDisambiguator } = require('../helpers/tvPurchaseDisambiguator')
const { RecognitionHelper } = require('../../../cognitiveServices/helpers/recognitionHelper')
const { dialogs, prompts, steps } = require('../../../config')
const messages = require('../helpers/messages')

const TV_PURCHASE_BRAND_WATERFALL_DIALOG = 'tvPurchaseBrandComponentDialog'
const MAXIMUM_NUMBER_OF_ATTEMPTS = 1

class BrandDialog extends BaseDialog {
  /**
   * @param {RecognitionHelper} recognitionHelper
   * @param {TvPurchaseDisambiguator} tvPurchaseDisambiguator
   */
  constructor(recognitionHelper, genericDisambiguator, tvPurchaseDisambiguator) {
    super(dialogs.tvPurchaseBrandComponent)

    if (!recognitionHelper)
      throw new Error("[BrandDialog]: Missing parameter 'recognitionHelper' is required")
    this.recognitionHelper = recognitionHelper

    if (!genericDisambiguator)
      throw new Error("[BrandDialog]: Missing parameter 'genericDisambiguator' is required")
    this.genericDisambiguator = genericDisambiguator

    if (!tvPurchaseDisambiguator)
      throw new Error("[BrandDialog]: Missing parameter 'tvPurchaseDisambiguator' is required")
    this.tvPurchaseDisambiguator = tvPurchaseDisambiguator

    this.addDialog(new TextPrompt(prompts.textPrompt)).addDialog(
      new WaterfallDialog(TV_PURCHASE_BRAND_WATERFALL_DIALOG, [
        this.initialStep.bind(this),
        this.finalStep.bind(this),
      ])
    )
    this.initialDialogId = TV_PURCHASE_BRAND_WATERFALL_DIALOG
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async initialStep(stepContext) {
    try {
      stepContext.values.numberOfAttempts =
        stepContext.options && stepContext.options.numberOfAttempts
          ? stepContext.options.numberOfAttempts
          : 0

      let brandMessage
      if (stepContext.values.numberOfAttempts !== 0)
        brandMessage = messages.secondAttemptBrandMessage
      else brandMessage = messages.firstAttemptBrandMessage

      return stepContext.prompt(prompts.textPrompt, {
        prompt: MessageFactory.text(brandMessage, brandMessage, InputHints.ExpectingInput),
      })
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error occured when running initialStep from brandDialog.js'
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

      if (
        inputTextHandlerResponse.inputIdentified &&
        inputTextHandlerResponse.nextStep === steps.continueWaterFall
      )
        return stepContext.endDialog(inputTextHandlerResponse.choice)

      if (stepContext.values && stepContext.values.numberOfAttempts < MAXIMUM_NUMBER_OF_ATTEMPTS) {
        return stepContext.replaceDialog(TV_PURCHASE_BRAND_WATERFALL_DIALOG, {
          numberOfAttempts: stepContext.values.numberOfAttempts + 1,
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
          : 'Error occured when running finalStep from brandDialog.js'
      throw error
    }
  }
}

module.exports.BrandDialog = BrandDialog
