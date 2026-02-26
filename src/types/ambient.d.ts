declare module "dotenv" {
  interface DotenvConfigOptions {
    path?: string;
    encoding?: string;
    debug?: boolean;
    override?: boolean;
  }
  interface DotenvConfigOutput {
    parsed?: { [key: string]: string };
    error?: Error;
  }
  function config(options?: DotenvConfigOptions): DotenvConfigOutput;
  namespace dotenv {
    export { config };
  }
  export { config };
  export default { config };
}
