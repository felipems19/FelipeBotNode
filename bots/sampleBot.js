const { ActivityHandler } = require('botbuilder')
const { Accessors } = require('../statePropertyAccessors')

class SampleBot extends ActivityHandler {
  /**
   * @param {Accessors} accessors
   * @param {Object} dialog
   */
  constructor(accessors, dialog) {
    super()

    if (!accessors) throw new Error('[SampleBot]: Missing parameter. accessors is required')
    this.accessors = accessors

    if (!dialog) throw new Error('[SampleBot]: Missing parameter. dialog is required')
    this.dialog = dialog

    this.dialogState = this.accessors.conversationState.createProperty('DialogState')

    this.onMessage(async (context, next) => {
      await this.dialog.run(context, this.dialogState)

      // By calling next() you ensure that the next BotHandler is run.
      await next()
    })

    this.onMembersAdded(async (context, next) => {
      const { membersAdded } = context.activity
      const dialogsToRun = []

      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id !== context.activity.recipient.id) {
          dialogsToRun.push(this.dialog.run(context, this.dialogState))
        }
      }
      await Promise.all(dialogsToRun)

      // By calling next() you ensure that the next BotHandler is run.
      await next()
    })

    // last event for an incoming activity.
    this.onDialog(async (context, next) => {
      const conversationData = await this.accessors.conversationData.get(context, {})
      if (conversationData && conversationData.recognizedTracking) {
        delete conversationData.recognizedTracking
        await this.accessors.conversationData.set(context, conversationData)
      }

      // Save any state changes. The load happened during the execution of the Dialog.
      await this.accessors.conversationState.saveChanges(context, false)
      await this.accessors.userState.saveChanges(context, false)

      // By calling next() you ensure that the next BotHandler is run.
      await next()
    })
  }
}

module.exports.SampleBot = SampleBot
