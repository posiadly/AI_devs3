import dotenv from "dotenv";
import axios from "axios";
import prettier from "prettier";
import * as cheerio from "cheerio";
import { OpenAIService } from "../tools/OpenAIService.js";
import { answerQuery } from "./prompts.js";

/*
import OpenAI from "openai";

import * as fs from "fs/promises";*/

dotenv.config();

function retrieveQuestionFromHtml(html: string): string {
  const $ = cheerio.load(html);
  const nodeContent = $("#human-question").html()?.trim();
  if (!nodeContent)
    throw new Error("Node 'human-question' doesn't exist. Question not found");
  const question = nodeContent.match(/Question:<br\s*\/?>\s*(.*)/i);
  if (!question || question.length < 2)
    throw new Error(
      "Question not found in the content of 'human-question' node",
    );
  return (question[1] ?? "").trim();
}

async function login(
  url: string,
  username: string,
  password: string,
  answerQuery: string,
): Promise<string> {
  const payload = `username=${username}&password=${password}&answer=${answerQuery}`;
  const response = await axios.post(url, payload, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return response.data;
}

async function main() {
  try {
    if (!process.env.ROBOTS_SYSTEM_URL) {
      throw new Error("ROBOTS_SYSTEM_URL environment variable is not defined");
    }
    if (!process.env.USER) {
      throw new Error("USER environment variable is not defined");
    }
    if (!process.env.PASSWORD) {
      throw new Error("PASSWORD environment variable is not defined");
    }

    const loginPageContent = await axios.get(process.env.ROBOTS_SYSTEM_URL);
    console.log(
      `▶ HTML Content:\n${await prettier.format(loginPageContent.data, { parser: "html" })}\n◀ End of HTML Content`,
    );
    const question = retrieveQuestionFromHtml(loginPageContent.data);
    console.log("❔ Retrieved question:", question);

    const answer = await new OpenAIService().query(answerQuery, question);
    console.log("❔ Answer from model:", answer);

    const loggedInPageContent = await login(
      process.env.ROBOTS_SYSTEM_URL,
      process.env.USER,
      process.env.PASSWORD,
      answer,
    );
    console.log(
      `▶ Logged In Page Content:\n${await prettier.format(loggedInPageContent, { parser: "html" })}\n◀ End of Logged In Page Content`,
    );
    const flag = loggedInPageContent.match(/{{FLG:([^}]+)}}/);
    if (flag) {
      console.log("✅ Flag found:", flag[1]);
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
/*async function perform() {
  try {
    if (!process.env.ROBOTS_SYSTEM_URL) {
      throw new Error("ROBOTS_SYSTEM_URL environment variable is not defined");
    }

    const loginPageContent = await axios.get(process.env.ROBOTS_SYSTEM_URL);
    console.log("🗎 HTML Content:\n");

    /*const questionNodeContent = $("#human-question").text();

    const question = questionNodeContent.match(/^Question:(.*)$/);

    if (!question) throw new Error("Question not found in the content");
    console.log(question[1]);
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const openAIResponse = await client.responses.create({
      model: "gpt-4.1",
      input:
        "Answer following question. Return only the answer, no explanation. Only year as a number. Question: " +
        question[1],
    });
    console.log(`OpenAI response: ${openAIResponse.output_text}`);

    const payload = `username=tester&password=574e112a&answer=${openAIResponse.output_text}`;
    const postResponse = await axios.post("https://xyz.ag3nts.org/", payload, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    console.log(`POST response status: ${postResponse.data}`);
    await fs.writeFile(
      "c:\\temp\\index.html",
      postResponse.data as string,
      "utf-8",
    ); // Save file
  } catch (error) {
    console.error(error);
  }
}

perform();

/*https.get("https://xyz.ag3nts.org/", (res) => {
  let data = "";

  // A chunk of data has been received.
  res.on("data", (chunk) => {
    data += chunk;
  });

  // The whole response has been received.
  res.on("end", () => {
    const $ = cheerio.load(data);
    const contentText = $("#human-question").text();
    console.log("Text Content:", contentText);
  });
});*/
