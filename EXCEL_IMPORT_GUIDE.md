# Excel Import Feature - User Guide

## Overview
Users dapat bulk import test scenarios dari file Excel dengan format yang jelas dan mudah diikuti.

## How It Works

### Step 1: Download Template
1. Click **"📄 View Template"** button di halaman Test Scenarios
2. File `scenario-template.xlsx` akan terdownload secara otomatis
3. Template berisi contoh format yang benar

### Step 2: Prepare Excel File
Buka file Excel template dan lihat 2 sheet:

#### Sheet 1: "Scenarios"
| Column | Required | Format | Example |
|--------|----------|--------|---------|
| Scenario Name | ✅ Yes | Text | "Login Test" |
| Description | ❌ No | Text | "Test login functionality" |
| Base URL | ✅ Yes | URL (http/https) | "https://example.com/login" |

#### Sheet 2: "TestSteps"
| Column | Required | Format | Example |
|--------|----------|--------|---------|
| Scenario Name | ✅ Yes | Must match Sheet 1 | "Login Test" |
| Step # | ✅ Yes | Integer (1,2,3...) | 1 |
| Type | ✅ Yes | From enum below | "NAVIGATE" |
| Description | ✅ Yes | Text description | "Open login page" |
| Selector | ❌ No | CSS/XPath | "#email-input" |
| Value | ❌ No | Text/URL | "test@example.com" |

#### Valid Step Types
- `NAVIGATE` - Navigate to URL
- `CLICK` - Click element
- `FILL` - Fill text input
- `SCREENSHOT` - Take screenshot
- `WAIT` - Wait seconds
- `ASSERTION` - Verify condition
- `API_CALL` - Call API endpoint
- `HOVER` - Hover over element
- `SCROLL` - Scroll page
- `FILE_UPLOAD` - Upload file
- `DRAG` - Drag element
- `MOCK_ROUTE` - Mock API route

### Step 3: Upload File
1. Click **"📥 Import Excel"** button
2. Select your prepared Excel file
3. Preview modal akan muncul dengan data yang akan diimport

### Step 4: Review & Edit
Preview modal allows:
- ✅ See all scenarios with step count
- ✅ See all test steps dalam tabel
- ✅ Edit any field inline (Scenario Name, Description, Base URL, Step details)
- ✅ Expand/collapse scenarios
- ✅ Delete scenarios by collapsing dan confirming

### Step 5: Create
- Click **"Create Scenarios"** button
- Atau **"Cancel"** untuk batal

## Features

### Dark/Light Theme Support
- ✅ Tooltips tersedia di semua UI elements
- ✅ Tooltip showing helpful guidance text
- ✅ Works in both dark and light modes

### Tooltips Provided
| Element | Tooltip |
|---------|---------|
| Header Icon | "Review parsed data before creating scenarios. Edit any fields as needed." |
| Ready to Import | "All data validated and ready. Click 'Create Scenarios' to proceed." |
| Scenario Name | "Unique name for this test scenario" |
| Description | "Optional summary of what this scenario tests" |
| Base URL | "Starting URL where the test will begin (must start with http:// or https://)" |
| Test Steps | "Sequence of actions to execute in this scenario..." |
| Import Excel Button | "Upload Excel file with scenarios and test steps. Use 2 sheets: 'Scenarios' and 'TestSteps'" |
| View Template Button | "Download Excel template to see exact format for scenarios and test steps" |
| Cancel Button | "Close preview without creating scenarios" |
| Create Button | "Create all scenarios and test steps. This action cannot be undone." |

## File Size Limit
- Maximum file size: **5MB**
- Supported formats: `.xlsx`, `.xls`

## Example Excel Data

### Scenarios Sheet
```
Scenario Name          | Description             | Base URL
Login Test             | Test login flow         | https://example.com
E-Commerce Search      | Test search feature     | https://shop.example.com
```

### TestSteps Sheet
```
Scenario Name      | Step # | Type      | Description      | Selector       | Value
Login Test         | 1      | NAVIGATE  | Open login page  |                | https://example.com/login
Login Test         | 2      | FILL      | Enter email      | #email         | admin@example.com
Login Test         | 3      | FILL      | Enter password   | #password      | password123
Login Test         | 4      | CLICK     | Click login btn  | button.login   |
E-Commerce Search  | 1      | NAVIGATE  | Go to shop       |                | https://shop.example.com
E-Commerce Search  | 2      | CLICK     | Open search      | #search-icon   |
E-Commerce Search  | 3      | FILL      | Type search term | #search-input  | laptop
E-Commerce Search  | 4      | CLICK     | Search button    | button.search  |
```

## Troubleshooting

### Error: "Failed to preview Excel file"
- Check file format is `.xlsx` or `.xls`
- Verify file is not corrupted
- Check file size < 5MB
- Ensure 2 sheets exist: "Scenarios" and "TestSteps"

### Error: "Invalid sheet structure"
- Verify column headers match expected format
- Check Step Type values are from valid enum
- Ensure Scenario Name in TestSteps matches Scenarios sheet

### Error: "Missing required field"
- All marked as ✅ must be filled
- Check for empty cells
- Verify Base URL starts with http:// or https://

## Tips & Best Practices
1. **Always download template first** - Ensures you use correct format
2. **Use consistent scenario names** - Must exactly match between sheets
3. **Fill in descriptions** - Helps with scenario documentation
4. **Test step selectors** - Test in browser DevTools first
5. **Start with small batch** - Test with 2-3 scenarios first
6. **Review preview carefully** - Edit any wrong data before creating

## Support
All UI elements have helpful tooltips - hover over any ℹ️ icon or button for guidance!
