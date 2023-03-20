import { Output } from "easymidi";
import { Config, ControllerName, configs } from "./config";
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

async function onCC(ev: CC) {
  const config = configs.find((cfg) => {
    return cfg.midiKnobIndex === ev.controller;
  });
  if (!config) return;

  if (config.pulseAudioDeviceType === "source") {
    await setSourceVolume(config.pulseAudioDeviceName, ev.value / 127.0);
  } else if (config.pulseAudioDeviceType === "sink") {
    await setSinkVolume(config.pulseAudioDeviceName, ev.value / 127.0);
  } else {
    throw new Error("unexpected");
  }
}

async function toggleMute(config: Config) {
  if (config.pulseAudioDeviceType === "source") {
    const pulseAudioDeviceIndex = await getSourceIndexByName(
      config.pulseAudioDeviceName
    );
    const isMuted = await getSourceMuted(config.pulseAudioDeviceName);
    return setPulseAudioSourceMute(pulseAudioDeviceIndex!, !isMuted);
  }

  if (config.pulseAudioDeviceType === "sink") {
    const pulseAudioDeviceIndex = await getSinkIndexByName(
      config.pulseAudioDeviceName
    );
    const isMuted = await getSinkMuted(config.pulseAudioDeviceName);
    return setPulseAudioSinkMute(pulseAudioDeviceIndex!, !isMuted);
  }

  throw new Error("unexpected");
}

export async function onNoteOn(output: Output, ev: NoteOn) {
  {
    const config = configs.find((cfg) => {
      return cfg.midiButtonToggleMute === ev.note;
    });

    if (config) {
      return toggleMute(config);
    }
  }

  {
    const config = configs.find((cfg) => {
      return cfg.midiButtonSetDefault === ev.note;
    });

    if (config) {
      config.pulseAudioDeviceType === "source"
        ? await setDefaultSource(config.pulseAudioDeviceName)
        : await setDefaultSink(config.pulseAudioDeviceName);

      flushAll(output);
    }
  }
}

function onNoteOff(output: Output, ev: NoteOff) {
  const config = configs.find(
    (cfg) =>
      ev.note === cfg.midiButtonToggleMute ||
      ev.note === cfg.midiButtonSetDefault
  );
  if (!config) return;

  flush(output, config.pulseAudioDeviceName);
}

async function flush(output: Output, pulseAudioDeviceName: string) {
  const config = configs.find(
    (cfg) => cfg.pulseAudioDeviceName === pulseAudioDeviceName
  );
  if (!config) return;

  const volume = toMidiVolume(
    config.pulseAudioDeviceType === "sink"
      ? await getSinkVolume(config.pulseAudioDeviceName)
      : await getSourceVolume(config.pulseAudioDeviceName)
  );

  const isMuted =
    config.pulseAudioDeviceType === "sink"
      ? await getSinkMuted(config.pulseAudioDeviceName)
      : await getSourceMuted(config.pulseAudioDeviceName);

  const isDefault =
    config.pulseAudioDeviceType === "sink"
      ? (await getDefaultSink()!) === config.pulseAudioDeviceName
      : (await getDefaultSource()!) === config.pulseAudioDeviceName;

  setKnob(output, 10, config.midiKnobIndex, volume);
  setLED(output, 10, config.midiButtonToggleMute, !isMuted);
  setLED(output, 10, config.midiButtonSetDefault, isDefault);
}

// Flush changes from pulseaudio to the midi controller
async function onPulseAudioChangeMessage(
  output: Output,
  msg: PulseAudioChangeMessage
) {
  const config = configs.find((cfg) => cfg.pulseAudioDeviceName === msg.name);
  if (!config) return;

  flush(output, msg.name);
}

async function onMidiMessage(output: Output, msg: any) {
  const ev = cast(msg);
  switch (ev._type) {
    case "cc":
      onCC(ev);
      break;
    case "noteon":
      onNoteOn(output, ev);
      break;
    case "noteoff":
      onNoteOff(output, ev);
      break;
  }
}

function flushAll(output: Output) {
  configs.forEach((config) => {
    flush(output, config.pulseAudioDeviceName);
  });
}

function main() {
  const controller = findMidiController(ControllerName);
  if (!controller) {
    throw new Error(`MIDI controller not found: ${ControllerName}`);
  }

  flushAll(controller.output);

  addPulseAudioChangeListener((m: any) => {
    onPulseAudioChangeMessage(controller.output, m);
  });
  (controller.input as any).on("message", (m: any) => {
    onMidiMessage(controller.output, m);
  });
}

main();
