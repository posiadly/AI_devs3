import fs from "fs";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions.mjs";
import { cityPrompt } from "./prompts.js";
import { OpenAIService } from "../tools/OpenAIService.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadGraphics(
  directory: string,
): Promise<Buffer<ArrayBufferLike>[]> {
  const graphics: Buffer<ArrayBufferLike>[] = [];
  fs.readdirSync(directory, { withFileTypes: true }).forEach(async (file) => {
    const buffer = readFileSync(path.join(directory, file.name));
    graphics.push(buffer);
  });
  return graphics;
}

function prepareContentForVLM(
  graphics: Buffer<ArrayBufferLike>[],
): ChatCompletionContentPart[] {
  return graphics.map((graphic) => ({
    type: "image_url",
    image_url: {
      url: `data:image/jpeg;base64,${graphic.toString("base64")}`,
    },
  }));
}

function extractCityName(response: string): string {
  const cityName = response.match(/<CITY>(.*?)<\/CITY>/)?.[1];
  return cityName ?? "";
}
async function main() {
  try {
    const graphics = await loadGraphics(path.join(__dirname, "images"));
    const content = prepareContentForVLM(graphics);

    const aiService = new OpenAIService();
    const response = await aiService.query(cityPrompt, content);
    console.log(
      `🙋 Answer from model:\n▶ Beginning of Answer\n${response}\n◀ End of Answer`,
    );
    const cityName = extractCityName(response);
    console.log(`🏙️ City name: ${cityName}`);
    if (cityName) {
      console.log("✅ Flag found:", cityName);
    } else {
      console.log("🛑 Flag not found");
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log("🛑 Error occurred:", error.message);
    } else {
      console.log("🛑 Unknown error occurred:", error);
    }
  }
}

main().catch((error) => {
  console.error("🛑 Error occurred:", error);
});
