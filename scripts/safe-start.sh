#!/bin/bash

# Port to check
PORT=3000

echo "🛡️  Checking for processes on port $PORT..."

# Find PID of process listening on port 3000
PID=$(lsof -t -i:$PORT)

if [ -z "$PID" ]; then
    echo "✅ Port $PORT is free."
else
    echo "⚠️  Found process $PID running on port $PORT. Terminating..."
    kill -9 $PID
    echo "💀 Process $PID killed."
fi

echo "🚀 Starting development server..."
exec npm run next:dev
