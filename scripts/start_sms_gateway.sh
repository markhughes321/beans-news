#!/bin/bash

echo "Stopping any existing processes on port 5001..."
PID_5001=$(lsof -ti:5001)  # Find process using port 5001
if [ -n "$PID_5001" ]; then
    echo "Killing process on port 5001 (PID: $PID_5001)..."
    kill -9 "$PID_5001"
    sleep 2  # Allow time for the process to stop
fi

echo "Checking for existing ngrok sessions..."
NGROK_PID=$(pgrep -f "ngrok")
if [ -n "$NGROK_PID" ]; then
    echo "Stopping existing ngrok session (PID: $NGROK_PID)..."
    kill "$NGROK_PID"
    sleep 2  # Allow time for ngrok to stop
fi

echo "Starting SMS Gateway Server..."
cd /home/mark/Repositories/sms-gateway && npm run start &

# Wait for the server to start (adjust if needed)
sleep 10  

echo "Starting ngrok..."
ngrok http 5001 > /dev/null &

# Wait for ngrok to establish connection
sleep 5  

# Get the ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

if [ -z "$NGROK_URL" ]; then
    echo "Failed to retrieve ngrok URL. Is ngrok running correctly?"
else
    echo "Ngrok URL: $NGROK_URL"
fi
