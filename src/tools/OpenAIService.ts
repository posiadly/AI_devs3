import OpenAI from "openai";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions.mjs";

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async query(
    systemMessage: string,
    userQuestion: string | ChatCompletionContentPart[],
    model = "gpt-4.1",
  ): Promise<string> {
    const openAIResponse = await this.client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userQuestion },
      ],
    });
    return openAIResponse?.choices?.[0]?.message?.content ?? "";
  }

  async generateImage(
    prompt: string,
    model: "dall-e-2" | "dall-e-3" = "dall-e-3",
  ): Promise<{ url: string; picture: string }> {
    const response = await this.client.images.generate({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });

    //get url of the picture
    const url = response.data?.[0]?.url ?? "";

    //download the image from URL and convert to base64
    let base64 = "";
    if (url) {
      const imageResponse = await fetch(url);
      const arrayBuffer = await imageResponse.arrayBuffer();
      base64 = Buffer.from(arrayBuffer).toString("base64");
    }

    return { url: url, picture: base64 };
  }
}
