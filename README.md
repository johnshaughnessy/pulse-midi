# pulse-midi

Control PulseAudio with a USB Midi Controller.

## Installation

On archlinux:

```sh
cd pacman
makepkg -Ccsfi
systemctl --user start pulse-midi
systemctl --user enable pulse-midi
```

Optionally, if you wish to restart the service whenever a usb device is connected/disconnected:

```sh

```

To uninstall:

```sh
sudo pacman -R pulse-midi
systemctl --user stop pulse-midi
systemctl --user daemon-reload
```

## Configuration

### Location

Configuration is read from the first file found in the following places:

- `$PULSE_MIDI_CONFIG`, if it exists.
- `$XDG_CONFIG/pulse-midi/config.yaml`, if it exists.
- `$HOME/.config/pulse-midi/config.yaml`, if it exists.
- `$PWD/config.yaml`, if it exists. (For running in development.)

If no configuration file is found, the program terminates with an error.

### Format

Configuration is parsed from a `yaml` file as a `Config`:

```typescript
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
```

- The `set_volume` value determines which MIDI `controller` index will control the volume of the pulse audio source/sink.
- The `toggle_mute` value determines which MIDI `note` index will toggle the mute state of the pulse audio source/sink.
- The `set_default` value determines which MIDI `note` index will set the pulse audio source/sink as the default.

For example, `config.yaml` might look like this:

```yaml
controller_name: X-TOUCH MINI
bindings:
  - name: alsa_output.usb-Apple__Inc._USB-C_to_3.5mm_Headphone_Jack_Adapter_DWH211708ZLJKLTAN-00.analog-stereo
    type: sink
    set_volume: 1
    toggle_mute: 16
    set_default: 8
  - name: alsa_input.usb-Antlion_Audio_Antlion_USB_Microphone-00.mono-fallback
    type: source
    set_volume: 8
    toggle_mute: 23
    set_default: 15
```

In this example, the name of the USB Midi Controller is `X-TOUCH MINI`, and there are two bindings: One `sink` and one `source`.

### Writing your config.yaml

Retrieve the name of your USB Midi Controller with `lsusb`:

```sh
lsusb | cut -d' ' -f7-
```

Retrieve the name of your audio sources and sinks with `pactl`:

```sh
pactl list sources short | awk '{print $2}'
```

```sh
pactl list sinks short | awk '{print $2}'
```

Retrieve information about your midi device with `ECHO_MIDI_MESSAGES`.

If you are running from source:

```sh
ECHO_MIDI_MESSAGES=1 npm start
```

If you are running as a systemd unit:

```sh
systemctl --user set-environment ECHO_MIDI_MESSAGES=1
systemctl --user restart pulse-midi
journalctl --user-unit pulse-midi -f

# When you are finished, unset the environment variable:
systemctl --user unset-environment ECHO_MIDI_MESSAGES
```

When you press a button on your device, it will log its `note` to the console:

```javascript
{ channel: 10, note: 8, velocity: 127, _type: 'noteon' }
{ channel: 10, note: 8, velocity: 0, _type: 'noteoff' }
```

When you change a knob or dial on your device, the program will log its `controller`:

```javascript
{ channel: 10, controller: 2, value: 51, _type: 'cc' }
```
