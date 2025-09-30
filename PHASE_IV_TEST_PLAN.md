# Phase IV - Comprehensive Test Plan

**Date**: September 30, 2025
**Application**: COMMAND CENTER (PCG Dashboard)
**Testing URL**: http://localhost:3004
**Backend URL**: http://127.0.0.1:3005

---

## 🎯 Test Objectives

1. Verify all Phase IV features are functional
2. Ensure integration with existing Phase I-III features
3. Validate user workflows end-to-end
4. Check for console errors and performance issues
5. Test data persistence (localStorage)
6. Verify responsive design and UI consistency

---

## 📋 Test Matrix

### Feature 1: Timeline View

#### Test Cases

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 1.1 | Access Timeline View | 1. Navigate to project tasks<br>2. Click View Switcher<br>3. Select "Timeline" | Timeline view displays with calendar and task list | ⏳ |
| 1.2 | Month Navigation | 1. In Timeline view<br>2. Click "Next Month" button | Calendar advances to next month | ⏳ |
| 1.3 | Previous Month | 1. Click "Previous Month" button | Calendar goes back one month | ⏳ |
| 1.4 | Today Button | 1. Navigate to different month<br>2. Click "Today" button | Returns to current month | ⏳ |
| 1.5 | Task Grouping by Date | 1. View timeline<br>2. Check tasks on calendar days | Tasks grouped by creation date | ⏳ |
| 1.6 | Status Color Coding | 1. View tasks in timeline | Tasks show correct status colors:<br>- Todo: Blue<br>- In Progress: Yellow<br>- Done: Green<br>- Cancelled: Gray | ⏳ |
| 1.7 | Task Click | 1. Click on task in timeline | Task details panel opens | ⏳ |
| 1.8 | Empty State | 1. Navigate to month with no tasks | Shows "No tasks" message | ⏳ |
| 1.9 | Task Count Display | 1. View day with multiple tasks | Shows task count badge | ⏳ |
| 1.10 | Responsive Layout | 1. Resize browser window | Timeline adapts responsively | ⏳ |

---

### Feature 2: Calendar View

#### Test Cases

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 2.1 | Access Calendar View | 1. Click View Switcher<br>2. Select "Calendar" | Calendar grid displays | ⏳ |
| 2.2 | Month Grid Layout | 1. View calendar | Shows 7-column grid (Sun-Sat)<br>All days of month visible | ⏳ |
| 2.3 | Cross-Month Days | 1. Check first/last weeks | Shows trailing/leading days from adjacent months in reduced opacity | ⏳ |
| 2.4 | Tasks on Dates | 1. View days with tasks | Tasks display on correct creation dates | ⏳ |
| 2.5 | Overflow Indicator | 1. Find day with 4+ tasks | Shows first 3 tasks + "+X more" indicator | ⏳ |
| 2.6 | Quick Add Task | 1. Click "+" on any day | Opens task creation form | ⏳ |
| 2.7 | Task Click from Calendar | 1. Click task badge on calendar | Opens task details | ⏳ |
| 2.8 | Month Navigation | 1. Use prev/next/today buttons | Calendar navigates correctly | ⏳ |
| 2.9 | Status Colors in Calendar | 1. View task badges | Colors match task status | ⏳ |
| 2.10 | Weekend Highlighting | 1. View calendar | Saturday/Sunday visually distinguished | ⏳ |

---

### Feature 3: Rich Text Editor

