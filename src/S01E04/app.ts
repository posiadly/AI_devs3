import dotenv from "dotenv";
import axios from "axios";
import { prompt } from "./prompt.js";
import { extractFlag } from "../tools/FlagExtractor.js";

dotenv.config();

async function main() {
  try {
    if (!process.env.S01E04_VERIFICATION_URL) {
      throw new Error(
        "S01E04_VERIFICATION_URL environment variable is not defined",
      );
    }

    const mapSpecification = `
    Dimensions: 4 Rows (0-3), 6 Columns (0-5)
    Start Point (S):
    (3, 0)
    End Point (E):
    (3, 5)
    Wall Coordinates (W):
    (0, 1)
    (1, 3)
    (2, 1), (2, 3)
    (3, 1)
    Open Path Coordinates (O):
    Row 0: (0, 0), (0, 2), (0, 3), (0, 4), (0, 5)
    Row 1: (1, 0), (1, 1), (1, 2), (1, 4), (1, 5)
    Row 2: (2, 0), (2, 2), (2, 4), (2, 5)
    Row 3: (3, 2), (3, 3), (3, 4)`;

    const body = `code= ${prompt}\n\n${mapSpecification}`;

    const response = await axios.post(
      process.env.S01E04_VERIFICATION_URL!,
      body,
    );
    console.log(
      `▶ Response:\n${JSON.stringify(response.data)}\n◀ End of Response`,
    );
    const flag = extractFlag(response.data.flag);
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
