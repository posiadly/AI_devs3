import axios from "axios";
import dotenv from "dotenv";
import { OpenAIService } from "../tools/OpenAIService.js";
import { preparePromptForPictureGeneration } from "./prompt.js";
import fs from "fs";
import { extractFlag } from "../tools/FlagExtractor.js";
import { sendAnswer } from "../tools/SendAnswer.js";
dotenv.config();

async function main() {
  try {
    if (!process.env.S02E03_FILE_URL) {
      throw new Error("S02E03_FILE_URL environment variable is not defined");
    }
    if (!process.env.S02E03_DOWNLOADED_PICUTRE_PATH) {
      throw new Error(
        "S02E03_DOWNLOADED_PICUTRE_PATH environment variable is not defined",
      );
    }
    const fileUrl = process.env.S02E03_FILE_URL;
    const file = await axios.get(fileUrl);
    console.log(
      `▶ File content:\n${JSON.stringify(file.data)}\n◀ End of File Content`,
    );

    const aiService = new OpenAIService();
    const prompt = await aiService.query(
      preparePromptForPictureGeneration,
      file.data.description,
    );
    console.log(
      `▶ Prompt for picture generation:\n${prompt}\n◀ End of Prompt`,
    );

    const result = await aiService.generateImage(prompt, "dall-e-3");
    console.log(
      `🙋Picture generated (base64 length: ${result.picture.length})`,
    );
    //save the picture to the file
    fs.writeFileSync(
      process.env.S02E03_DOWNLOADED_PICUTRE_PATH,
      Buffer.from(result.picture, "base64"),
    );
    console.log(
      `💾 Picture saved to ${process.env.S02E03_DOWNLOADED_PICUTRE_PATH}`,
    );

    const msg = await sendAnswer(
      "robotid",
      result.url,
      process.env.S02E03_VERIFICATION_URL!,
    );
    console.log("ℹ️ Response for answer:", msg);
    const flag = extractFlag(msg.message);
    if (flag) {
      console.log("✅ Flag found:", flag);
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

main();
