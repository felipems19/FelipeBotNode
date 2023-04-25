class StringHandler {
  async normalizeString(stringToNormalize) {
    try {
      if (stringToNormalize && typeof stringToNormalize === 'string') {
        return stringToNormalize
          .toLowerCase()
          .normalize('NFD')
          .replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, '')
      }
      return stringToNormalize
    } catch (error) {
      error.additionalDescription =
        error && error.additionalDescription
          ? error.additionalDescription
          : 'Error happened during string normalization in stringFormatUtils.js'
      throw error
    }
  }
}

module.exports.StringHandler = StringHandler
