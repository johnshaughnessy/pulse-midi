import { Output } from "easymidi";
import { ControllerName, configs } from "./config";
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
  getSinkIndexByName,
  getSinkMuted,
  getSinkVolume,
  getSourceIndexByName,
  getSourceMuted,
  getSourceVolume,
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

export async function onNoteOn(ev: NoteOn) {
  const config = configs.find((cfg) => {
    return cfg.midiMuteIndex === ev.note || cfg.midiUnmuteIndex === ev.note;
  });
  if (!config) return;

  const mute = config.midiMuteIndex === ev.note;
  const pulseAudioDeviceIndex =
    config.pulseAudioDeviceType === "source"
      ? await getSourceIndexByName(config.pulseAudioDeviceName)
      : await getSinkIndexByName(config.pulseAudioDeviceName);

  if (!pulseAudioDeviceIndex) {
    console.error(
      `could not find device for name ${config.pulseAudioDeviceName}`
    );
    return;
  }

  if (config.pulseAudioDeviceType === "source") {
    setPulseAudioSourceMute(pulseAudioDeviceIndex, mute);
  } else {
    setPulseAudioSinkMute(pulseAudioDeviceIndex, mute);
  }
}

function onNoteOff(output: Output, ev: NoteOff) {
  const config = configs.find(
    (cfg) => ev.note === cfg.midiMuteIndex || ev.note === cfg.midiUnmuteIndex
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

  setKnob(output, 10, config.midiKnobIndex, volume);
  setLED(output, 10, config.midiMuteIndex, isMuted);
  setLED(output, 10, config.midiUnmuteIndex, !isMuted);
}

// Flush changes from pulseaudio to the midi controller
async function onPulseAudioChangeMessage(
  output: Output,
  msg: PulseAudioChangeMessage
) {
  const config = configs.find((cfg) => cfg.pulseAudioDeviceName === msg.name);
  if (!config) return;

  flush(output, msg.name);
  // setKnob(output, 10, config.midiKnobIndex, toMidiVolume(msg.volume));
  // setLED(output, 10, config.midiMuteIndex, msg.muted);
  // setLED(output, 10, config.midiUnmuteIndex, !msg.muted);
}

async function onMidiMessage(output: Output, msg: any) {
  const ev = cast(msg);
  switch (ev._type) {
    case "cc":
      onCC(ev);
      break;
    case "noteon":
      onNoteOn(ev);
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
