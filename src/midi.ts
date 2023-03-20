import { Input, getInputs, Output, getOutputs } from "easymidi";

export type CC = {
  channel: number;
  controller: number; // 1-18
  value: number; // 0-127
  _type: "cc";
};

export type NoteOn = {
  channel: number;
  note: number;
  velocity: 0 | 127;
  _type: "noteon";
};

export type NoteOff = {
  channel: number;
  note: number;
  velocity: 0 | 127;
  _type: "noteoff";
};

export type MidiEvent = CC | NoteOn | NoteOff;

function isValidCC(ev: CC) {
  return (
    ev._type === "cc" &&
    Number.isInteger(ev.controller) &&
    ev.controller >= 1 &&
    ev.controller <= 18 &&
    Number.isInteger(ev.value) &&
    ev.value >= 0 &&
    ev.value <= 127
  );
}

function isValidNoteOn(ev: NoteOn) {
  return (
    ev._type === "noteon" &&
    Number.isInteger(ev.note) &&
    ev.note >= 0 &&
    ev.note <= 47 &&
    Number.isInteger(ev.velocity) &&
    (ev.velocity === 0 || ev.velocity === 127)
  );
}

function isValidNoteOff(ev: NoteOff) {
  return (
    ev._type === "noteoff" &&
    Number.isInteger(ev.note) &&
    ev.note >= 0 &&
    ev.note <= 47 &&
    Number.isInteger(ev.velocity) &&
    (ev.velocity === 0 || ev.velocity === 127)
  );
}

export function cast(ev: any): MidiEvent {
  if (isValidCC(ev)) return ev as CC;
  if (isValidNoteOn(ev)) return ev as NoteOn;
  if (isValidNoteOff(ev)) return ev as NoteOff;
  console.error(ev);
  throw new Error(`Unrecognized event`);
}

export type MidiController = {
  input: Input;
  output: Output;
};

export function findMidiController(name: string): MidiController | null {
  const inputs = getInputs();
  const inputName = inputs.find((input) =>
    input.toLowerCase().includes(name.toLowerCase())
  );
  const outputs = getOutputs();
  const outputName = outputs.find((output) =>
    output.toLowerCase().includes(name.toLowerCase())
  );

  if (inputName && outputName) {
    return {
      input: new Input(inputName),
      output: new Output(outputName),
    };
  }

  return null;
}

export async function setKnob(
  output: Output,
  channel: number,
  controller: number,
  value: number
): Promise<void> {
  try {
    (output as any).send("cc", {
      channel,
      controller,
      value,
    });
  } catch (error) {
    console.error(`Error updating controller knob: ${error}`);
  }
}

export async function setLED(
  output: Output,
  channel: number,
  note: number,
  enabled: boolean
) {
  try {
    (output as any).send(enabled ? "noteon" : "noteoff", {
      channel,
      note,
      velocity: 127,
    });
  } catch (error) {
    console.error(`Error updating LED ${note} ${error}`);
  }
}

// TODO utils
function clamp(x: number, min: number, max: number) {
  return Math.min(Math.max(x, min), max);
}
// Remap 0->1+ (unclamped) to 0->127 (clamped)
export function toMidiVolume(volume: number) {
  return Math.round(clamp(volume * 127, 0, 127));
}