#### Test Cases

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 3.1 | Access Editor in New Task | 1. Create new task<br>2. Focus description field | Rich text editor loads with toolbar | ⏳ |
| 3.2 | View Mode Switching | 1. Click Edit/Split/Preview tabs | Editor switches between modes | ⏳ |
| 3.3 | Bold Formatting | 1. Type `**bold text**`<br>2. Switch to Preview | Text renders bold | ⏳ |
| 3.4 | Italic Formatting | 1. Type `*italic*`<br>2. Switch to Preview | Text renders italic | ⏳ |
| 3.5 | Code Blocks | 1. Type ` ```js\ncode\n``` `<br>2. Preview | Code block with syntax highlighting | ⏳ |
| 3.6 | Inline Code | 1. Type `` `code` ``<br>2. Preview | Inline code styling | ⏳ |
| 3.7 | Headings | 1. Type `# Heading`<br>2. Preview | Heading renders with correct size | ⏳ |
| 3.8 | Bullet Lists | 1. Type `- item 1\n- item 2`<br>2. Preview | Bulleted list renders | ⏳ |
| 3.9 | Numbered Lists | 1. Type `1. First\n2. Second`<br>2. Preview | Numbered list renders | ⏳ |
| 3.10 | Links | 1. Type `[text](url)`<br>2. Preview | Clickable link renders | ⏳ |
| 3.11 | Tables | 1. Use table toolbar button<br>2. Add data<br>3. Preview | Table renders correctly | ⏳ |
| 3.12 | Blockquotes | 1. Type `> quote`<br>2. Preview | Quote styling applied | ⏳ |
| 3.13 | Checkboxes | 1. Type `- [ ] task`<br>2. Preview | Checkbox renders | ⏳ |
| 3.14 | Horizontal Rule | 1. Type `---`<br>2. Preview | Horizontal line appears | ⏳ |
| 3.15 | Task Edit Preserves Markdown | 1. Create task with markdown<br>2. Edit task<br>3. Check description field | Markdown source preserved in editor | ⏳ |
| 3.16 | Task View Shows Formatted | 1. View task details<br>2. Check description | Markdown rendered as formatted HTML | ⏳ |
| 3.17 | Auto-save | 1. Type in editor<br>2. Switch tabs | Content preserved | ⏳ |
| 3.18 | Dark Mode Compatibility | 1. Switch to dark mode<br>2. Use editor | Editor styling adapts | ⏳ |
| 3.19 | Toolbar Commands | 1. Click each toolbar button | Correct markdown inserted | ⏳ |
| 3.20 | Expand/Collapse Description | 1. Create task with long description<br>2. View in task list | Description truncates with expand button | ⏳ |

---

### Feature 4: Custom Properties Panel

#### Test Cases

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 4.1 | First Time Access | 1. Open task details<br>2. Scroll to Custom Properties | Shows "No properties" message with "Add Properties" button | ⏳ |
| 4.2 | Open Manage Dialog | 1. Click "Add Properties" or edit button | Manage Custom Properties dialog opens | ⏳ |
| 4.3 | Create Text Field | 1. Click "Add Field"<br>2. Set name="Summary"<br>3. Type="Text"<br>4. Save | Field created and appears in list | ⏳ |
| 4.4 | Create Number Field | 1. Add field: "Story Points", Type=Number | Number field created | ⏳ |
| 4.5 | Create Date Field | 1. Add field: "Due Date", Type=Date | Date field created | ⏳ |
| 4.6 | Create URL Field | 1. Add field: "Design URL", Type=URL | URL field created | ⏳ |
| 4.7 | Create Checkbox Field | 1. Add field: "Approved", Type=Checkbox | Checkbox field created | ⏳ |
| 4.8 | Create Select Field | 1. Add field: "Priority", Type=Select<br>2. Add options: Low, Medium, High | Select field with options created | ⏳ |
| 4.9 | Create Multi-Select Field | 1. Add field: "Tags", Type=Multi-Select<br>2. Add options | Multi-select field created | ⏳ |
| 4.10 | Edit Field Definition | 1. Click edit on existing field<br>2. Change name<br>3. Save | Field updated | ⏳ |
| 4.11 | Delete Field Definition | 1. Click delete on field<br>2. Confirm | Field removed | ⏳ |
| 4.12 | Required Field Toggle | 1. Edit field<br>2. Check "Required"<br>3. Save | Field marked as required | ⏳ |
| 4.13 | Enter Text Value | 1. In task, enter value in text field<br>2. Close task<br>3. Reopen | Value persisted | ⏳ |
| 4.14 | Enter Number Value | 1. Enter number (e.g., 8)<br>2. Verify persistence | Number value saved | ⏳ |
| 4.15 | Select Date | 1. Click date field<br>2. Select date<br>3. Verify persistence | Date saved and displayed | ⏳ |
| 4.16 | Check Checkbox | 1. Toggle checkbox<br>2. Verify persistence | Checkbox state saved | ⏳ |
| 4.17 | Select from Dropdown | 1. Select option from select field<br>2. Verify | Selection saved | ⏳ |
| 4.18 | Multi-Select Options | 1. Check multiple options<br>2. Verify | All selections saved | ⏳ |
| 4.19 | Expand/Collapse Panel | 1. Click panel header | Panel expands/collapses | ⏳ |
| 4.20 | Properties Per Project | 1. Create fields in Project A<br>2. Switch to Project B | Project B has independent field definitions | ⏳ |
| 4.21 | Values Per Task | 1. Set values in Task 1<br>2. Open Task 2 | Task 2 has empty/default values | ⏳ |
| 4.22 | LocalStorage Persistence | 1. Set values<br>2. Refresh browser<br>3. Reopen task | Values persist after refresh | ⏳ |

