interface GPTTool {
  name: string;
  systemDescription: string;
  reactionEmoji?: string;

  getResponseTool(): Tool;
  handleCall(...args: any[]): Promise<string>;
}

export type Tool = {
  type: "function";
  name: string;
  description: string;
  strict: boolean;
  parameters: {
    type: string;
    properties: {[key: string]: {type: string; description: string}};
    required: string[];
    additionalProperties: boolean;
  };
};

export class DummyTool implements GPTTool {
  name = "dummy_tool";
  systemDescription =
    "This is a dummy tool. Always call it. It is used for debug !";
  getResponseTool(): Tool {
    return {
      type: "function",
      name: this.name,
      description: "Virtually does nothing. Still should be called for debug.",
      strict: true,
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    };
  }
  async handleCall(..._args: any[]): Promise<string> {
    return "";
  }
}
