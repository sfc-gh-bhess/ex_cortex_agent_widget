#!/bin/bash
set -e

echo "=== Installing cortex-chat-interface ==="
(cd cortex-chat-interface && npm install)

echo ""
echo "=== Installing cortex-chat-server ==="
(cd cortex-chat-server && npm install)

echo ""
echo "=== Installing sample-app ==="
(cd sample-app && npm install)

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  cd sample-app"
echo "  cp env.backend.example .env"
echo "  cp env.frontend.example .env.local"
echo "  # Edit .env and .env.local with your settings"
echo "  npm run start:all"
