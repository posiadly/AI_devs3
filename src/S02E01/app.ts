import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import AdmZip from "adm-zip";
import { createClient } from "@deepgram/sdk";
import path from "path";
import { extractFlag } from "../tools/FlagExtractor.js";
import { sendAnswer } from "../tools/SendAnswer.js";
import { OpenAIService } from "../tools/OpenAIService.js";
import { findProfessorPrompt } from "./prompt.js";

dotenv.config();

async function sentFilesToDeepgramAndGetTranscripts(
  folderPath: string,
): Promise<string[]> {
  const transcript: string[] = [];
  const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
  const files = fs.readdirSync(folderPath);
  const transcripts = [];
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const transcript = await deepgram.listen.prerecorded.transcribeFile(
      fs.readFileSync(filePath),
      {
        model: "nova-3",
        language: "pl",
        mime_type: "audio/mpeg",
        smart_format: true,
      },
    );

    //get file name without extension
    const fileName = path.basename(filePath, path.extname(filePath));
    transcripts.push(`
      ${fileName}:
        ${transcript.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ""}
      `);
  }
  return transcripts;
}

async function main() {
  try {
    if (!process.env.S02E01_FILE_URL) {
      throw new Error("S02E01_FILE_URL environment variable is not defined");
    }
    if (!process.env.S02E01_FILE_LOCAL_PATH) {
      throw new Error(
        "S02E01_FILE_LOCAL_PATH environment variable is not defined",
      );
    }

    if (!process.env.DEEPGRAM_API_KEY) {
      throw new Error("DEEPGRAM_API_KEY environment variable is not defined");
    }

    if (!process.env.S02E01_TRANSCRIPTS_FILE_PATH) {
      throw new Error(
        "S02E01_TRANSCRIPTS_FILE_PATH environment variable is not defined",
      );
    }
    if (!process.env.S02E01_VERIFICATION_URL) {
      throw new Error(
        "S02E01_VERIFICATION_URL environment variable is not defined",
      );
    }

    const response = await axios.get(process.env.S02E01_FILE_URL!, {
      responseType: "arraybuffer",
    });
    fs.writeFileSync(process.env.S02E01_FILE_LOCAL_PATH!, response.data);
    console.log(
      "💾 Zip file downloaded and saved to ",
      process.env.S02E01_FILE_LOCAL_PATH,
    );

    const unzip = new AdmZip(process.env.S02E01_FILE_LOCAL_PATH!);
    unzip.extractAllTo(process.env.S02E01_UNZIPPED_FOLDER_PATH!, true);
    console.log(
      "🔓 Unzipped file saved to ",
      process.env.S02E01_UNZIPPED_FOLDER_PATH,
    );

    const transcripts = await sentFilesToDeepgramAndGetTranscripts(
      process.env.S02E01_UNZIPPED_FOLDER_PATH!,
    );

    console.log(
      `▶ Transcripts:\n${transcripts.join("\n")}\n◀ End of Transcripts`,
    );
    fs.writeFileSync(
      process.env.S02E01_TRANSCRIPTS_FILE_PATH!,
      transcripts.join("\n"),
    );
    console.log(
      "💾 Transcripts saved to ",
      process.env.S02E01_TRANSCRIPTS_FILE_PATH,
    );

    const aiResponse = await new OpenAIService().query(
      findProfessorPrompt,
      transcripts.join("\n"),
    );

    console.log("🙋 Response from model:", aiResponse);

    const msg = await sendAnswer(
      "mp3",
      aiResponse,
      process.env.S02E01_VERIFICATION_URL!,
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
