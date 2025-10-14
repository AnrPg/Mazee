// Temporary placeholder so tsc has at least one input.
export type SdkConfig = { baseUrl: string };
export class Client {
  constructor(public config: SdkConfig) {}
  ping() { return "ok"; }
}
