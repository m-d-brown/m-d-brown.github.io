# Smart Mini-Split Control in Home Assistant

A timer-based approach for controlling a one-way A/C unit with an IR blaster.

## Problem

This setup is designed to control a Pioneer mini-split that has a simple, one-way IR remote control. Because the A/C unit doesn't provide any feedback on its current state (on/off, temperature), we need a reliable way to manage it within Home Assistant.

Requirements

-   An IR blaster integrated into Home Assistant, such as a Broadlink device. In the examples below, this is named `remote.broadlink_remote`.
-   The IR blaster must be taught the necessary commands. For this guide, you'll need commands like 'Turn off' and 'cool-auto-77-swing' for a device named 'AC'.
-   A temperature sensor that provides the current room temperature, identified as `sensor.room_temperature`.

## Solution: Dual Timers

The core of this solution uses two timers to avoid sending unnecessary IR commands, which can be annoying due to the beep sound with each command.

-   **`cooling_timer`**: This is the main timer. When started, it sends the 'On' command to the A/C unit via a Broadlink IR blaster. When this timer finishes, it sends the 'Off' command.
-   **`cooling_upkeeper_timer`**: This is a helper timer. It runs on a short interval to check if cooling is still needed. If it is, it refreshes the main `cooling_timer`, effectively extending the cooling period without sending a new IR command.

## Configuration Files

Add the following snippets to your `configuration.yaml` and/or `automations.yaml` files.

#### configuration.yaml

```yaml
...

timer:
  cooling_timer:
    name: Cooling Timer
    duration: '00:15:00' # Runs for 15 minutes by default
  cooling_upkeeper_timer:
    name: Cooling Upkeeper
    duration: '00:01:00' # Refreshes every 1 minute

input_boolean:
  cooling_on:
    name: Cooling On
    icon: mdi:snowflake

input_number:
  target_temperature:
    name: Target Temperature
    initial: 74
    min: 68
    max: 80
    step: 1
    unit_of_measurement: °F
    icon: mdi:thermometer
...
```
