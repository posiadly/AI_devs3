import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import { OpenAIService } from "../tools/OpenAIService.js";
import { extractFlag } from "../tools/FlagExtractor.js";
import { Tokenizer } from "../tools/Tokenizer.js";
import { answerQuestionsPrompt } from "./prompts.js";
import type { Answer, Message, TestData } from "../S01E03/types.js";

dotenv.config();

const gpt4_1params = {
  contextWindowSize: 128000,
  maxOutputTokens: 16384,
};
const model = "gpt-4o";

async function sendAnswer(data: any): Promise<Answer> {
  const dataToSend = { ...data };
  dataToSend.apikey = process.env.API_KEY!;
  const msg: Message = {
    task: "JSON",
    apikey: process.env.API_KEY!,
    answer: dataToSend,
  };

  return (
    await axios.post(process.env.S01E03_VERIFICATION_URL!, msg, {
      headers: {
        "Content-Type": "application/json",
      },
    })
  ).data as Answer;
}

function correctCalculation(data: TestData[]) {
  data.forEach((item: TestData) => {
    const [num1, num2] = item.question.split("+").slice(0, 2).map(Number);
    const result = num1! + num2!;
    if (item.answer !== result) {
      console.log(
        `ℹ️  Incorrect answer for question "${item.question}". Expected ${result}, but got ${item.answer}. Correcting it.`,
      );
      item.answer = result;
    }
  });
}

async function answerQuestions(data: TestData[]) {
  const openAIService = new OpenAIService();
  const questions = data
    .filter((item) => item.test)
    .map((item) => ({ question: item.test!.q, answer: "" }));

  console.log("❔ Retrieved questions:", questions);
  const response = await openAIService.query(
    answerQuestionsPrompt,
    JSON.stringify(questions),
  );
  console.log("🙋 Answer from model:", response);

  const answers: { [key: string]: string } = {};
  JSON.parse(response).forEach((item: any) => {
    answers[item.question] = item.answer;
  });

  data
    .filter((item) => item.test)
    .forEach((item) => {
      item.test!.q = answers[item.test!.q]!;
    });
}

async function main() {
  try {
    if (!process.env.CALIBRATION_FILE_URL) {
      throw new Error(
        "CALIBRATION_FILE_URL environment variable is not defined",
      );
    }
    if (!process.env.CALIBRATION_FILE_LOCAL_PATH) {
      throw new Error(
        "CALIBRATION_FILE_LOCAL_PATH environment variable is not defined",
      );
    }
    if (!process.env.S01E03_VERIFICATION_URL) {
      throw new Error(
        "S01E03_VERIFICATION_URL environment variable is not defined",
      );
    }
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable is not defined");
    }

    const calibrationFile = await axios.get(process.env.CALIBRATION_FILE_URL);

    //save calibration file to disk
    fs.writeFileSync(
      process.env.CALIBRATION_FILE_LOCAL_PATH,
      JSON.stringify(calibrationFile.data),
    );
    console.log(
      `💾 Calibration file saved to ${process.env.CALIBRATION_FILE_LOCAL_PATH}`,
    );

    const tokenizer = new Tokenizer(model);
    await tokenizer.init();
    const calibrationFileTokens = await tokenizer.countTokens([
      { role: "user", content: JSON.stringify(calibrationFile.data) },
    ]);
    console.log(
      `ℹ️  Calibration file tokens: ${calibrationFileTokens} /context window size: ${gpt4_1params.contextWindowSize} / max output tokens: ${gpt4_1params.maxOutputTokens} `,
    );

    let data = calibrationFile.data;
    correctCalculation(data["test-data"]);
    await answerQuestions(data["test-data"]);

    const msg = await sendAnswer(data);
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
