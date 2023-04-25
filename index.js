/* eslint-disable no-console */
const path = require('path')
const restify = require('restify')
const {
  CloudAdapter,
  ConfigurationBotFrameworkAuthentication,
  NullTelemetryClient,
} = require('botbuilder')
const {
  ApplicationInsightsTelemetryClient,
  TelemetryInitializerMiddleware,
} = require('botbuilder-applicationinsights')
const { TelemetryLoggerMiddleware } = require('botbuilder-core')
const { SampleBot } = require('./bots/sampleBot')
const { MainDialog } = require('./dialogs/mainDialog')
const { SampleBotLuisRecognizer, SampleBotQnARecognizer } = require('./cognitiveServices')
const { RecognitionHelper } = require('./cognitiveServices/helpers/recognitionHelper')
const { Accessors } = require('./statePropertyAccessors')
const { AccessorsStorageFactory } = require('./databases')
const { TurnError, LogException } = require('./helpers')
const botApi = require('./api')

const ENV_FILE = path.join(__dirname, '.env')
require('dotenv').config({ path: ENV_FILE })

// Add telemetry middleware to the adapter middleware pipeline
const getTelemetryClient = () => {
  const instrumentationKey = process.env.InstrumentationKey
  if (instrumentationKey) {
    return new ApplicationInsightsTelemetryClient(instrumentationKey)
  }
  return new NullTelemetryClient()
}
const telemetryClient = getTelemetryClient()
const telemetryLoggerMiddleware = new TelemetryLoggerMiddleware(telemetryClient)
const initializerMiddleware = new TelemetryInitializerMiddleware(telemetryLoggerMiddleware)

const MEMORY_STORAGE = 'memory_storage'
const accessorsStorageFactory = new AccessorsStorageFactory()
const storage = accessorsStorageFactory.create(MEMORY_STORAGE)
const accessors = new Accessors(storage)

const logException = new LogException(telemetryClient, accessors)

// Luis setup
const { LuisAppId, LuisAPIKey, LuisAPIHostName } = process.env
const luisConfig = {
  applicationId: LuisAppId,
  endpointKey: LuisAPIKey,
  endpoint: LuisAPIHostName,
}
const luisRecognizer = new SampleBotLuisRecognizer(luisConfig, telemetryClient, accessors)
const luisThreshold = parseFloat(process.env.luisThreshold)

// QnaMaker setup
const {
  QnAKnowledgebaseId,
  QnAEndpointKey,
  QnAEndpointHostName,
  CognitiveServicesTimeout,
  QnAThreshold,
} = process.env
const qnaConfig = {
  knowledgeBaseId: QnAKnowledgebaseId,
  endpointKey: QnAEndpointKey,
  host: QnAEndpointHostName,
  timeout: CognitiveServicesTimeout,
  threshold: QnAThreshold,
}
const qnaRecognizer = new SampleBotQnARecognizer(qnaConfig, telemetryClient, accessors)

const recognitionHelper = new RecognitionHelper(luisRecognizer, luisThreshold, accessors)

// Create the main dialog.
const dialog = new MainDialog(luisRecognizer, qnaRecognizer, recognitionHelper, accessors)
const bot = new SampleBot(accessors, dialog)

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(process.env)
const turnError = new TurnError(accessors, telemetryClient, logException)

// Create adapter and assigning telemetry initializer middleware and onTurnError for the singleton CloudAdapter.
const adapter = new CloudAdapter(botFrameworkAuthentication)
adapter.use(initializerMiddleware)
adapter.onTurnError = turnError.onTurnErrorHandler

// Create HTTP server
const server = restify.createServer()
server.use(restify.plugins.bodyParser())

server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\n${server.name} listening to ${server.url}`)
})

// Create bot api routes
botApi.createRoutes(
  server,
  adapter,
  bot,
  botFrameworkAuthentication,
  turnError,
  process.env.TimeoutBotActivated
)
