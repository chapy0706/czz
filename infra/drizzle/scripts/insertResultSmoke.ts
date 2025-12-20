import "dotenv/config";
import { DrizzleResultRepository } from "../repositories/resultRepository";

const repo = new DrizzleResultRepository();

const main = async () => {
  const r = await repo.create({
    taskId: "30c838cc-eae6-45f4-a537-a2bdf33e01a0",
    userId: "00000000-0000-0000-0000-000000000000",
    submittedProgram: { hello: "world" },
    resultStatus: true,
  });
  console.log(r);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
