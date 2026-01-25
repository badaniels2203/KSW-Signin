# Student Subscription and Attendance Tracking Guide

This guide explains the new features for tracking student subscriptions and identifying over-attendance.

## New Features

### 1. Registration Number
Each student can now have a unique registration number assigned by your martial arts association.

- **Optional field** - not required for student enrollment
- **Must be unique** across all students
- Can be used to search for students on the sign-in page
- Displayed in reports for easy identification

### 2. Monthly Lesson Allocation
Track how many lessons each student is enrolled for per month.

- **Default: 8 lessons/month**
- Can be customized per student (1-30 lessons)
- Used to calculate over-attendance
- Displayed on student cards and reports

### 3. Over-Attendance Report
Automatically identifies students who have attended more classes than their monthly allocation.

- **Red warning section** at the top of reports
- Shows exactly how many classes over the limit
- Useful for billing and subscription management
- Updates in real-time as attendance is logged

### 4. Improved Reports
Reports are now organized by class category with alphabetical sorting.

## Using the New Features

### Adding a Student

1. Go to **Admin Portal** → **Students** tab
2. Click **+ Add Student**
3. Fill in the form:
   - **Name** (required)
   - **Registration Number** (optional) - e.g., "REG001" or "MA12345"
   - **Class Category** (required)
   - **Monthly Lessons** (required, default: 8)
4. Click **Save**

**Example:**
```
Name: John Smith
Registration Number: REG001
Class Category: Adults
Monthly Lessons: 12
```

### Editing a Student

1. Click **Edit** on any student card
2. Update the fields
3. Click **Save**

**Note:** Registration numbers must be unique. If you try to use a number that's already taken, you'll get an error message.

### Viewing Reports

1. Go to **Admin Portal** → **Reports** tab
2. Select **Month** and **Year**
3. Optionally filter by **Category**

The report will show:

#### Statistics Summary
- Total students per category
- Total classes attended
- Average classes per student

#### Over-Attendance Warning (if applicable)
- Students who exceeded their monthly limit
- Highlighted in yellow/orange
- Shows how many classes over the limit

#### Attendance by Class
- Students grouped by category (Little Lions, Juniors, Youths, Adults)
- Sorted alphabetically within each category
- Shows registration number, classes attended, and monthly limit

#### Recent Attendance Records
- Last 50 attendance check-ins
- Ability to delete incorrect entries

## Understanding Over-Attendance

### What is Over-Attendance?

A student is considered "over-attendance" when they have attended MORE classes than their monthly lesson allocation.

**Example:**
- Student enrolled for: 8 lessons/month
- Student attended: 10 classes in January
- Over by: 2 classes

### Why Track This?

1. **Billing** - Identify students who may need to upgrade their subscription
2. **Capacity Planning** - Understand actual class demand
3. **Fair Access** - Ensure all students get their allocated spots
4. **Revenue** - Potential for additional class packages or fees

### How It's Calculated

```
Monthly Lessons = Number of classes student paid for
Total Attended = Number of times student signed in this month
Over By = Total Attended - Monthly Lessons (if positive)
```

## Common Scenarios

### Scenario 1: Student Upgrades Subscription Mid-Month

**Problem:** Student originally enrolled for 8 lessons, attended 6, then upgraded to 12 lessons.

**Solution:**
1. Edit the student
2. Change **Monthly Lessons** from 8 to 12
3. Save

The report will immediately reflect the new limit.

### Scenario 2: Identifying Students for Billing

**Use Case:** At the end of the month, you want to bill students who attended extra classes.

**Steps:**
1. Go to **Reports** tab
2. Select the current/previous month
3. Check the **Over-Attendance** section
4. Note which students exceeded their limit
5. Contact them about additional fees or upgrading

### Scenario 3: Students Without Registration Numbers

**Question:** What if I don't have registration numbers for my students?

**Answer:** Registration numbers are optional. You can:
- Leave the field blank
- Use your own numbering system (e.g., "STU001", "STU002")
- Use existing student IDs from your association
- Add them later as you get the information

### Scenario 4: Different Subscription Levels

**Example Setup:**
- Bronze Plan: 4 lessons/month
- Silver Plan: 8 lessons/month
- Gold Plan: 12 lessons/month
- Unlimited: 30 lessons/month

**How to Configure:**
1. When adding/editing a student, set **Monthly Lessons** to:
   - 4 for Bronze
   - 8 for Silver
   - 12 for Gold
   - 30 for Unlimited (or higher if needed)

## Migration from Existing System

If you already have students in the system:

### Option 1: Update via Admin Portal

1. Go to **Students** tab
2. Click **Edit** on each student
3. Add registration number and monthly lessons
4. Save

### Option 2: Set Defaults

All existing students will default to:
- Registration Number: (blank)
- Monthly Lessons: 8

You can update them individually as needed.

## Report Interpretation

### Example Report Output

```
⚠️ Students Over Monthly Limit (3)

Name            Reg #   Category      Limit   Attended   Over By
John Smith      REG001  Adults        8       12         +4
Sarah Johnson   REG002  Youths        8       10         +2
Emma Williams   REG004  Little Lions  4       6          +2
```

**What this tells you:**
- 3 students exceeded their limits
- John Smith is the most over (4 extra classes)
- All categories have some over-attendance
- Total extra classes: 10

### Statistics Example

```
Adults
10 Students | 85 Total Classes | 8.5 Avg per Student
```

**Interpretation:**
- 10 active adults students
- They attended 85 classes total this month
- On average, each student came 8.5 times
- If they're all on 8-lesson plans, there's slight over-attendance

## Best Practices

### 1. Regular Review
- Check over-attendance report monthly
- Address with students promptly
- Consider offering upgrade options

### 2. Clear Communication
- Inform students of their lesson limits
- Post policies about extra classes
- Offer flexible upgrade paths

### 3. Accurate Tracking
- Ensure students sign in every time
- Delete accidental double sign-ins
- Update subscriptions when students change plans

### 4. Use Registration Numbers
- Even if not required by your association
- Helps with organization and reports
- Makes student identification easier

## Troubleshooting

### "Registration number already exists" error

**Cause:** Trying to use a registration number that's already assigned to another student.

**Solution:**
- Use a different registration number
- Check if the existing student has a typo
- Update the other student's registration number if needed

### Over-attendance not showing

**Possible causes:**
1. No students have exceeded their limits (working as expected)
2. Wrong month/year selected in filters
3. Students' monthly_lessons are set too high

**Check:**
- Select the correct month and year
- Verify students' monthly lesson settings
- Ensure attendance is being logged correctly

### Students showing with 0 classes

**Cause:** Student hasn't signed in during the selected month.

**This is normal** - the report shows all active students, even if they haven't attended.

## FAQ

**Q: Can students have different monthly limits?**
A: Yes! Each student can have a custom number of monthly lessons (1-30).

**Q: What if a student attends exactly their limit?**
A: They won't appear in the over-attendance report - only students who exceed show up.

**Q: Can I search by registration number?**
A: Yes! The student sign-in page searches both names and registration numbers.

**Q: Do I need to update the database?**
A: If you're updating from an older version, the system will automatically add the new fields when you restart.

**Q: What happens to existing students?**
A: They'll automatically get:
- Registration Number: blank (can be added later)
- Monthly Lessons: 8 (can be changed per student)

## Support

For additional help with subscription tracking:
1. Check student details in the Students tab
2. Review the Reports tab monthly
3. Contact students directly about over-attendance
4. Adjust monthly lesson limits as needed

The system is designed to make subscription management easy and transparent for both you and your students!
