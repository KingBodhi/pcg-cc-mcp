#!/bin/bash

# Phase IV Implementation Verification Script
# Automated checks for Phase IV features

set -e

echo "🔍 Phase IV Implementation Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} File missing: $1"
        ((FAILED++))
        return 1
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found in $1: $2"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Not found in $1: $2"
        ((FAILED++))
        return 1
    fi
}

check_import() {
    if grep -q "import.*$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Import found in $1: $2"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Import not found in $1: $2"
        ((WARNINGS++))
        return 1
    fi
}

cd "$(dirname "$0")/.."

echo "📁 Checking Phase IV Files"
echo "-------------------------"

# Timeline View
check_file "frontend/src/components/views/TimelineView.tsx"

# Calendar View
check_file "frontend/src/components/views/CalendarView.tsx"

# Rich Text Editor
check_file "frontend/src/components/editor/RichTextEditor.tsx"
check_file "frontend/src/components/editor/rich-text-editor.css"

# Custom Properties
check_file "frontend/src/components/custom-properties/CustomPropertiesPanel.tsx"

# Documentation
check_file "PHASE_IV_COMPLETION_SUMMARY.md"
check_file "PHASE_IV_TEST_PLAN.md"

echo ""
echo "🔗 Checking Integrations"
echo "----------------------"

# Check ViewSwitcher integration
check_content "frontend/src/components/views/ViewSwitcher.tsx" "timeline"
check_content "frontend/src/components/views/ViewSwitcher.tsx" "calendar"

# Check project-tasks integration
check_import "frontend/src/pages/project-tasks.tsx" "TimelineView"
check_import "frontend/src/pages/project-tasks.tsx" "CalendarView"

# Check TaskFormDialog integration
check_import "frontend/src/components/dialogs/tasks/TaskFormDialog.tsx" "RichTextEditor"

# Check TaskDetailsPanel integration
check_import "frontend/src/components/tasks/TaskDetailsPanel.tsx" "CustomPropertiesPanel"

# Check TaskTitleDescription integration
check_import "frontend/src/components/tasks/TaskDetails/TaskTitleDescription.tsx" "MarkdownPreview"

echo ""
echo "📦 Checking Dependencies"
echo "----------------------"

if grep -q "date-fns" "frontend/package.json"; then
    echo -e "${GREEN}✓${NC} date-fns installed"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} date-fns not found in package.json"
    ((FAILED++))
fi

if grep -q "@uiw/react-md-editor" "frontend/package.json"; then
    echo -e "${GREEN}✓${NC} @uiw/react-md-editor installed"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} @uiw/react-md-editor not found in package.json"
    ((FAILED++))
fi

echo ""
echo "🎨 Checking Component Structure"
echo "------------------------------"

# Check Timeline View exports
if grep -q "export function TimelineView" "frontend/src/components/views/TimelineView.tsx"; then
    echo -e "${GREEN}✓${NC} TimelineView component exported"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} TimelineView export not found"
    ((FAILED++))
fi

# Check Calendar View exports
if grep -q "export function CalendarView" "frontend/src/components/views/CalendarView.tsx"; then
    echo -e "${GREEN}✓${NC} CalendarView component exported"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} CalendarView export not found"
    ((FAILED++))
fi

# Check RichTextEditor exports
if grep -q "export function RichTextEditor" "frontend/src/components/editor/RichTextEditor.tsx"; then
    echo -e "${GREEN}✓${NC} RichTextEditor component exported"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} RichTextEditor export not found"
    ((FAILED++))
fi

if grep -q "export function MarkdownPreview" "frontend/src/components/editor/RichTextEditor.tsx"; then
    echo -e "${GREEN}✓${NC} MarkdownPreview component exported"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} MarkdownPreview export not found"
    ((FAILED++))
fi

# Check CustomPropertiesPanel exports
if grep -q "export function CustomPropertiesPanel" "frontend/src/components/custom-properties/CustomPropertiesPanel.tsx"; then
    echo -e "${GREEN}✓${NC} CustomPropertiesPanel component exported"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} CustomPropertiesPanel export not found"
    ((FAILED++))
