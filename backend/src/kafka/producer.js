const { Kafka, logLevel } = require('kafkajs');

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const clientId = process.env.KAFKA_CLIENT_ID || 'connect4-backend';
const analyticsTopic = process.env.KAFKA_ANALYTICS_TOPIC || 'game-analytics';

const kafka = new Kafka({ clientId, brokers, logLevel: logLevel.WARN });
const producer = kafka.producer({ allowAutoTopicCreation: true });

let producerConnected = false;

async function connectProducer() {
  try {
    await producer.connect();
    producerConnected = true;
    console.log('Kafka producer connected');
  } catch (err) {
    producerConnected = false;
    console.warn('Kafka producer connect failed — continuing without Kafka', err.message || err);
    // do not throw — analytics is optional; gameplay must continue
  }
}

async function disconnectProducer() {
  try {
    if (producerConnected) await producer.disconnect();
  } catch (err) {
    console.warn('Kafka producer disconnect error', err.message || err);
  } finally {
    producerConnected = false;
  }
}

async function sendEvent(topic, event) {
  const t = topic || analyticsTopic;
  if (!event) return;
  // ensure event has timestamp
  if (!event.timestamp) event.timestamp = new Date().toISOString();
  const payload = {
    topic: t,
    messages: [{ key: event.gameId || null, value: JSON.stringify(event) }],
  };
  try {
    if (!producerConnected) {
      // try to connect lazily
      await connectProducer();
    }
    if (!producerConnected) {
      console.warn('Kafka producer not connected — dropping analytics event', event.type || 'unknown');
      return;
    }
    await producer.send(payload);
  } catch (err) {
    console.warn('Failed to send Kafka event — event dropped', err.message || err, { topic: t });
  }
}

module.exports = {
  connectProducer,
  disconnectProducer,
  sendEvent,
};

