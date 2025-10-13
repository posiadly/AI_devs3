import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import dotenv from "dotenv";

dotenv.config();

// Export the processor to be able to flush it
export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  exportMode: "immediate", // optional: configure immediate span export in serverless environments
});

const sdk = new NodeSDK({
  spanProcessors: [langfuseSpanProcessor],
});

sdk.start();
