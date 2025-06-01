#!/bin/bash

echo "🔧 Fixing Kajabi compatibility issues..."

# Fix section tags in all liquid files
echo "📝 Fixing section tags..."
find . -name "*.liquid" -type f | while read -r file; do
    # Skip if file is in temp directories
    if [[ "$file" == *"temp"* ]] || [[ "$file" == *"kajabi-theme-export"* ]]; then
        continue
    fi
    
    # Create temp file
    temp_file="${file}.tmp"
    
    # Replace {% section with <div and {% endsection %} with </div>
    sed -E 's/\{%[[:space:]]*section[[:space:]]+"([^"]+)"[[:space:]]*%\}/<div class="\1">/g; s/\{%[[:space:]]*section[[:space:]]+([^%]+)%\}/<div class=\1>/g; s/\{%[[:space:]]*endsection[[:space:]]*%\}/<\/div>/g' "$file" > "$temp_file"
    
    # Replace the original file
    mv "$temp_file" "$file"
done

echo "📝 Fixing render tags to include..."
find . -name "*.liquid" -type f | while read -r file; do
    # Skip if file is in temp directories
    if [[ "$file" == *"temp"* ]] || [[ "$file" == *"kajabi-theme-export"* ]]; then
        continue
    fi
    
    # Create temp file
    temp_file="${file}.tmp"
    
    # Replace {% render with {% include
    sed 's/{% render /{% include /g' "$file" > "$temp_file"
    
    # Replace the original file
    mv "$temp_file" "$file"
done

echo "📝 Fixing schema settings to elements..."
find . -path "./sections/*.liquid" -type f | while read -r file; do
    # Create temp file
    temp_file="${file}.tmp"
    
    # In the schema section, replace "settings": with "elements":
    awk '
    BEGIN { in_schema = 0 }
    /{% schema %}/ { in_schema = 1 }
    /{% endschema %}/ { in_schema = 0 }
    {
        if (in_schema && /^[[:space:]]*"settings"[[:space:]]*:/) {
            gsub(/"settings"[[:space:]]*:/, "\"elements\":")
        }
        print
    }
    ' "$file" > "$temp_file"
    
    # Replace the original file
    mv "$temp_file" "$file"
done

echo "📝 Removing invalid template tags..."
# Remove {% layout 'theme' %} type tags if any exist
find . -name "*.liquid" -type f | while read -r file; do
    if [[ "$file" == *"temp"* ]] || [[ "$file" == *"kajabi-theme-export"* ]]; then
        continue
    fi
    
    temp_file="${file}.tmp"
    grep -v '{% layout' "$file" > "$temp_file" || cp "$file" "$temp_file"
    mv "$temp_file" "$file"
done

echo "✅ Compatibility fixes complete!"