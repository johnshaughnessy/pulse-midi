import { exec, spawn } from "child_process";
import { promisify } from "util";
import split2 from "split2";

export type PulseAudioChangeMessage = {
  type: "source" | "sink";
  name: string;
  // volume: number;
  // muted: boolean;
};

async function parseChangeMessage(
  line: string
): Promise<PulseAudioChangeMessage | null> {
  const change = line.includes("change");
  if (!change) return null;

  const source = line.includes("source");
  const sink = line.includes("sink");
  if (!source && !sink) return null;

  const parts = line.split(" ");
  const id = parts[parts.length - 1].substring(1);
  if (!id) return null;

  const name = source ? await getSourceName(id) : await getSinkName(id);
  if (!name) return null;

  return {
    type: source ? "source" : "sink",
    name,
    // volume: source ? await getSourceVolume(name) : await getSinkVolume(name),
    // muted: source ? await getSourceMuted(name) : await getSinkMuted(name),
  };
}

export async function addPulseAudioChangeListener(
  callback: any
): Promise<void> {
  const pactl = spawn("pactl", ["subscribe"]);

  pactl.stdout.pipe(split2()).on("data", async (line: string) => {
    const msg = await parseChangeMessage(line);
    if (msg) {
      callback(msg);
    }
  });

  pactl.stderr.on("data", (data) => {
    console.error(`Error monitoring PulseAudio sink changes: ${data}`);
  });

  pactl.on("close", (code) => {
    console.log(`pactl subscribe process exited with code ${code}`);
  });
}

export async function setSinkVolume(
  sink: string,
  volume: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const volumePercentage = Math.round(volume * 100);
    const command = `pactl set-sink-volume ${sink} ${volumePercentage}%`;

    exec(command, (error, _stdout, stderr) => {
      if (error) {
        console.error(`Error setting sink volume: ${error}`);
        reject();
        return;
      }
      if (stderr) {
        console.error(`Error output: ${stderr}`);
        reject();
        return;
      }
      resolve();
    });
  });
}

export async function setSourceVolume(
  source: string,
  volume: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const volumePercentage = Math.round(volume * 100);
    const command = `pactl set-source-volume ${source} ${volumePercentage}%`;

    exec(command, (error, _stdout, stderr) => {
      if (error) {
        console.error(`Error setting source volume: ${error}`);
        reject();
        return;
      }
      if (stderr) {
        console.error(`Error output: ${stderr}`);
        reject();
        return;
      }
      resolve();
    });
  });
}

export function getSinkVolume(sink: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const command = `pactl list sinks | grep -A15 "Name: .*${sink}" | grep 'Volume:' | head -n 1 | awk -F : '{print $3}' | awk '{print $1}'`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error getting sink volume: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Error output: ${stderr}`);
        reject(new Error(stderr));
        return;
      }

      const rawVolume = parseInt(stdout.trim(), 10);
      resolve(rawVolume / 65536);
    });
  });
}

export function getSourceVolume(sink: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const command = `pactl list sources | grep -A15 "Name: .*${sink}" | grep 'Volume:' | head -n 1 | awk -F : '{print $3}' | awk '{print $1}'`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error getting sink volume: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Error output: ${stderr}`);
        reject(new Error(stderr));
        return;
      }

      const rawVolume = parseInt(stdout.trim(), 10);
      resolve(rawVolume / 65536);
    });
  });
}

export function getSourceMuted(sink: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const command = `pactl list sources | grep -A15 "Name: .*${sink}" | grep 'Mute:' | head -n 1 | awk -F : '{print $2}' | awk '{print $1}'`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error getting sink volume: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Error output: ${stderr}`);
        reject(new Error(stderr));
        return;
      }

      const result = stdout.trim();
      if (result === "yes") {
        resolve(true);
        return;
      }
      if (result === "no") {
        resolve(false);
        return;
      }

      console.error(`Failed to get mute info for ${sink}`);
      reject(new Error("Failed to get mute info"));
    });
  });
}

export function getSinkMuted(sink: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const command = `pactl list sinks | grep -A15 "Name: .*${sink}" | grep 'Mute:' | head -n 1 | awk -F : '{print $2}' | awk '{print $1}'`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error getting sink volume: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Error output: ${stderr}`);
        reject(new Error(stderr));
        return;
      }

      const result = stdout.trim();
      if (result === "yes") {
        resolve(true);
        return;
      }
      if (result === "no") {
        resolve(false);
        return;
      }

      console.error(`Failed to get mute info for ${sink}`);
      reject(new Error("Failed to get mute info"));
    });
  });
}

