const {
  DialogSet,
  DialogTurnStatus,
  WaterfallDialog,
  WaterfallStepContext,
} = require('botbuilder-dialogs')
const { TurnContext } = require('botbuilder-core')
const { SampleBotLuisRecognizer, SampleBotQnARecognizer } = require('../cognitiveServices')
const { RecognitionHelper } = require('../cognitiveServices/helpers/recognitionHelper')
const { Accessors } = require('../statePropertyAccessors/accessors')

const { BaseDialog } = require('./baseDialog')
const { ExceptionDialog } = require('./exception/exceptionDialog')
const { OnBoardingDialog } = require('./onBoarding/onBoardingDialog')
const { MenuDialog } = require('./menu/menuDialog')
const { FarewellDialog } = require('./farewell/farewellDialog')
const { TvPurchaseDialog } = require('./tvPurchase/tvPurchaseDialog')

const { GenericDisambiguator } = require('../helpers/dialogs/genericDisambiguator')
const { OnBoardingDisambiguator } = require('./onBoarding/helpers/onBoardingDisambiguator')
const { MenuDisambiguator } = require('./menu/helpers/menuDisambiguator')
const { FarewellDisambiguator } = require('./farewell/helpers/farewellDisambiguator')
const { TvPurchaseDisambiguator } = require('./tvPurchase/helpers/tvPurchaseDisambiguator')

const { ArrayHandler } = require('../utils/arrayHandler')
const { StringHandler } = require('../utils')
const { dialogs } = require('../config')

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog'

class MainDialog extends BaseDialog {
  /**
   * @param {SampleBotLuisRecognizer} luisRecognizer
   * @param {SampleBotQnARecognizer} qnaRecognizer
   * @param {RecognitionHelper} recognitionHelper
   * @param {Accessors} accessors
   */
  constructor(luisRecognizer, qnaRecognizer, recognitionHelper, accessors) {
    super(dialogs.main)

    if (!luisRecognizer)
      throw new Error("[MainDialog]: Missing parameter 'luisRecognizer' is required")
    this.luisRecognizer = luisRecognizer

    if (!qnaRecognizer)
      throw new Error("[MainDialog]: Missing parameter 'qnaRecognizer' is required")
    this.qnaRecognizer = qnaRecognizer

    if (!recognitionHelper)
      throw new Error("[MainDialog]: Missing parameter 'recognitionHelper' is required")
    this.recognitionHelper = recognitionHelper

    if (!accessors) throw new Error("[MainDialog]: Missing parameter 'accessors' is required")
    this.accessors = accessors

    this.arrayHandler = new ArrayHandler()
    this.stringHandler = new StringHandler()

    this.exceptionDialog = new ExceptionDialog(
      this.luisRecognizer,
      this.accessors,
      this.arrayHandler
    )

    this.genericDisambiguator = new GenericDisambiguator(this.qnaRecognizer, this.accessors)
    this.onBoardingDisambiguator = new OnBoardingDisambiguator(
      this.genericDisambiguator,
      this.stringHandler,
      this.accessors
    )
    this.menuDisambiguator = new MenuDisambiguator(
      this.genericDisambiguator,
      this.stringHandler,
      this.accessors
    )
    this.farewellDisambiguator = new FarewellDisambiguator(
      this.genericDisambiguator,
      this.stringHandler,
      this.accessors
    )
    this.tvPurchaseDisambiguator = new TvPurchaseDisambiguator(
      this.genericDisambiguator,
      this.stringHandler,
      this.accessors
    )

    // Define the main dialog and its related components.
    this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [this.coreStep.bind(this)]))
      .addDialog(
        new OnBoardingDialog(
          this.luisRecognizer,
          this.qnaRecognizer,
          this.recognitionHelper,
          this.genericDisambiguator,
          this.onBoardingDisambiguator,
          this.accessors
        )
      )
      .addDialog(
        new MenuDialog(
          this.luisRecognizer,
          this.qnaRecognizer,
          this.recognitionHelper,
          this.genericDisambiguator,
          this.menuDisambiguator,
          this.accessors,
          parseFloat(process.env.BOT_V1)
        )
      )
      .addDialog(
        new FarewellDialog(
          this.luisRecognizer,
          this.qnaRecognizer,
          this.recognitionHelper,
          this.genericDisambiguator,
          this.farewellDisambiguator,
          this.accessors,
          parseFloat(process.env.BOT_V1)
        )
      )
      .addDialog(
        new TvPurchaseDialog(
          this.luisRecognizer,
          this.qnaRecognizer,
          this.recognitionHelper,
          this.genericDisambiguator,
          this.tvPurchaseDisambiguator,
          this.accessors
        )
      )

    this.initialDialogId = MAIN_WATERFALL_DIALOG
  }

  /**
   * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
   * If no dialog is active, it will start the default dialog.
   * @param {TurnContext} turnContext
   * @param {Object} dialogStateAccessor
   */
  async run(turnContext, dialogStateAccessor) {
    const dialogSet = new DialogSet(dialogStateAccessor)
    dialogSet.add(this)
    dialogSet.add(this.exceptionDialog)

    const dialogContext = await dialogSet.createContext(turnContext)
    const results = await dialogContext.continueDialog()

    if (results && results.status === DialogTurnStatus.empty) {
      await dialogContext.beginDialog(this.id)
    }
  }

  /**
   * @param {WaterfallStepContext} stepContext
   * @param {Object} innerUserData
   * @param {Boolean} faqAlreadyPerformed
   */
  async route(stepContext, innerUserData, faqAlreadyPerformed) {
    const languageRecognition = await this.recognitionHelper.getLanguageRecognition(stepContext)
    await this.recognitionHelper.saveLanguageRecognition(languageRecognition, stepContext)

    const userData = innerUserData || (await this.accessors.userData.get(stepContext.context, {}))
    const chosenChildren = await this.childrenThatCanHandle(languageRecognition, userData)

    if (chosenChildren && Array.isArray(chosenChildren) && chosenChildren.length > 0) {
      await stepContext.cancelAllDialogs()

      if (
        stepContext.options &&
        Object.prototype.hasOwnProperty.call(stepContext.options, 'callCanHandle')
      )
        delete stepContext.options.callCanHandle

      // if true, it means that there's nothing else the bot could do besides going to exception
      // (faq already performed and the bot still doesn't know what to do with user input)
      if (faqAlreadyPerformed && chosenChildren[0] === dialogs.mainFaq)
        chosenChildren[0] = dialogs.exception

      // chosenChildren position 0 means the dialog with the highest confidence, being the one chosen to be started
      return stepContext.beginDialog(chosenChildren[0], { languageRecognition })
    }
    return false
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async onContinueDialog(stepContext) {
    // Below code verify whether a dialog has been completed or not. If so, call route method. If not, call super onContinueDialog
    const dialogComplete = await this.accessors.dialogComplete.get(stepContext.context, {})
    if (dialogComplete === true) {
      const result = await this.route(stepContext)
      if (result) return result
    }

    return super.onContinueDialog(stepContext)
  }

  /**
   * @param {WaterfallStepContext} stepContext
   */
  async coreStep(stepContext) {
    const userData = await this.accessors.userData.get(stepContext.context, {})

    if (stepContext.options && stepContext.options.callCanHandle) {
      const result = await this.route(
        stepContext,
        userData,
        stepContext.options.faqAlreadyPerformed
      )
      return result || stepContext.cancelAllDialogs(true)
    }
    return stepContext.replaceDialog(dialogs.onBoarding)
  }
}

module.exports.MainDialog = MainDialog
