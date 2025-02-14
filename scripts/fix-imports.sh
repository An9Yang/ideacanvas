#!/bin/bash

# Fix utils imports
find . -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from '"'"'@/lib/utils'"'"'|from '"'"'@/lib/utils/common'"'"'|g'

# Fix types imports
find . -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from '"'"'@/lib/types'"'"'|from '"'"'@/lib/types/common'"'"'|g'

# Fix service imports
find . -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from '"'"'@/lib/chat-service'"'"'|from '"'"'@/lib/services/chat'"'"'|g'
find . -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from '"'"'@/lib/openai-service'"'"'|from '"'"'@/lib/services/openai'"'"'|g'
