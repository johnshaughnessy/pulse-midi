import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { load } from "js-yaml";
import path from "path";

export type Binding = {
  name: string;
  type: "source" | "sink";
  set_volume: number;
  toggle_mute: number;
  set_default: number;
};

export type Config = {
  controller_name: string;
  bindings: Binding[];
};

function getConfigFilePath() {
  if (process.env.PULSE_MIDI_CONFIG) {
    if (existsSync(process.env.PULSE_MIDI_CONFIG)) {
      return process.env.PULSE_MIDI_CONFIG;
    } else {
      throw new Error(`Missing config file. ${process.env.PULSE_MIDI_CONFIG}`);
    }
  }

  if (
    process.env.XDG_CONFIG &&
    existsSync(path.join(process.env.XDG_CONFIG, "pulse-midi", "config.yaml"))
  ) {
    return path.join(process.env.XDG_CONFIG, "pulse-midi", "config.yaml");
  }

  const home = homedir();
  if (home && existsSync(path.join(home, "pulse-midi", "config.yaml"))) {
    return path.join(home, "pulse-midi", "config.yaml");
  }

  if (existsSync("config.yaml")) {
    return "config.yaml";
  }

  throw new Error("No config file found.");
}

export function loadConfig() {
  const configFilePath = getConfigFilePath();
  const fileContents = readFileSync(configFilePath, "utf8");
  const config = load(fileContents) as Config;
  return config;
}
