const _ = require('lodash')

class ArrayHandler {
  async randomItemFromArray(array) {
    try {
      const i = _.random(array.length - 1)
      return array[i]
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error happened when running randomItemFromArray method from arrayHandler.js'
      throw error
    }
  }
}

module.exports.ArrayHandler = ArrayHandler
