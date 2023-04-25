const { ActionTypes } = require('botframework-schema')
const { buttons, steps } = require('../../../config')

module.exports = {
  firstMessage: 'It was really nice to have you here! What did you think of our chat? 😊',
  npsSuggestedActions: [
    {
      type: ActionTypes.MessageBack,
      title: buttons.iLovedIt,
      value: {
        source: buttons.button,
        nextStep: {
          itsRedirect: false,
          name: steps.continueWaterFall,
        },
        button: 'iLovedIt',
      },
      text: buttons.iLovedIt,
      displayText: buttons.iLovedIt,
    },
    {
      type: ActionTypes.MessageBack,
      title: buttons.iThoughtItWasOk,
      value: {
        source: buttons.button,
        nextStep: {
          itsRedirect: false,
          name: steps.continueWaterFall,
        },
        button: 'iThoughtItWasOk',
      },
      text: buttons.iThoughtItWasOk,
      displayText: buttons.iThoughtItWasOk,
    },
    {
      type: ActionTypes.MessageBack,
      title: buttons.iDidntLikeIt,
      value: {
        source: buttons.button,
        nextStep: {
          itsRedirect: false,
          name: steps.continueWaterFall,
        },
        button: 'iDidntLikeIt',
      },
      text: buttons.iDidntLikeIt,
      displayText: buttons.iDidntLikeIt,
    },
  ],
  secondMessage:
    'Feel free to reach out Felipe for more details about this project. E-mail: felipe.marques19@gmail.com. Linkedin: linkedin.com/in/felipe-marques-santos-679b946b.',
  thirdMessage: 'Hope to talk to you more often. See you! 👋🏼',
}
