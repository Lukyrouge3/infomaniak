import {FlightTool} from "./flight.ts";

const INFOMANIAK_TOKEN = Deno.env.get("INFOMANIAK_TOKEN");
if (!INFOMANIAK_TOKEN) throw new Error("Missing INFOMANIAK_TOKEN in env");

const PRODUCT_ID = 105923;
const API_URL = `https://api.infomaniak.com/2/ai/${PRODUCT_ID}/openai/v1/chat/completions`;
const HEADERS = {
  Authorization: `Bearer ${INFOMANIAK_TOKEN}`,
  "Content-Type": "application/json",
};

export const GPT_TOOLS = [new FlightTool()] as GPTTool[];

export interface GPTTool {
  name: string;
  systemDescription: string;
  reactionEmoji?: string;

  getResponseTool(): FunctionTool;
  handleCall(...args: any[]): Promise<string>;
}

export interface FunctionTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      strict?: boolean;
      properties: {[key: string]: unknown};
      required?: string[];
      additionalProperties: boolean;
    };
  };
}

export async function call_gpt(messages: {content: string; role: string}[]) {
  const request = new Request(API_URL, {
    method: "POST",
    headers: {...HEADERS},
    body: JSON.stringify({
      messages,
      model: "qwen3",
      tool_choice: "auto",
      tools: GPT_TOOLS.map((t) => t.getResponseTool()),
    }),
  });

  try {
    const response = await fetch(request);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as {
      id: string;
      object: string;
      created: number;
      model: string;
      choices: Array<{
        index: number;
        message: {
          role: string;
          content: string | null;
          tool_calls?: {
            id: string;
            function: {name: string; arguments: string};
          }[];
        };
      }>;
      finish_reason: string;
    };

    // Log it into a json
    Deno.writeTextFileSync(
      `./logs/gpt_response_${Date.now()}.json`,
      JSON.stringify(
        {
          request: {
            messages,
            model: "qwen3",
            tool_choice: "auto",
            tools: GPT_TOOLS.map((t) => t.getResponseTool()),
          },
          response: data,
        },
        null,
        2
      )
    );

    if (data.choices.length === 0) {
      throw new Error("No choices returned from GPT");
    }
    const choice = data.choices[0];
    if (choice.message.content) {
      return choice.message.content;
    } else if (
      choice.message.tool_calls &&
      choice.message.tool_calls.length > 0
    ) {
      return call_tool(choice.message.tool_calls[0]);
    }

    throw new Error("No content or tool calls in GPT response");
  } catch (error) {
    console.error("Error fetching GPT response:", error);
    throw error;
  }
}

async function call_tool(tool_call: {
  id: string;
  function: {name: string; arguments: string};
}) {
  const tool = GPT_TOOLS.find((t) => t.name === tool_call.function.name);
  if (!tool) {
    throw new Error(`Tool ${tool_call.function.name} not found`);
  }

  let args = {};
  try {
    args = JSON.parse(tool_call.function.arguments);
  } catch (error) {
    console.error("Error parsing tool arguments:", error);
    throw error;
  }

  try {
    const result = await tool.handleCall(args);
    return result;
  } catch (error) {
    console.error(`Error executing tool ${tool.name}:`, error);
    throw error;
  }
}
