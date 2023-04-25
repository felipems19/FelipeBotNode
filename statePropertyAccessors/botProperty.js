const { BotStatePropertyAccessor, TurnContext } = require('botbuilder')

class BotProperty extends BotStatePropertyAccessor {
  /**
   * @param {TurnContext} context
   * @param {Object} data
   */
  async update(context, data) {
    const old = await this.get(context, {})
    return this.set(context, {
      ...old,
      ...data,
    })
  }
}

module.exports.BotProperty = BotProperty
