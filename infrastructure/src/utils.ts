export const toTitleCase = (str: string) =>
  str
    .split(" ")
    .map((w) => w[0].toUpperCase() + w.substr(1).toLowerCase())
    .join(" ");

const STAGES = ["dev", "qa", "prod"] as const;

export type Stage = typeof STAGES[number];

export type StagedStackProps = {
  stage: Stage;
  serviceName: string;
};

const { STAGE: stageValue = "dev" } = process.env;

if (!STAGES.includes(stageValue as Stage)) {
  throw new Error(
    `STAGE environment variable must be one of ${STAGES.join(", ")}`
  );
}

export const STAGE = stageValue as Stage;
