#!/usr/bin/env bash

# Output file
output_file="combined_project_files.js"

# Remove the output file if it already exists
if [ -f "$output_file" ]; then
    rm "$output_file"
fi

# Set a limit for how many files to combine (optional: comment out or set a high value if not needed)
file_limit=50
file_count=0

# Loop through important .js, .db, .env, and .md files in the project,
# excluding node_modules, logs, reports, and specific files/folders.
find . -type f \( -name "*.js" -o -name "*.db" -o -name "*.env" -o -name "*.md" \) \
  -not -path "*/node_modules/*" \
  -not -name "structure.md" \
  -not -iname "readme.md" \
  -not -path "./logs/*" \
  -not -path "./backendApproach/*" \
  -not -path "./dataRequired/*" \
  -not -name "database.md" \
  -not -path "./doc/*" \
  -not -path "./reports/*" \
  | while read -r file; do

    # Break the loop if the file limit is reached
    if [ "$file_count" -ge "$file_limit" ]; then
        break
    fi

    # Append the file contents to the output file with a comment header
    echo "// File: $file" >> "$output_file"
    cat "$file" >> "$output_file"
    echo -e "\n\n" >> "$output_file"

    # Increment file count
    file_count=$((file_count + 1))
done

echo "Combined $file_count files into $output_file."
