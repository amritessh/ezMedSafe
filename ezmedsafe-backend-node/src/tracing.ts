// ezmedsafe-backend-node/src/tracing.ts
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

const exporterOptions = {
  url: 'http://jaeger:4318/v1/traces', // Jaeger OTLP HTTP endpoint in Docker Compose
};

// This service name will appear in Jaeger UI
const serviceName = 'ezmedsafe-backend';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  }),
  traceExporter: new OTLPTraceExporter(exporterOptions),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
console.log('OpenTelemetry tracing initialized for backend.');

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry tracing shut down.'))
    .catch((error) => console.log('Error shutting down OpenTelemetry tracing', error))
    .finally(() => process.exit(0));
});