---
layout: default
---

# Home Assistant control of a dumb A/C unit

This is a guide to turning on and off a "dumb" A/C unit using only an IR
blaster controller and a temperature sensor. This is a challenge because a
"dumb" unit doesn't provide a signal as to whether the A/C is on or off,
preventing the use of a standard thermometer controller.

I use this setup to control my Pioneer mini-split for which I have only a simple
remote control. The remote is  one-way communication. The mini split does not
provide feedback about whether it's running. Therefore I use a timer,
`cooling_timer`. **The timer maintains the state of whether the A/C is on.**
With this, the timer starts the A/C unit (through the Broadlink) when the
timer itself beings. When the timer ends, it either refreshes itself (because
more cooling is needed) or turns off the A/C unit.

A/C commands are sent through the timer so that the commands are sent only when
the timer is started for the first time. This isneeded because the unit beeps
whenever it receives a command, which is annoying if it happens often.

## Requirements

This setup requires:

- An IR blaster with an integration like
  [Home Assistant's Broadlink](https://www.home-assistant.io/integrations/broadlink/)
   called
  `remote.broadlink_remote` here. The device must have been set up with
  commands like 'Turn off' and 'cool-auto-77-swing' for a device named 'AC'.
- A sensor `sensor.room_temperature` that provides the current temperature.
- A timer, called `timer.cooling_timer` in my example setup here.

## Alternatives

Better alternatives include:

- [SmartIR](https://github.com/smartHomeHub/SmartIR) for wrapping the controls in a
  proper [Climate integration](https://www.home-assistant.io/integrations/climate/).
  This requires a "non-dumb" (smart) sensor for whether the A/C is on at any
  time.
- Using a door sensor on the A/C exhaust louvers to detect if they are open thus
  to sense if the A/C unit is running. (My unit is hardwired so I don't to detect
  activity using electric draw.)

## Configuration

You'll need to add these lines to Home Assistant's configuration.yaml and/or
automations.yaml files.

### configuration.yaml

```yaml
timer:
  # cooling_timer is started when the A/C is turned on. Whether its running
  # maintains the state we need as to whether the A/C eventually needs to be
  # turned off.
  cooling_timer:
    name: "Cooling timer"
    icon: "mdi:air-conditioner"
    restore: true
```

### automation.yaml

#### turn-on-ac

When `room_temperature` is high, start the timer. The starting of the timer
separately sends the IR remote command to turn on the A/C. If it's already
running, **nothing happens**.

```yaml
automation:
...
  - id: 'turn-on-ac'
    alias: Turn on AC cooling when temperature is high
    # Turn on above 78 degrees F.
    triggers:
    - type: temperature
      entity_id: sensor.room_temperature
      domain: sensor
      above: 78
      trigger: device
    condition: []
    actions:
    - metadata: {}
      data:
        duration: 00:30:00
      target:
        entity_id: timer.cooling_timer
      action: timer.start
    mode: single
```

#### cooling-timer-started

Send the IR remote command. This is run by the timer start trigger so that
command is sent only when the timer is started for the first time.

```yaml
automation:
...
  - id: 'cooling-timer-started'
    alias: Cooling timer - started
    trigger:
    - platform: event
      event_type: timer.started
      event_data:
        entity_id: timer.cooling_timer
    condition: []
    action:
    # Must be set up with Broadlink integration or similar:
    # https://www.home-assistant.io/integrations/broadlink/
    - service: remote.send_command
      metadata: {}
      data:
        num_repeats: 1
        delay_secs: 0.4
        hold_secs: 0
        device: AC
        command: cool-auto-77-swing
      target:
        device_id: remote.broadlink_remote
    mode: single
```

#### cooling-timer-finished

When the timer finishes, check `room_temperature`. If it's not below the target
(76 F, for hysteresis), then simply restart the timer so that the A/C will
continue running for another cycle. Otherwise, the timer is going away so
turn off the A/C.

```yaml
automation:
...
  - id: 'cooling-timer-finished'
    alias: Living room cooling upkeep timer finished
    triggers:
    - event_type: timer.finished
      event_data:
        entity_id: timer.cooling_timer
      trigger: event
    conditions: []
    actions:
    - if:
      - condition: numeric_state
        entity_id: sensor.room_temperature
        above: 76
      then:
      - metadata: {}
        data:
          duration: 00:30:00
        target:
          entity_id: timer.living_room_cooling
        action: timer.start
      else:
      # Must be set up with Broadlink integration or similar: 
      # https://www.home-assistant.io/integrations/broadlink/
      - metadata: {}
        action: remote.send_command
        data:
          num_repeats: 1
          delay_secs: 0.4
          hold_secs: 0
          device: AC
          command: Turn off
        target:
          device_id: remote.broadlink_remote
    mode: single
```
