import { GPTTool } from "./tool.ts";
import { FunctionTool } from "./tool.ts";

const INFOMANIAK_TOKEN = Deno.env.get("INFOMANIAK_TOKEN");
if (!INFOMANIAK_TOKEN) throw new Error("Missing INFOMANIAK_TOKEN in env");

const flightToolProperties = {
  Flight_segments: {
    type: "array",
    items: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description:
            "The title of the flight segment in the format From <departure> to <arrival>",
        }, // "De Mulhouse à Skopje"
        fromCode: {
          type: "string",
          description: "The full name of the departure airport.",
        }, // "MLH"
        toCode: {
          type: "string",
          description: "The full name of the arrival airport.",
        }, // "SKP"
        departure: {
          type: "string",
          description: "The departure time of the flight in ISO format",
        }, // "15:20"
        arrival: {
          type: "string",
          description: "The arrival time of the flight in ISO format",
        }, // "17:30"
        duration: {
          type: "string",
          description:
            "The duration of the flight in the format 2 h 20 that depends on the timezone of departure and arrival",
        }, // "2 h 20"
        airline: {
          type: "string",
          description: "The airline operating the flight.",
        }, // "Wizz Air"
        flightNumber: { type: "string", description: "The flight number." }, // "W64793"
      },
      description: "Information about one flight",
      required: ["items"],
      additionalProperties: false,
    },
  },
  confirmationCode: { type: "string" },
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
    required: ["confirmationCode", "passengers", "Flight_segments"],
    additionalProperties: false,
  },
};

export class FlightTool implements GPTTool {
  name = "flight_tool";
  systemDescription =
    "Gets information out of a flight ticket confirmation email.";
  getResponseTool(): FunctionTool {
    return {
      type: "function",
      function: {
        name: this.name,
        description:
          "pulls information from a flight ticket confirmation email.",
        parameters: {
          type: "object",
          properties: flightToolProperties,
          strict: true,
          required: ["confirmation_number", "passengers", "flights"],
          additionalProperties: false,
        },
      },
    };
  }
  async handleCall(..._args: any[]): Promise<string> {
    return JSON.stringify(_args[0], null, 2);
  }
}
