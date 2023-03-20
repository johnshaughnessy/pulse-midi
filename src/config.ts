export const ControllerName = "X-TOUCH MINI"; // lsusb

type Config = {
  pulseAudioDeviceName: string;
  pulseAudioDeviceType: "source" | "sink";
  midiKnobIndex: number;
  midiMuteIndex: number;
  midiUnmuteIndex: number;
};

export const configs: Config[] = [
  {
    pulseAudioDeviceName:
      "alsa_output.usb-Apple__Inc._USB-C_to_3.5mm_Headphone_Jack_Adapter_DWH211708ZLJKLTAN-00.analog-stereo",
    pulseAudioDeviceType: "sink",
    midiKnobIndex: 1,
    midiMuteIndex: 16,
    midiUnmuteIndex: 8,
  },
  {
    pulseAudioDeviceName:
      "alsa_output.usb-Logitech_Logitech_G430_Gaming_Headset-00.analog-stereo",
    pulseAudioDeviceType: "sink",
    midiKnobIndex: 2,
    midiMuteIndex: 17,
    midiUnmuteIndex: 9,
  },
  {
    pulseAudioDeviceName:
      "alsa_output.usb-Bose_Bose_USB_Link_082063Z12610201AE-00.analog-stereo",
    pulseAudioDeviceType: "sink",
    midiKnobIndex: 3,
    midiMuteIndex: 18,
    midiUnmuteIndex: 10,
  },
  {
    pulseAudioDeviceName:
      "alsa_input.usb-Antlion_Audio_Antlion_USB_Microphone-00.mono-fallback",
    pulseAudioDeviceType: "source",
    midiKnobIndex: 8,
    midiMuteIndex: 23,
    midiUnmuteIndex: 15,
  },
];
