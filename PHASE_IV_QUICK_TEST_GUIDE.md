# Phase IV - Quick Test Guide

**🎯 Goal**: Quickly verify all Phase IV features are working

---

## ⚡ 5-Minute Quick Test

### 1. Timeline View (30 seconds)
1. Navigate to any project with tasks
2. Click **View Switcher** → Select **Timeline**
3. ✅ Check: Calendar shows current month with tasks grouped by date
4. Click **Next Month** → ✅ Check: Calendar advances
5. Click **Today** → ✅ Check: Returns to current month
6. Click any task → ✅ Check: Task details opens

### 2. Calendar View (30 seconds)
1. Click **View Switcher** → Select **Calendar**
2. ✅ Check: Full month grid displays (Sun-Sat)
3. ✅ Check: Tasks appear on correct dates
4. ✅ Check: Days with 4+ tasks show "+X more"
5. Click **+** on any day → ✅ Check: Task creation form opens
6. Click any task badge → ✅ Check: Task details opens

### 3. Rich Text Editor (1 minute)
1. Click **Create Task** button
2. In description field, type:
   ```markdown
   # Test Header
   **Bold text**
   - List item 1
   - List item 2
   ```markdown
   ```
3. Click **Split** tab → ✅ Check: See live preview
4. Click **Preview** tab → ✅ Check: See formatted output
5. Save task → Open task details
6. ✅ Check: Description shows formatted markdown

### 4. Custom Properties (2 minutes)
1. Open any task details (fullscreen mode recommended)
2. Scroll to **Custom Properties** section
3. Click **Add Properties** button
4. Create fields:
   - Field 1: Name="Priority", Type=Select, Options=Low,Medium,High
   - Field 2: Name="Story Points", Type=Number
   - Field 3: Name="Approved", Type=Checkbox
5. Click **Save Changes**
6. ✅ Check: Panel shows 3 fields
7. Enter values in each field
8. Close task → Reopen task
9. ✅ Check: Values persisted

### 5. View Persistence (30 seconds)
1. Switch to **Timeline** view
2. Refresh browser (Cmd+R / Ctrl+R)
3. ✅ Check: Timeline view still active

---

## 🎨 Visual Checks

### Timeline View
- [ ] Month header shows current month/year
- [ ] Calendar grid shows all days in month
- [ ] Tasks appear under correct dates
- [ ] Task status colors correct:
  - Blue = Todo
  - Yellow = In Progress
  - Green = Done
  - Gray = Cancelled
- [ ] Navigation buttons work
- [ ] Task count badges visible

### Calendar View
- [ ] 7-column grid (Sunday → Saturday)
- [ ] All days of month visible
- [ ] Previous/next month days shown in lower opacity
- [ ] Task badges show on correct dates
- [ ] Status colors applied to badges
- [ ] "+" button on each day
- [ ] "+X more" indicator for overflow

### Rich Text Editor
- [ ] Toolbar visible with formatting buttons
- [ ] Three tabs: Edit, Split, Preview
- [ ] Split view shows side-by-side editor/preview
- [ ] Preview renders markdown correctly
- [ ] Code blocks have syntax highlighting
- [ ] Editor height appropriate (not too tall/short)

### Custom Properties
- [ ] Panel expands/collapses smoothly
- [ ] "Manage" button opens dialog
- [ ] Field list shows all defined fields
- [ ] Input types render correctly:
  - Text: regular input box
  - Number: number input
  - Date: date picker
  - Checkbox: checkbox
  - Select: dropdown
  - Multi-select: checkboxes for each option
- [ ] Values persist after refresh

---

## 🐛 Common Issues to Check

### Console Errors
- [ ] Open DevTools (F12)
- [ ] Check Console tab
- [ ] Verify: No red errors (warnings OK)
- [ ] Verify: ResizeObserver errors are suppressed

### Network Requests
- [ ] Check Network tab
- [ ] Verify: All requests return 2xx status
- [ ] Verify: No 404s or 500s

### Performance
- [ ] Timeline loads within 2 seconds
- [ ] Calendar loads within 2 seconds
- [ ] Editor typing has no lag
- [ ] View switching is smooth

### LocalStorage
- [ ] Open DevTools → Application → Local Storage
- [ ] Check keys:
  - `custom-fields-{projectId}` - Field definitions
  - `custom-values-{projectId}-{taskId}` - Field values
  - `viewType` - Current view selection

---

## 📱 Mobile Quick Test (Optional)

1. Resize browser to 375px width (iPhone size)
2. Test each view:
   - [ ] Timeline: Scrolls horizontally if needed
   - [ ] Calendar: Grid adapts to mobile
   - [ ] Editor: Toolbar wraps or scrolls
   - [ ] Custom Properties: Fields stack vertically

---

## 🎯 Integration Quick Test

### With Existing Features

1. **Filters + New Views**
   - Apply a filter (e.g., "In Progress" only)
   - Switch to Timeline → ✅ Check: Only filtered tasks show
   - Switch to Calendar → ✅ Check: Only filtered tasks show

2. **Search + New Views**
   - Search for a term (e.g., "test")
   - Switch views → ✅ Check: Search results consistent

3. **Create Task with Markdown + View in Timeline**
   - Create task with rich description
   - View in Timeline → ✅ Check: Task appears on creation date

4. **Custom Properties + Task Export** (if export works)
   - Add custom properties to task
   - Export to CSV → ✅ Check: Properties included

---

## ✅ Quick Pass/Fail Checklist

| Feature | Pass | Fail | Notes |
|---------|------|------|-------|
| Timeline View loads | ☐ | ☐ | |
| Calendar View loads | ☐ | ☐ | |
| Rich Text Editor works | ☐ | ☐ | |
| Custom Properties save | ☐ | ☐ | |
| View switching works | ☐ | ☐ | |
| No console errors | ☐ | ☐ | |
| Mobile responsive | ☐ | ☐ | |
| Data persists | ☐ | ☐ | |

---

## 🚨 If Something Breaks

### Timeline/Calendar Not Showing Tasks
- Check: Are there tasks with `created_at` dates?
- Check: Is the project selected?
- Check: Console for errors

### Rich Text Editor Not Loading
- Check: Console for "@uiw/react-md-editor" errors
- Check: Browser cache (try hard refresh: Cmd+Shift+R)
- Check: Network tab for failed imports

### Custom Properties Not Saving
- Check: DevTools → Application → Local Storage
- Check: Browser allows localStorage
- Check: No quota exceeded errors

### View Switcher Not Working
- Check: Console for errors
- Check: localStorage for "viewType" key
- Try: Clear localStorage and refresh

---

## 📞 Need Help?

1. Check `PHASE_IV_COMPLETION_SUMMARY.md` for feature details
2. Check `PHASE_IV_TEST_PLAN.md` for comprehensive test cases
3. Check `PHASE_IV_VERIFICATION_REPORT.md` for known issues
4. Check browser console for error messages

---

**Total Time**: ~5-10 minutes for quick test, 30-60 minutes for comprehensive test

**Recommendation**: Start with the 5-minute quick test to ensure basics work, then proceed to comprehensive testing if needed.
