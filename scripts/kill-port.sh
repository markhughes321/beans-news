#!/bin/bash
if [ -z "$1" ]; then
  echo "Usage: $0 <port_number>"
  exit 1
fi

PORT=$1
PID=$(lsof -ti :$PORT)
if [ -z "$PID" ]; then
  echo "No process found on port $PORT"
else
  kill -9 $PID
  echo "Killed process $PID on port $PORT"
fi
