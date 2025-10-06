import { createByModelName, TikTokenizer } from "@microsoft/tiktokenizer";
import type { ChatCompletionMessageParam } from "openai/resources";

export class Tokenizer {
  private readonly IM_START = "<|im_start|>";
  private readonly IM_END = "<|im_end|>";
  private readonly IM_SEP = "<|im_sep|>";

  private specialTokens: ReadonlyMap<string, number> = new Map([
    [this.IM_START, 100264],
    [this.IM_END, 100265],
    [this.IM_SEP, 100266],
  ]);
  private modelName: string;
  private model!: TikTokenizer;
  public constructor(model: string) {
    this.modelName = model;
  }
  public async init() {
    this.model = await createByModelName(this.modelName, this.specialTokens);
  }
  public async countTokens(
    messages: ChatCompletionMessageParam[],
  ): Promise<number> {
    let text = "";
    messages.forEach((m) => {
      text += `${this.IM_START}${m.role}${this.IM_SEP}${m.content}${this.IM_END}`;
    });
    return (
      await this.model.encode(text, Array.from(this.specialTokens.keys()))
    ).length;
  }
}
