import type { Message, Answer } from "./types.js";
import axios from "axios";

export async function sendAnswer(
  task: string,
  data: any,
  verificationUrl: string,
): Promise<Answer> {
  //dataToSend.apikey = process.env.API_KEY!;
  const msg: Message = {
    task: task,
    apikey: process.env.API_KEY!,
    answer: data,
  };

  return (
    await axios.post(verificationUrl, msg, {
      headers: {
        "Content-Type": "application/json",
      },
    })
  ).data as Answer;
}
