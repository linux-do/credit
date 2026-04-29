#!/bin/sh

set -e

replace_placeholder() {
  local placeholder="$1"
  local real_value="$2"

  if [ -z "$real_value" ]; then
    echo "⚠️ WARNING: Environment variable for placeholder '${placeholder}' is not set. Skipping replacement."
    return 0
  fi

  echo "🔍 Replacing placeholder '${placeholder}' with value '${real_value}'"

  local escaped
  escaped=$(printf '%s\n' "$real_value" | sed 's/[&/\]/\\&/g')

  local files
  files=$(grep -rl "$placeholder" /app/.next || true)

  if [ -z "$files" ]; then
    echo "⚠️  WARNING: placeholder '${placeholder}' not found in any file"
  else
    local count
    count=$(echo "$files" | wc -l)
    echo "$files" | xargs sed -i "s|${placeholder}|${escaped}|g"
    echo "✅ Replaced '${placeholder}' in ${count} file(s)"
  fi
}

replace_placeholder "https://build-placeholder.invalid" "$NEXT_PUBLIC_LINUX_DO_CREDIT_BACKEND_URL"
replace_placeholder "__LINUX_DO_CREDIT_SESSION_COOKIE_NAME__" "$LINUX_DO_CREDIT_SESSION_COOKIE_NAME"
replace_placeholder "__LINUX_DO_CREDIT_RATE_LIMIT_ENABLED__" "$LINUX_DO_CREDIT_RATE_LIMIT_ENABLED"

exec "$@"
