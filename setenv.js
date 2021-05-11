const fs = require("fs");

const DOTENV_PATH = ".env";
const STACK_OUTPUTS_PATH = "./infrastructure/outputs.json";

const parseEnv = () => {
  const dotenvContents = fs.readFileSync(DOTENV_PATH).toString();

  return dotenvContents.split("\n").reduce((acc, line) => {
    let [key, value] = line.split(/="?/);
    if (value.endsWith('"')) {
      value = value.slice(0, -1);
    }
    acc[key] = value;
    return acc;
  }, {});
};

const setEnv = (newEnv) => {
  const env = { ...parseEnv(), ...newEnv };

  const envContents = Object.entries(env)
    .map(([key, value]) => `${key}="${value}"`)
    .join("\n");

  fs.writeFileSync(DOTENV_PATH, envContents);
};

const getStackOutputValues = () => {
  const outputs = require(STACK_OUTPUTS_PATH);

  const outputValues = Object.values(outputs).reduce((acc, values) => {
    for (const key in values) {
      acc[key] = values[key];
    }
    return acc;
  }, {});
  return outputValues;
};

module.exports = {
  getStackOutputValues,
  setEnv,
};
