import { GenezioAuth, GenezioDeploy, GnzContext } from "@genezio/types";

@GenezioDeploy()
export class BackendService {
  constructor() { }

  @GenezioAuth()
  async hello(context: GnzContext, name: string): Promise<string> {
    console.log("Request received from user with Public Address", context.user!.address);
    return `Hello ${name}! Your address is ${context.user?.address}. and your name is: ${context.user?.name}`;
  }
}

