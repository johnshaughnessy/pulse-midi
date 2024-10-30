import { Output } from "easymidi";
import { loadConfig, Config, Binding } from "./config";
import {
  CC,
  NoteOff,
  NoteOn,
  cast,
  findMidiController,
  setKnob,
  setLED,
  toMidiVolume,
} from "./midi";
import {
  PulseAudioChangeMessage,
  addPulseAudioChangeListener,
  getDefaultSink,
  getDefaultSource,
  getSinkIndexByName,
  getSinkMuted,
  getSinkVolume,
  getSourceIndexByName,
  getSourceMuted,
  getSourceVolume,
  setDefaultSink,
  setDefaultSource,
  setPulseAudioSinkMute,
  setPulseAudioSourceMute,
  setSinkVolume,
  setSourceVolume,
} from "./pulseaudio";

async function onCC(config: Config, ev: CC) {
  const binding = config.bindings.find((binding) => {
    return binding.set_volume === ev.controller;
  });
  if (!binding) return;

  if (binding.type === "source") {
    await setSourceVolume(binding.name, ev.value / 127.0);
  } else if (binding.type === "sink") {
    await setSinkVolume(binding.name, ev.value / 127.0);
  } else {
    throw new Error("unexpected");
  }
}

async function tryToggleMute(binding: Binding) {
  try {
    await toggleMute(binding);
  } catch (e) {
    console.error(`Toggle mute error.`);
    console.error(e);
    console.error(`binding: ${JSON.stringify(binding)}`);
  }
}

async function toggleMute(binding: Binding) {
  if (binding.type === "source") {
    const pulseAudioDeviceIndex = await getSourceIndexByName(binding.name);
    const isMuted = await getSourceMuted(binding.name);
    return setPulseAudioSourceMute(pulseAudioDeviceIndex!, !isMuted);
  }

  if (binding.type === "sink") {
    const pulseAudioDeviceIndex = await getSinkIndexByName(binding.name);
    const isMuted = await getSinkMuted(binding.name);
    return setPulseAudioSinkMute(pulseAudioDeviceIndex!, !isMuted);
  }

  throw new Error("unexpected");
}

export async function onNoteOn(config: Config, output: Output, ev: NoteOn) {
  {
    const binding = config.bindings.find((binding) => {
      return binding.toggle_mute === ev.note;
    });

    if (binding) {
      return tryToggleMute(binding);
    }
  }

  {
    const binding = config.bindings.find((binding) => {
      return binding.set_default === ev.note;
    });

    if (binding) {
      binding.type === "source"
        ? await setDefaultSource(binding.name)
        : await setDefaultSink(binding.name);

      flushAll(config, output);
    }
  }
}

function onNoteOff(config: Config, output: Output, ev: NoteOff) {
  const binding = config.bindings.find(
    (binding) =>
      ev.note === binding.toggle_mute || ev.note === binding.set_default,
  );
  if (!binding) return;

  tryFlush(config, output, binding.name);
}

async function tryFlush(
  config: Config,
  output: Output,
  pulseAudioDeviceName: string,
) {
  try {
    await flush(config, output, pulseAudioDeviceName);
  } catch (e) {
    console.error(`Flush error.`);
    console.error(e);
    console.error(`pulseAudioDeviceName: ${pulseAudioDeviceName}`);
    console.error(`config: ${JSON.stringify(config)}`);
  }
}

async function flush(
  config: Config,
  output: Output,
  pulseAudioDeviceName: string,
) {
  const binding = config.bindings.find(
    (binding) => binding.name === pulseAudioDeviceName,
  );
  if (!binding) return;

  const volume = toMidiVolume(
    binding.type === "sink"
      ? await getSinkVolume(binding.name)
      : await getSourceVolume(binding.name),
  );

  const isMuted =
    binding.type === "sink"
      ? await getSinkMuted(binding.name)
      : await getSourceMuted(binding.name);

  const isDefault =
    binding.type === "sink"
      ? (await getDefaultSink()!) === binding.name
      : (await getDefaultSource()!) === binding.name;

  setKnob(output, 10, binding.set_volume, volume);
  setLED(output, 10, binding.toggle_mute, !isMuted);
  setLED(output, 10, binding.set_default, isDefault);
}

// Flush changes from pulseaudio to the midi controller
async function onPulseAudioChangeMessage(
  config: Config,
  output: Output,
  msg: PulseAudioChangeMessage,
) {
  const binding = config.bindings.find((binding) => binding.name === msg.name);
  if (!binding) return;

  tryFlush(config, output, msg.name);
}

async function onMidiMessage(config: Config, output: Output, msg: any) {
  const ev = cast(msg);
  if (process.env.ECHO_MIDI_MESSAGES) console.log(ev);
  switch (ev._type) {
    case "cc":
      onCC(config, ev);
      break;
    case "noteon":
      onNoteOn(config, output, ev);
      break;
    case "noteoff":
      onNoteOff(config, output, ev);
      break;
  }
}

function flushAll(config: Config, output: Output) {
  config.bindings.forEach((binding) => {
    tryFlush(config, output, binding.name);
  });
}

function main() {
  const config = loadConfig();

  const controller = findMidiController(config.controller_name);
  if (!controller) {
    throw new Error(`MIDI controller not found: ${config.controller_name}`);
  }

  flushAll(config, controller.output);

  addPulseAudioChangeListener((m: any) => {
    onPulseAudioChangeMessage(config, controller.output, m);
  });
  (controller.input as any).on("message", (m: any) => {
    try {
      onMidiMessage(config, controller.output, m);
    } catch (e) {
      console.error(`Error processing midi message`);
      console.error(e);
      console.error(`message: ${JSON.stringify(m)}`);
    }
  });
}

main();
