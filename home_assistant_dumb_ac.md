---
layout: default
---

# Home Assistant control of a dumb A/C unit

These lines are added to Home Assistant's configuration.yaml and/or
automations.yaml.

I use this to control my Pioneer mini-split for which I have only a simple
remote control. The remote is  one-way communication. The mini split does not
provide feedback about whether it's running. Therefore I use a timer,
`cooling_timer`, that starts the A/C unit (through the Broadlink) and then
turns off the A/C unit when the timer finishes. A second timer,
`cooling_upkeeper_timer`, refreshes the main timer if more cooling is needed
so that unnecessary IR commands are not sent to the A/C unit. This is
particularly needed because the unit beeps whenever it receives a command,
which is annoying if it happens often.

Requires:

- An IR blaster with an integration like
  https://www.home-assistant.io/integrations/broadlink/ called
  `remote.broadlink_remote` here. The device must have been set up with
  commands like 'Turn off' and 'cool-auto-77-swing' for a device named 'AC'.

- A sensor `sensor.room_temperature` that provides the current temperature.

Better alternatives include

- https://github.com/smartHomeHub/SmartIR for wrapping the controls in a
  proper Climate integration (https://www.home-assistant.io/integrations/climate/).
- Use a door sensor on the A/C exhaust louvers to detect if they are open thus
  to sense if the A/C unit is running. (My unit is hardwired so I don't to detect
  activity using electric draw.)

## configuration.yaml

```yaml
timer:
  # This main timer turns the A/C on when the timer starts and off when the
  # timer finishes.
  cooling_timer:
    name: "Cooling timer"
    restore: true

  # The upkeep timer checks the temperature  when it finishes. If more cooling
  # is needed, it restarts cooling_timer.
  cooling_upkeep_timer:
    name: "Cooling upkeep timer"
    restore: true
```

## automation.yaml

```yaml
automation:
     
  - id: 'automation-turn-on-ac'
    alias: Turn on AC cooling when high temperature
    trigger:
    # Turn on above 78 degrees F.
    - type: temperature
      platform: device
      entity_id: sensor.room_temperature
      domain: sensor
      above: 78
    action:
    - service: timer.start
      metadata: {}
      data:
        duration: 00:31:00
      target:
        entity_id: timer.room_cooling_timer
    - service: timer.start
      metadata: {}
      data:
        duration: 00:30:00
      target:
        entity_id: timer.room_cooling_upkeep_timer
    mode: single

  - id: 'automation-cooling-upkeep-timer-finished'
    alias: Living room cooling upkeep timer finished
    trigger:
    - platform: event
      event_type: timer.finished
      event_data:
        entity_id: timer.cooling_upkeep_timer
    condition:
    - condition: numeric_state
      entity_id: sensor.room_temperature
      above: 76
    action:
    - service: timer.start
      metadata: {}
      data:
        duration: 00:31:00
      target:
        entity_id: timer.living_room_cooling
    - service: timer.start
      metadata: {}
      data:
        duration: 00:30:00
      target:
        entity_id: timer.living_room_cooling_upkeep
    mode: single

  - id: 'automation-start-ac-with-timer'
    alias: Room cooling timer - started
    trigger:
    - platform: event
      event_type: timer.started
      event_data:
        entity_id: timer.living_room_cooling
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
  
  - id: 'automation-turn-off-ac-after-timer'
    alias: Turn off A/C after timer
    trigger:
    - platform: event
      event_type: timer.finished
      event_data:
        entity_id: timer.living_room_cooling
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
        command: Turn off
      target:
        device_id: remote.broadlink_remote
```
