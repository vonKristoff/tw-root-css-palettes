#!/usr/bin/env bun
import { mkdir } from "fs/promises";
import inquirer from "inquirer";
import palettes from "./palettes.json" with { type: "json" };

type Choice = {
  name: string;
  value: string[];
}
// Packaged (from dist)
const rootTemplate = Bun.file(new URL("../_templates/root.css", import.meta.url));
// Developement
// const rootTemplate = Bun.file("./_templates/root.css");
await writeTemplate();

async function chooseThemePalette(): Promise<Choice[]> {
  const choices = palettes.map((palet) => {
    let blocks = palet.hues.map((hue) => hex(hue, '██')).join(' ')
    return { name: `${palet.name}: ${blocks}`, value: [...palet.hues] }
  })
  const res = await inquirer.prompt({
    name: "palette",
    type: "list",
    message: "Choose starter theme from templates",
    choices,
    default() {
      return false
    },
  });
  return res.palette;
}
async function setOutputPath() {
  const res = await inquirer.prompt({
    name: "target",
    type: "input",
    message: "generate to which path? (relatively & creates if doesn't exist)",
    default() {
      return `src/styles`;
    },
  });
  const targetPath = res.target === './' || res.target === '.' ? 'styles' : res.target
  await mkdir(`./${targetPath}`, { recursive: true });
  return targetPath
}
async function setColourStep() {
  const res = await inquirer.prompt({
    name: "step",
    type: "input",
    message: "set colour step",
    default() {
      return `0.2`;
    },
  });
  return res.step;
}
async function writeTemplate() {
  try {
    const hues = await chooseThemePalette();
    const targetPath = await setOutputPath();
    const colourStep = await setColourStep();
    const rootText = await rootTemplate.text();
    
    const variablesToInsert = hues
      .map((colour, index) => `  --hue-${index + 1}: ${colour};`)
      .join("\n");
    const newContent = rootText
      .replace("/* HUE_GENERATION */", variablesToInsert)
      .replaceAll("STEP", colourStep);

    await Bun.write(`./${targetPath}/root.css`, newContent);
    console.log(`${hex('#33ff33','✓')} created themed root.css`);
  } catch (err: any) {
    if (err.name === "ExitPromptError") {
      console.log(`\n ${hex('#ff3333','✗')} Prompt cancelled by user. Exiting...`);
      process.exit(0); // clean exit
    } else {
      console.error("Unexpected error:", err);
      process.exit(1); // exit with error code
    }
  }
}
  
// Hex color function
// console.log(hex("#FF6347", "Tomato red"));
function hex(hexColor: string, text: string) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
};
