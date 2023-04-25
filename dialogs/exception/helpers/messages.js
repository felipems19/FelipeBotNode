const { ActionTypes } = require('botframework-schema')
const { buttons } = require('../../../config')

module.exports = {
  commonFirstExceptionMessage11: `Sorry, I didn't understand.`,
  commonFirstExceptionMessage12: `Let's try again?`,
  commonFirstExceptionMessage2: `I'm still learning new things.<br>Try asking in a different/simpler way, please.`,
  commonFirstExceptionMessage3: 'As an example: Order status.',

  commonSecondExceptionMessage1: `Hmm, I haven't understood it yet!`,
  commonSecondExceptionMessage2: `I'll suggest you some topics.`,

  exceptionSuggestions: [
    {
      type: ActionTypes.MessageBack,
      title: buttons.doubts,
      value: { source: buttons.button },
      text: buttons.doubts,
      displayText: buttons.doubts,
    },
    {
      type: ActionTypes.MessageBack,
      title: buttons.thatsAllForToday,
      value: { source: buttons.button },
      text: buttons.thatsAllForToday,
      displayText: buttons.thatsAllForToday,
    },
  ],

  commonAPIExceptionMessage11: (data) =>
    `${data.name}, tive um imprevisto com a minha conexão e não consigo acessar essas informações agora. 📝`,
  commonAPIExceptionMessage12: `Tive um imprevisto com a minha conexão e não consigo acessar essas informações agora. 📝`,
  commonAPIExceptionMessage2: 'Você pode tentar novamente mais tarde, tá bom?',
  commonAPIExceptionMessage3:
    'Ou, se preferir, o pessoal da Central de Atendimento pode te ajudar:<br>3004-5030 (capitais e regiões metropolitanas) ou<br>0800 725 0025 (Rio de Janeiro). 📞',
  commonAPIExceptionMessage4:
    'O horário de atendimento é de segunda a sábado das 8h às 20h, exceto feriados nacionais. 📅',
}
