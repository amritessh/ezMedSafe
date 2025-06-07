import Kafka = require('node-rdkafka');
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'ezmedsafe-backend';
const KAFKA_CONNECTION_TIMEOUT = parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || '10000', 10); // 10 seconds timeout

let producer: Kafka.Producer | null = null;

export const initializeKafkaProducer = (): Promise<Kafka.Producer> => {
    return new Promise((resolve, reject) => {
        if (producer && producer.isConnected()) {
            return resolve(producer);
        }

        producer = new Kafka.Producer({
            'metadata.broker.list': KAFKA_BROKER,
            'client.id': KAFKA_CLIENT_ID,
            'dr_cb': true,
            'socket.keepalive.enable': true,
            'broker.address.family': 'v4'
        });

        producer.connect();

        let connectionTimeout: NodeJS.Timeout;

        producer.on('ready', () => {
            clearTimeout(connectionTimeout); // Clear timeout if connected
            console.log('Kafka producer connected successfully! (rdkafka ready)');
            resolve(producer as Kafka.Producer);
        });

        producer.on('event.error', (err) => {
            clearTimeout(connectionTimeout); // Clear timeout on any error event
            console.error('Error from Kafka producer:', err);
            // Check if it's a connection error we haven't handled yet
            if (err.code === Kafka.CODES.ERRORS.ERR__ALL_BROKERS_DOWN || err.code === Kafka.CODES.ERRORS.ERR__TRANSPORT) {
                reject(new Error(`Kafka connection error: ${err.message}`));
            } else {
                reject(err); // Reject for other errors
            }
        });

        producer.on('disconnected', (err) => {
            console.warn('Kafka producer disconnected:', err);
            // You might want to re-try connecting here or handle gracefully
        });

        producer.on('delivery-report', (err, report) => {
            if (err) {
                console.error('Kafka message delivery error:', err.message); // Too verbose for continuous log
            } else {
                console.log('Kafka message delivery report:', report); // Too verbose for continuous log
            }
        });

        // Set an explicit connection timeout
        connectionTimeout = setTimeout(() => {
            if (!producer || !producer.isConnected()) {
                producer?.disconnect(); // Use optional chaining
                reject(new Error(`Kafka producer failed to connect within ${KAFKA_CONNECTION_TIMEOUT}ms.`));
            }
        }, KAFKA_CONNECTION_TIMEOUT);
    });
};

export const getKafkaProducer = (): Kafka.Producer => {
    if (!producer || !producer.isConnected()) {
        console.error('Kafka producer not initialized or not connected. Please ensure initializeKafkaProducer was awaited during startup.');
        throw new Error('Kafka producer not ready or disconnected');
    }
    return producer;
};

export const disconnectKafkaProducer = async () => {
    if (producer && producer.isConnected()) {
        await producer.disconnect();
        console.log('Kafka producer disconnected.');
    }
};