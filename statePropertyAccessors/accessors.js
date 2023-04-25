const { UserState, ConversationState, Storage } = require('botbuilder')
const { BotProperty } = require('./botProperty')

class Accessors {
  /**
   * @param {Storage} storage
   */
  constructor(storage) {
    if (!storage) throw new Error('[Accessors]: Missing parameter. storage is required')
    this.storage = storage

    this.conversationState = new ConversationState(this.storage)
    this.userState = new UserState(this.storage)

    this.userData = new BotProperty(this.userState, 'userData')
    this.currentDialog = new BotProperty(this.conversationState, 'currentDialog')
    this.previousDialog = new BotProperty(this.conversationState, 'previousDialog')
    this.conversationData = new BotProperty(this.conversationState, 'conversationData')
    this.dialogComplete = new BotProperty(this.conversationState, 'dialogComplete')
    this.isSecondException = new BotProperty(this.conversationState, 'isSecondException')
  }
}

module.exports.Accessors = Accessors
