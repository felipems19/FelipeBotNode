const { BlobsStorage } = require('botbuilder-azure-blobs')
const { MemoryStorage } = require('botbuilder')
const { storage } = require('../config')

const BLOB_CONTAINER = 'blob_container'

class AccessorsStorageFactory {
  /**
   * Method responsible for creating a specific memory storage object
   * @param {String} storageName
   *
   * @returns storage object
   */
  create(storageName) {
    switch (storageName) {
      case BLOB_CONTAINER:
        return new BlobsStorage(storage.AzureStorageConnectionString, storage.AzureBlobContainer)
      default:
        return new MemoryStorage()
    }
  }
}

module.exports = {
  AccessorsStorageFactory,
}
