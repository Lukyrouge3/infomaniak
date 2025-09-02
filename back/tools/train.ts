import { GPTTool } from "./tool.ts";
import { FunctionTool } from "./tool.ts";

const INFOMANIAK_TOKEN = Deno.env.get("INFOMANIAK_TOKEN");
if (!INFOMANIAK_TOKEN) throw new Error("Missing INFOMANIAK_TOKEN in env");

const trainToolProperties = {
  segments: {
    type: "array",
    items: {
      type: "object",
      properties: {
        departure: {
          type: "string",
          description: "The full name of the departure train station.",
        }, // "MLH"
        arrival: {
          type: "string",
          description: "The full name of the arrival train station.",
        }, // "SKP"
        trainNumber: {
          type: "string",
          description:
            "The train code for example IC123, TGV456. It is optional. it has to start with letters followed by numbers. it contains only letters and numbers. it is not the transit. it is a short code.",
        }, // "Wizz Air"
        validityPeriod: {
          type: "string",
          description:
            "The validity period of the ticket in the format 'dd/mm/yyyy hh:mm to dd/mm/yyyy hh:mm'. It is optional.",
        }, // "valid from 25/12/2023 10:00 to 25/12/2023 14:00"
				required: ["departure", "arrival"],
				additionalProperties: false,
      },
      description:
        "Information about the train trip. take it only from the email.",
			required: ["items"],
      additionalProperties: false,
    },
  },
  ticketCode: {
    type: "string",
    description: "The ticket number of the train ticket. it is not the transaction number or the booking number or the reservation number.",
  },
  passengers: {
    type: "array",
    items: {
      type: "object",
      properties: {
        lastname: { type: "string" },
        firstname: { type: "string" },
      },
      required: ["items"],
      additionalProperties: false,
    },
    required: ["ticketCode", "passengers", "segments"],
    additionalProperties: false,
  },
};

export class TrainTool implements GPTTool {
  name = "train_tool";
  systemDescription =
    "Gets information exclusivly out of a train ticket confirmation email. Translate all the arguments with the original mail language.";
  getResponseTool(): FunctionTool {
    return {
      type: "function",
      function: {
        name: this.name,
        description:
          "pulls information from a train ticket confirmation email.",
        parameters: {
          type: "object",
          properties: trainToolProperties,
          strict: true,
          required: [],
          additionalProperties: false,
        },
      },
    };
  }
  async handleCall(..._args: any[]): Promise<string> {
    return JSON.stringify({ action: "train", data: _args[0] }, null, 2);
  }
}