---

### Integration Testing

#### View Switching

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| I.1 | Switch Between All Views | 1. Board → Table → Gallery → Timeline → Calendar → Board | All views load correctly | ⏳ |
| I.2 | View State Persistence | 1. Select Timeline<br>2. Refresh browser | Timeline view still active | ⏳ |
| I.3 | Filtered Tasks in Timeline | 1. Apply filter<br>2. Switch to Timeline | Filtered tasks shown in Timeline | ⏳ |
| I.4 | Filtered Tasks in Calendar | 1. Apply filter<br>2. Switch to Calendar | Filtered tasks shown in Calendar | ⏳ |
| I.5 | Search in Timeline | 1. Enter search term<br>2. Switch to Timeline | Search results shown in Timeline | ⏳ |

#### Task CRUD Operations

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| I.6 | Create Task with Markdown | 1. Create task with markdown description<br>2. View in Timeline | Task appears with formatted description | ⏳ |
| I.7 | Edit Task Description | 1. Edit existing task<br>2. Modify markdown<br>3. Save | Changes reflected in all views | ⏳ |
| I.8 | Delete Task | 1. Delete task<br>2. Check Timeline and Calendar | Task removed from all views | ⏳ |
| I.9 | Update Task Status | 1. Change status to "Done"<br>2. Check Timeline | Color updates in Timeline | ⏳ |
| I.10 | Custom Property in Filter | 1. Add custom property<br>2. Set value<br>3. Filter by that value | Filtering works (note: may need backend support) | ⏳ |

#### Phase III Integration

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| I.11 | Time Tracking + Timeline | 1. Start timer on task<br>2. View in Timeline | Task shows timer indicator | ⏳ |
| I.12 | Dependencies + Calendar | 1. Create dependency<br>2. View in Calendar | Both tasks visible on calendar | ⏳ |
| I.13 | Activity Feed + Rich Text | 1. Update task description<br>2. Check Activity Feed | Activity logged | ⏳ |
| I.14 | Export with Custom Properties | 1. Add custom properties<br>2. Export to CSV | Properties included in export | ⏳ |
| I.15 | Template with Markdown | 1. Create template with markdown<br>2. Use template | Markdown preserved | ⏳ |

---

### Performance Testing

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| P.1 | Timeline with 100+ Tasks | 1. Project with 100+ tasks<br>2. Open Timeline | Loads in <2 seconds | ⏳ |
| P.2 | Calendar with Dense Month | 1. Month with many tasks<br>2. Load Calendar | No lag when switching months | ⏳ |
| P.3 | Rich Text Editor Large Doc | 1. Create 500+ line markdown<br>2. Switch views | Editor remains responsive | ⏳ |
| P.4 | Custom Properties with Many Fields | 1. Create 20+ custom fields<br>2. Open panel | Panel loads quickly | ⏳ |
| P.5 | Memory Leaks | 1. Switch views 50 times<br>2. Check browser memory | No significant memory increase | ⏳ |

