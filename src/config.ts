export const ControllerName = "X-TOUCH MINI"; // lsusb

export type Config = {
  pulseAudioDeviceName: string;
  pulseAudioDeviceType: "source" | "sink";
  midiKnobIndex: number;
  midiButtonToggleMute: number;
  midiButtonSetDefault: number;
};

export const configs: Config[] = [
  {
    pulseAudioDeviceName:
      "alsa_output.usb-Apple__Inc._USB-C_to_3.5mm_Headphone_Jack_Adapter_DWH211708ZLJKLTAN-00.analog-stereo",
    pulseAudioDeviceType: "sink",
    midiKnobIndex: 1,
    midiButtonToggleMute: 16,
    midiButtonSetDefault: 8,
  },
  {
    pulseAudioDeviceName:
      "alsa_output.usb-Logitech_Logitech_G430_Gaming_Headset-00.analog-stereo",
    pulseAudioDeviceType: "sink",
    midiKnobIndex: 2,
    midiButtonToggleMute: 17,
    midiButtonSetDefault: 9,
  },
  {
    pulseAudioDeviceName:
      "alsa_output.usb-Bose_Bose_USB_Link_082063Z12610201AE-00.analog-stereo",
    pulseAudioDeviceType: "sink",
    midiKnobIndex: 3,
    midiButtonToggleMute: 18,
    midiButtonSetDefault: 10,
  },
  {
    pulseAudioDeviceName:
      "alsa_input.usb-Antlion_Audio_Antlion_USB_Microphone-00.mono-fallback",
    pulseAudioDeviceType: "source",
    midiKnobIndex: 8,
    midiButtonToggleMute: 23,
    midiButtonSetDefault: 15,
  },
];
