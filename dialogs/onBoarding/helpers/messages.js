const { ActionTypes } = require('botframework-schema')
const { dialogs, buttons, steps } = require('../../../config')

module.exports = {
  firstMessage:
    'Hi there. Welcome to Sample Bot, an improved Chatbot with cutting edge dialog techniques.',
  secondMessage: (luisConfigured) =>
    luisConfigured
      ? 'LUIS configuration detected. Next step enabled'
      : 'NOTE: LUIS is not configured.',

  thirdMessage: 'Can we get started? These are some informatory questions you could ask.',
  firstOnBoardingSuggestedActions: [
    {
      type: ActionTypes.MessageBack,
      title: buttons.whatCanYouDo,
      value: {
        source: buttons.button,
        nextStep: {
          itsRedirect: false,
          name: steps.continueWaterFall,
        },
        button: 'whatCanYouDo',
      },
      text: buttons.whatCanYouDo,
      displayText: buttons.whatCanYouDo,
    },
    {
      type: ActionTypes.MessageBack,
      title: buttons.whoBuiltYou,
      value: {
        source: buttons.button,
        nextStep: {
          itsRedirect: false,
          name: steps.continueWaterFall,
        },
        button: 'whoBuiltYou',
      },
      text: buttons.whoBuiltYou,
      displayText: buttons.whoBuiltYou,
    },
  ],
  fourthMessage: `Currently I am only capable of demonstrating dialog capabilities. For example, if you ask me for a menu, I'll be able to find it by using my 'canHandle' methodology.`,
  secondOnBoardingSuggestedActions: [
    {
      type: ActionTypes.MessageBack,
      title: buttons.whoBuiltYou,
      value: {
        source: buttons.button,
        nextStep: {
          itsRedirect: false,
          name: steps.continueWaterFall,
        },
        button: 'whoBuiltYou',
      },
      text: buttons.whoBuiltYou,
      displayText: buttons.whoBuiltYou,
    },
    {
      type: ActionTypes.MessageBack,
      title: buttons.menu,
      value: {
        source: buttons.button,
        nextStep: {
          itsRedirect: false,
          name: dialogs.menu,
        },
        button: 'menu',
      },
      text: buttons.menu,
      displayText: buttons.menu,
    },
  ],
  fifthMessage: `I'm being developed by Felipe Marques Santos, a Chatbot developer specialized on Microsoft Bot Framework.`,
  thirdOnBoardingSuggestedActions: [
    {
      type: ActionTypes.MessageBack,
      title: buttons.whatCanYouDo,
      value: {
        source: buttons.button,
        nextStep: {
          itsRedirect: false,
          name: steps.continueWaterFall,
        },
        button: 'whatCanYouDo',
      },
      text: buttons.whatCanYouDo,
      displayText: buttons.whatCanYouDo,
    },
    {
      type: ActionTypes.MessageBack,
      title: buttons.menu,
      value: {
        source: buttons.button,
        nextStep: {
          itsRedirect: false,
          name: dialogs.menu,
        },
        button: 'menu',
      },
      text: buttons.menu,
      displayText: buttons.menu,
    },
  ],
}