---

### Error Handling

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| E.1 | Empty Project Timeline | 1. Open Timeline in empty project | Shows "No tasks" message | ⏳ |
| E.2 | Empty Project Calendar | 1. Open Calendar in empty project | Shows empty calendar grid | ⏳ |
| E.3 | Invalid Markdown | 1. Enter malformed markdown<br>2. Preview | Renders gracefully without errors | ⏳ |
| E.4 | Custom Property Type Mismatch | 1. Enter text in number field | Shows validation error | ⏳ |
| E.5 | LocalStorage Quota | 1. Create 1000+ custom properties<br>2. Check for errors | Handles quota gracefully | ⏳ |

---

### Browser Console Check

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| C.1 | No Console Errors on Load | 1. Open application<br>2. Check console | No errors (warnings OK) | ⏳ |
| C.2 | No Errors Switching Views | 1. Switch between all views<br>2. Check console | No errors | ⏳ |
| C.3 | No Errors in Editor | 1. Use all editor features<br>2. Check console | No errors | ⏳ |
| C.4 | ResizeObserver Suppressed | 1. Use markdown editor<br>2. Check console | ResizeObserver errors hidden | ⏳ |
| C.5 | Network Requests Valid | 1. Check Network tab<br>2. Verify API calls | All requests return 2xx or expected errors | ⏳ |

---

### Responsive Design

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| R.1 | Timeline Mobile | 1. Resize to 375px width<br>2. Use Timeline | Timeline adapts to mobile layout | ⏳ |
| R.2 | Calendar Mobile | 1. Resize to mobile<br>2. Use Calendar | Calendar remains usable | ⏳ |
| R.3 | Editor Mobile | 1. Edit task on mobile<br>2. Use editor | Editor toolbar and content adapt | ⏳ |
| R.4 | Custom Properties Mobile | 1. View properties on mobile | Panel scrolls and fields are accessible | ⏳ |
| R.5 | Tablet Layout (768px) | 1. Resize to 768px<br>2. Test all features | All features work on tablet | ⏳ |

---

## 🔍 Manual Testing Checklist

### Before Testing
- [ ] Clear browser cache
- [ ] Clear localStorage
- [ ] Open browser DevTools console
- [ ] Navigate to http://localhost:3004
- [ ] Verify backend running on http://127.0.0.1:3005

### During Testing
- [ ] Take screenshots of each feature
- [ ] Note any unexpected behavior
- [ ] Check console for errors after each action
- [ ] Verify localStorage updates (DevTools → Application → Local Storage)
- [ ] Test with existing tasks AND newly created tasks

### After Testing
- [ ] Review all test results
- [ ] Document any bugs found
- [ ] Create bug report with reproduction steps
- [ ] Update test status in this document

---

## 📊 Test Results Summary

**Total Test Cases**: 100+
**Passed**: ___
**Failed**: ___
**Blocked**: ___
**Not Tested**: ___

**Coverage**:
- Timeline View: ___/10
- Calendar View: ___/10
- Rich Text Editor: ___/20
- Custom Properties: ___/22
- Integration: ___/15
- Performance: ___/5
- Error Handling: ___/5
- Console: ___/5
- Responsive: ___/5

---

## 🐛 Known Issues

| # | Issue | Severity | Reproduction Steps | Status |
|---|-------|----------|-------------------|--------|
| | | | | |

---

## ✅ Sign-off

**Tested By**: _____________
**Date**: _____________
**Environment**: Development (localhost)
**Browser**: _____________
**OS**: _____________

**Notes**:


---

## 📝 Testing Notes Template

For each major feature, use this template:

### Feature: [Name]
**Test Date**: [Date]
**Tester**: [Name]
**Browser**: [Chrome/Firefox/Safari]

**Observations**:
-

**Issues Found**:
-

**Screenshots**: [Attach or link]

**Overall Assessment**: ⭐⭐⭐⭐⭐ (1-5 stars)

---

_Generated: September 30, 2025_
