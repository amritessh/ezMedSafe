import Kafka = require('node-rdkafka');
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092'; // Use Docker service name 'kafka' for inter-container communication, or localhost:9092 for external
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'ezmedsafe-backend';

let producer: Kafka.Producer | null = null;

export const initializeKafkaProducer = (): Promise<Kafka.Producer> => {
    return new Promise((resolve, reject) => {
        if (producer) {
            return resolve(producer);
        }

        producer = new Kafka.Producer({
            'metadata.broker.list': KAFKA_BROKER,
            'client.id': KAFKA_CLIENT_ID,
            'dr_cb': true, // Delivery report callback
            'socket.keepalive.enable': true, // Enable keepalive
            'broker.address.family': 'v4' // Force IPv4 if needed
        });

        producer.connect();

        producer.on('ready', () => {
            console.log('Kafka producer connected successfully!');
            resolve(producer as Kafka.Producer);
        });

        producer.on('event.error', (err) => {
            console.error('Error from Kafka producer:', err);
            reject(err);
        });

        // Handle delivery reports to ensure messages are sent
        producer.on('delivery-report', (err, report) => {
            if (err) {
                console.error('Kafka delivery error:', err.message);
            } else {
                // console.log('Kafka delivery report:', report);
            }
        });

        // Ensure producer is ready within a reasonable timeout
        setTimeout(() => {
            if (!producer || !producer.isConnected()) {
                console.error('Kafka producer failed to connect within timeout.');
                reject(new Error('Kafka producer timeout'));
            }
        }, 10000); // 10 seconds timeout
    });
};

// Call this once on application startup (e.g., in server.ts)
// initializeKafkaProducer().catch(err => console.error("Failed to init Kafka producer:", err));

export const getKafkaProducer = (): Kafka.Producer => {
    if (!producer || !producer.isConnected()) {
        console.error('Kafka producer not initialized or not connected. Reinitializing...');
        // In a real application, you might have a more robust retry mechanism or throw an error.
        // For MVP, we'll attempt to initialize again.
        initializeKafkaProducer().catch(err => console.error("Failed to re-init Kafka producer:", err));
        throw new Error('Kafka producer not ready'); // Or return null/undefined
    }
    return producer;
};

export const disconnectKafkaProducer = () => {
    if (producer && producer.isConnected()) {
        producer.disconnect();
        console.log('Kafka producer disconnected.');
    }
};