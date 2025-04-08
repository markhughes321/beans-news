#!/usr/bin/env bash

# Input parameter (optional)
target_folder="$1"

# Output file
output_file="combined_project_files.js"

# Remove the output file if it already exists
if [ -f "$output_file" ]; then
    rm "$output_file"
fi

# Set a limit for how many files to combine (optional)
file_limit=50
file_count=0

# Determine search path
if [ "$target_folder" == "frontend" ] || [ "$target_folder" == "server" ]; then
    search_path="./$target_folder"
else
    search_path="."  # Default to entire project
fi

echo "Searching in: $search_path"
echo "Including files (up to $file_limit):"
echo "------------------------------------"

# Loop through matching files
find "$search_path" -type f \( -name "*.js" -o -name "*.db" -o -name "*.env" -o -name "*.md" \) \
  -not -path "*/node_modules/*" \
  -not -name "structure.md" \
  -not -iname "readme.md" \
  -not -path "*/logs/*" \
  -not -path "*/reports/*" \
  -not -path "*/backendApproach/*" \
  -not -path "*/dataRequired/*" \
  -not -path "*/doc/*" \
  | while read -r file; do

    if [ "$file_count" -ge "$file_limit" ]; then
        break
    fi

    # Print to terminal
    echo "$file"

    # Append to output file
    echo "// File: $file" >> "$output_file"
    cat "$file" >> "$output_file"
    echo -e "\n\n" >> "$output_file"

    file_count=$((file_count + 1))
done

echo "------------------------------------"
echo "✅ Combined $file_count files from '${target_folder:-entire project}' into $output_file."
