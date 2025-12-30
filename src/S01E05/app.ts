import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import { OpenAIService } from "../tools/OpenAIService.js";
import { censorePrompt } from "./prompts.js";
import { sendAnswer } from "../tools/SendAnswer.js";
import { extractFlag } from "../tools/FlagExtractor.js";
dotenv.config();

async function main() {
  try {
    if (!process.env.S01E05_FILE_URL) {
      throw new Error("S01E05_FILE_URL environment variable is not defined");
    }
    if (!process.env.S01E05_FILE_LOCAL_PATH) {
      throw new Error(
        "S01E05_FILE_LOCAL_PATH environment variable is not defined",
      );
    }

    const file = await axios.get(process.env.S01E05_FILE_URL);

    //save original file to disk
    fs.writeFileSync(
      process.env.S01E05_FILE_LOCAL_PATH,
      JSON.stringify(file.data),
    );
    console.log(
      `💾 Original file saved to ${process.env.S01E05_FILE_LOCAL_PATH}`,
    );

    const response = await new OpenAIService().query(censorePrompt, file.data);
    console.log("🙋 Response from model:", response);
    const msg = await sendAnswer(
      "CENZURA",
      response,
      process.env.S01E05_VERIFICATION_URL!,
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
