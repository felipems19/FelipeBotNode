const { ActionTypes } = require('botframework-schema')
const { dialogs, buttons } = require('../../../config')

module.exports = {
  defaultMenuMessage: 'What else can I do for you?',
  menuSuggestedActions: [
    {
      type: ActionTypes.MessageBack,
      title: buttons.purchaseTV,
      value: {
        source: buttons.button,
        nextStep: {
          itsRedirect: false,
          name: dialogs.tvPurchase,
        },
        button: 'purchaseTV',
      },
      text: buttons.purchaseTV,
      displayText: buttons.purchaseTV,
    },
    {
      type: ActionTypes.MessageBack,
      title: buttons.thatsAllForToday,
      value: {
        source: buttons.button,
        nextStep: {
          itsRedirect: false,
          name: dialogs.mainFarewell,
        },
        button: 'thatsAllForToday',
      },
      text: buttons.thatsAllForToday,
      displayText: buttons.thatsAllForToday,
    },
  ],
}