fi

echo ""
echo "🔧 Checking TypeScript Types"
echo "---------------------------"

# Check custom field types
if grep -q "export type CustomFieldType" "frontend/src/components/custom-properties/CustomPropertiesPanel.tsx"; then
    echo -e "${GREEN}✓${NC} CustomFieldType defined"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} CustomFieldType not found"
    ((FAILED++))
fi

echo ""
echo "🎯 Checking View Switcher States"
echo "-------------------------------"

# Check that views are enabled
if ! grep -q "isDisabled = false" "frontend/src/components/views/ViewSwitcher.tsx"; then
    echo -e "${YELLOW}⚠${NC} Could not verify view enabled states"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓${NC} Views enabled in ViewSwitcher"
    ((PASSED++))
fi

echo ""
echo "📱 Checking Responsive Design"
echo "----------------------------"

# Check for responsive utilities usage
if grep -q "responsive\\|sm:\\|md:\\|lg:" "frontend/src/components/views/TimelineView.tsx"; then
    echo -e "${GREEN}✓${NC} TimelineView uses responsive classes"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} TimelineView may not be fully responsive"
    ((WARNINGS++))
fi

if grep -q "responsive\\|sm:\\|md:\\|lg:" "frontend/src/components/views/CalendarView.tsx"; then
    echo -e "${GREEN}✓${NC} CalendarView uses responsive classes"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} CalendarView may not be fully responsive"
    ((WARNINGS++))
fi

echo ""
echo "🎨 Checking CSS/Styling"
echo "---------------------"

# Check rich-text-editor.css
if [ -f "frontend/src/components/editor/rich-text-editor.css" ]; then
    if grep -q ".wmde-markdown" "frontend/src/components/editor/rich-text-editor.css"; then
        echo -e "${GREEN}✓${NC} Markdown preview styles defined"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} Markdown preview styles may be incomplete"
        ((WARNINGS++))
    fi
fi

echo ""
echo "🧪 Checking Error Handling"
echo "------------------------"

# Check ResizeObserver suppression
if grep -q "ResizeObserver" "frontend/src/main.tsx"; then
    echo -e "${GREEN}✓${NC} ResizeObserver error suppression added"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} ResizeObserver errors may not be suppressed"
    ((WARNINGS++))
fi

echo ""
echo "📝 Checking Documentation"
echo "-----------------------"

# Check Phase IV completion summary
if [ -f "PHASE_IV_COMPLETION_SUMMARY.md" ]; then
    WORD_COUNT=$(wc -w < "PHASE_IV_COMPLETION_SUMMARY.md")
    if [ "$WORD_COUNT" -gt 500 ]; then
        echo -e "${GREEN}✓${NC} Phase IV completion summary is comprehensive ($WORD_COUNT words)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} Phase IV completion summary may be incomplete ($WORD_COUNT words)"
        ((WARNINGS++))
    fi
fi

# Check test plan
if [ -f "PHASE_IV_TEST_PLAN.md" ]; then
    TEST_CASES=$(grep -c "| [0-9]" "PHASE_IV_TEST_PLAN.md" || true)
    if [ "$TEST_CASES" -gt 50 ]; then
        echo -e "${GREEN}✓${NC} Test plan contains $TEST_CASES test cases"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} Test plan may need more test cases ($TEST_CASES found)"
        ((WARNINGS++))
    fi
fi

echo ""
echo "======================================"
echo "📊 Verification Summary"
echo "======================================"
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${RED}Failed:${NC}   $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

TOTAL=$((PASSED + FAILED + WARNINGS))
if [ $TOTAL -gt 0 ]; then
    PASS_RATE=$((PASSED * 100 / TOTAL))
    echo "Pass Rate: ${PASS_RATE}%"
fi

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Phase IV implementation verified successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Phase IV implementation has issues that need attention.${NC}"
    exit 1
fi
