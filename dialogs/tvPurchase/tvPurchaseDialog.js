const { MessageFactory, InputHints, ActivityTypes } = require('botbuilder')
const { TextPrompt, WaterfallDialog, WaterfallStepContext } = require('botbuilder-dialogs')
const { SampleBotLuisRecognizer, SampleBotQnARecognizer } = require('../../cognitiveServices')
const { RecognitionHelper } = require('../../cognitiveServices/helpers/recognitionHelper')
const { Accessors } = require('../../statePropertyAccessors')
const { BaseDialog } = require('../baseDialog')
const { GenericDisambiguator } = require('../../helpers/dialogs/genericDisambiguator')
const { TvPurchaseDisambiguator } = require('./helpers/tvPurchaseDisambiguator')

const { dialogs, prompts } = require('../../config')
const messages = require('./helpers/messages')
const { BrandDialog } = require('./components/brandDialog')

const TV_PURCHASE_WATERFALL_DIALOG = 'tvPurchaseDialog'
const TV_PURCHASE_BRAND_WATERFALL_DIALOG = 'tvPurchaseBrandComponentDialog'
const TV_PURCHASE_PRICE_WATERFALL_DIALOG = 'tvPurchasePriceComponentDialog'

class TvPurchaseDialog extends BaseDialog {
  /**
   * @param {SampleBotLuisRecognizer} luisRecognizer
   * @param {SampleBotQnARecognizer} qnaRecognizer
   * @param {RecognitionHelper} recognitionHelper
   * @param {GenericDisambiguator} genericDisambiguator
   * @param {TvPurchaseDisambiguator} tvPurchaseDisambiguator
   * @param {Accessors} accessors
   */
  constructor(
    luisRecognizer,
    qnaRecognizer,
    recognitionHelper,
    genericDisambiguator,
    tvPurchaseDisambiguator,
    accessors
  ) {
    super(dialogs.tvPurchase)

    if (!luisRecognizer)
      throw new Error("[TvPurchaseDialog]: Missing parameter 'luisRecognizer' is required")
    this.luisRecognizer = luisRecognizer

    if (!qnaRecognizer)
      throw new Error("[TvPurchaseDialog]: Missing parameter 'qnaRecognizer' is required")
    this.qnaRecognizer = qnaRecognizer

    if (!recognitionHelper)
      throw new Error("[TvPurchaseDialog]: Missing parameter 'recognitionHelper' is required")
    this.recognitionHelper = recognitionHelper

    if (!genericDisambiguator)
      throw new Error("[TvPurchaseDialog]: Missing parameter 'genericDisambiguator' is required")
    this.genericDisambiguator = genericDisambiguator

    if (!tvPurchaseDisambiguator)
      throw new Error("[TvPurchaseDialog]: Missing parameter 'tvPurchaseDisambiguator' is required")
    this.tvPurchaseDisambiguator = tvPurchaseDisambiguator

    if (!accessors) throw new Error("[TvPurchaseDialog]: Missing parameter 'accessors' is required")
    this.accessors = accessors

    this.addDialog(
      new BrandDialog(
        this.recognitionHelper,
        this.genericDisambiguator,
        this.tvPurchaseDisambiguator
      )
    )
    this.addDialog(new TextPrompt(prompts.textPrompt)).addDialog(
      new WaterfallDialog(TV_PURCHASE_WATERFALL_DIALOG, [
        this.initialStep.bind(this),
        this.secondStep.bind(this),
        this.thirdStep.bind(this),
      ])
    )
    this.initialDialogId = TV_PURCHASE_WATERFALL_DIALOG
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async initialStep(stepContext) {
    try {
      await this.accessors.currentDialog.set(stepContext.context, dialogs.tvPurchase)
      await this.accessors.dialogComplete.set(stepContext.context, false)

      await stepContext.context.sendActivities([
        { type: ActivityTypes.Typing },
        { type: 'delay', value: 1000 },
        MessageFactory.text(messages.firstMessage, messages.firstMessage, InputHints.IgnoringInput),
        { type: ActivityTypes.Typing },
        { type: 'delay', value: 1000 },
      ])

      stepContext.values.tvDetails = {}
      return stepContext.beginDialog(TV_PURCHASE_BRAND_WATERFALL_DIALOG)
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error occured when running initialStep from tvPurchaseDialog.js'
      throw error
    }
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async secondStep(stepContext) {
    try {
      stepContext.values.tvDetails.brand = stepContext.result
      // Feel free to log results here

      return stepContext.beginDialog(TV_PURCHASE_PRICE_WATERFALL_DIALOG)
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error when executing the secondStep of tvPurchaseDialog.js'
      throw new Error(error)
    }
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async thirdStep(stepContext) {
    try {
      return stepContext.context.sendActivity(
        MessageFactory.text('random text', 'random text', InputHints.IgnoringInput)
      )
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error when executing the secondStep of tvPurchaseDialog.js'
      throw new Error(error)
    }
  }
}

module.exports.TvPurchaseDialog = TvPurchaseDialog