const execAsync = promisify(exec);

export async function getSinkName(sinkNumber: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync("pactl list sinks short");
    const lines = stdout.split("\n");

    for (const line of lines) {
      const tokens = line.trim().split(/\s+/);

      if (tokens[0] === sinkNumber) {
        return tokens[1];
      }
    }
  } catch (error) {
    console.error(`Error getting sink name: ${error}`);
  }

  return null;
}

export async function getSourceName(
  sourceNumber: string
): Promise<string | null> {
  try {
    const { stdout } = await execAsync("pactl list sources short");
    const lines = stdout.split("\n");

    for (const line of lines) {
      const tokens = line.trim().split(/\s+/);

      if (tokens[0] === sourceNumber) {
        return tokens[1];
      }
    }
  } catch (error) {
    console.error(`Error getting source name: ${error}`);
  }

  return null;
}

export async function getSourceIndexByName(
  deviceName: string
): Promise<number | null> {
  try {
    const { stdout } = await execAsync("pactl list sources");
    const sources = stdout.split("Source #").slice(1);
    for (const source of sources) {
      const lines = source.split("\n").map((line) => line.trim());
      const index = parseInt(lines[0]);
      const nameLine = lines.find((line) => line.startsWith("Name:"));
      if (nameLine) {
        const name = nameLine.split(" ")[1];
        if (name === deviceName) {
          return index;
        }
      }
    }
  } catch (error) {
    console.error(`Error getting source index by name: ${error}`);
  }
  return null;
}

export async function getSinkIndexByName(
  deviceName: string
): Promise<number | null> {
  try {
    const { stdout } = await execAsync("pactl list sinks");
    const sources = stdout.split("Sink #").slice(1);
    for (const source of sources) {
      const lines = source.split("\n").map((line) => line.trim());
      const index = parseInt(lines[0]);
      const nameLine = lines.find((line) => line.startsWith("Name:"));
      if (nameLine) {
        const name = nameLine.split(" ")[1];
        if (name === deviceName) {
          return index;
        }
      }
    }
  } catch (error) {
    console.error(`Error getting source index by name: ${error}`);
  }
  return null;
}

export async function setPulseAudioSourceMute(
  sourceIndex: number,
  mute: boolean
): Promise<void> {
  try {
    const muteValue = mute ? 1 : 0;
    await execAsync(`pactl set-source-mute ${sourceIndex} ${muteValue}`);
  } catch (error) {
    console.error(`Error setting PulseAudio source mute state: ${error}`);
  }
}

export async function setPulseAudioSinkMute(
  sinkIndex: number,
  mute: boolean
): Promise<void> {
  try {
    const muteValue = mute ? 1 : 0;
    await execAsync(`pactl set-sink-mute ${sinkIndex} ${muteValue}`);
  } catch (error) {
    console.error(`Error setting PulseAudio sink mute state: ${error}`);
  }
}

export async function setDefaultSource(sourceName: string): Promise<void> {
  try {
    await execAsync(`pactl set-default-source "${sourceName}"`);
  } catch (error) {
    console.error(`Error setting default source: ${error}`);
  }
}

export async function setDefaultSink(sinkName: string): Promise<void> {
  try {
    await execAsync(`pactl set-default-sink "${sinkName}"`);
  } catch (error) {
    console.error(`Error setting default sink: ${error}`);
  }
}

export async function getDefaultSource(): Promise<string | void> {
  try {
    const { stdout } = await execAsync(`pactl get-default-source`);
    return stdout.trim();
  } catch (error) {
    console.error(`Error getting default source: ${error}`);
  }
}

export async function getDefaultSink(): Promise<string | void> {
  try {
    const { stdout } = await execAsync(`pactl get-default-sink`);
    return stdout.trim();
  } catch (error) {
    console.error(`Error getting default sink: ${error}`);
  }
}
