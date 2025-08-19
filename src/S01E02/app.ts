import axios from "axios";
import dotenv from "dotenv";
import { OpenAIService } from "../tools/OpenAIService.js";
import { answerQuestion, extractInformationFromDump } from "./prompts.js";
import type { Message } from "./types.js";
import { extractFlag } from "../tools/FlagExtractor.js";

dotenv.config();

async function initConversation(): Promise<Message> {
  const msg: Message = {
    text: "READY",
    msgID: 0,
  };

  const response = await axios.post(process.env.S01E02_VERIFICATION_URL!, msg, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data as Message;
}
async function sendAnswer(msgID: number, answer: string): Promise<Message> {
  const msg: Message = {
    text: answer,
    msgID,
  };

  return (
    await axios.post(process.env.S01E02_VERIFICATION_URL!, msg, {
      headers: {
        "Content-Type": "application/json",
      },
    })
  ).data as Message;
}

async function main() {
  try {
    if (!process.env.ROBOTS_MEMORY_DUMP_URL) {
      throw new Error(
        "ROBOTS_MEMORY_DUMP_URL environment variable is not defined",
      );
    }
    if (!process.env.S01E02_VERIFICATION_URL) {
      throw new Error(
        "S01E02_VERIFICATION_URL environment variable is not defined",
      );
    }

    const memoryDump = await axios.get(process.env.ROBOTS_MEMORY_DUMP_URL);

    console.log(
      `▶ Memory dump content:\n${memoryDump.data}\n◀ End of Memory Dump`,
    );

    const aiService = new OpenAIService();
    const information = await aiService.query(
      extractInformationFromDump,
      memoryDump.data,
    );
    console.log(
      `▶ Information extracted from memory dump:\n${information}\n◀ End of Information`,
    );

    let msg = await initConversation();
    const msgId = msg.msgID;
    console.log("❔ Conversation initialized, question:", msg.text);
    const answer = await aiService.query(answerQuestion(information), msg.text);
    console.log("🙋 Answer from model:", answer);

    msg = await sendAnswer(msgId, answer);
    console.log("ℹ️ Response for answer:", msg.text);
    const flag = extractFlag(msg.text);
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
