import { langfuseSpanProcessor } from "./instrumentation.js";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import { OpenAIService } from "../tools/OpenAIService.js";
import { extractFlag } from "../tools/FlagExtractor.js";
import { Tokenizer } from "../tools/Tokenizer.js";
import { answerQuestionsPrompt } from "./prompts.js";
import type { TestData } from "../S01E03/types.js";
import { sendAnswer } from "../tools/SendAnswer.js";
import { LangfuseSpan, startObservation } from "@langfuse/tracing";

dotenv.config();

const gpt4_1params = {
  contextWindowSize: 128000,
  maxOutputTokens: 16384,
};
const model = "gpt-4o";

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

async function answerQuestions(data: TestData[], span: LangfuseSpan) {
  const openAIService = new OpenAIService();
  const questions = data
    .filter((item) => item.test)
    .map((item) => ({ question: item.test!.q, answer: "" }));

  console.log("❔ Retrieved questions:", questions);

  const generationSpan = span.startObservation(
    "model-generation",
    {
      model: model,
      input: [
        { role: "system", content: answerQuestionsPrompt },
        { role: "user", content: JSON.stringify(questions) },
      ],
    },
    { asType: "generation" },
  );

  const response = await openAIService.query(
    answerQuestionsPrompt,
    JSON.stringify(questions),
    model,
  );
  generationSpan.update({
    output: { response },
  });
  console.log("🙋 Answer from model:", response);

  generationSpan.end();

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

    const span = startObservation("user-request2");

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
    await answerQuestions(data["test-data"], span);

    data.apikey = process.env.API_KEY!;

    const msg = await sendAnswer(
      "JSON",
      data,
      process.env.S01E03_VERIFICATION_URL!,
    );
    console.log("ℹ️ Response for answer:", msg);
    const flag = extractFlag(msg.message);
    if (flag) {
      console.log("✅ Flag found:", flag);
    } else {
      console.log("🛑 Flag not found");
    }

    span.end();

    await langfuseSpanProcessor.forceFlush();
  } catch (error) {
    if (error instanceof Error) {
      console.log("🛑 Error occurred:", error.message);
    } else {
      console.log("🛑 Unknown error occurred:", error);
    }
  }
}

main();
