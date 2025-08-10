import OpenAI from "openai";

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async query(systemMessage: string, userQuestion: string) {
    const openAIResponse = await this.client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userQuestion },
      ],
    });
    return openAIResponse?.choices?.[0]?.message?.content ?? "";
  }
}
