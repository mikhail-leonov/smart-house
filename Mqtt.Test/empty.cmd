#!/bin/bash

# ----------- CONFIG ------------
BROKER="mqtt.jarvis.home" # Change to your MQTT broker IP or hostname
PORT="1883"               # Default Mosquitto port
TOPIC_PREFIX="#"          # Use # for all topics or narrow down if needed
# -------------------------------

echo "Fetching retained topics from $BROKER..."

mosquitto_sub -h "$BROKER" -p "$PORT" -t "$TOPIC_PREFIX" -v -R -C 1 \
  | while read -r topic _; do
    echo "Clearing retained message on: $topic"
    mosquitto_pub -h "$BROKER" -p "$PORT" -t "$topic" -r -n 
  done

echo "Done cleaning retained MQTT messages!"
