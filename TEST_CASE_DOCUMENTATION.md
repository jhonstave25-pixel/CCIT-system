# CCIT Connect - Alumni Management System
## Test Case Documentation

---

### Test Case 1.0 - User Registration
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 1.0 |
| **Title** | User Registration |
| **Description** | This test verifies that a new user can successfully register with valid credentials and receives a verification email. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to homepage and click "Sign Up" or "Get Started" button | | Registration form appears | | | |
| 2 | Enter valid email address, full name, and password | | Form accepts input without errors | | | |
| 3 | Click "Create Account" or "Register" button | | Success message displayed and verification email sent | | | |
| 4 | Check registered email inbox | | Verification email received with verification link | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 2.0 - Email Verification
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 2.0 |
| **Title** | Email Verification |
| **Description** | This test verifies that users can verify their email address using the verification link or OTP code. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Open verification email from the system | | Email contains verification link or OTP code | | | |
| 2 | Click verification link or enter OTP code | | User is redirected to success page or account is verified | | | |
| 3 | Log in with verified credentials | | Login successful, userStatus shows VERIFIED | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 3.0 - User Login
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 3.0 |
| **Title** | User Login |
| **Description** | This test verifies that registered users can log in with valid credentials and are redirected to the dashboard. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to login page | | Login form with email and password fields displayed | | | |
| 2 | Enter valid registered email and password | | Credentials accepted | | | |
| 3 | Click "Sign In" or "Login" button | | User redirected to dashboard based on role (Alumni/Admin/Faculty) | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 4.0 - Forgot Password
**Test Design by:** _______________  
**Test Priority:** Medium  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 4.0 |
| **Title** | Forgot Password |
| **Description** | This test verifies that users can request a password reset and successfully reset their password. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Click "Forgot Password?" link on login page | | Password reset form appears requesting email | | | |
| 2 | Enter registered email address | | Success message: "Reset link sent to email" | | | |
| 3 | Check email for reset link | | Password reset email received with link | | | |
| 4 | Click reset link and enter new password | | Password updated successfully message | | | |
| 5 | Log in with new password | | Login successful | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 5.0 - Complete User Profile
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 5.0 |
| **Title** | Complete User Profile |
| **Description** | This test verifies that users can complete their profile with academic and professional information. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to Profile page from dashboard | | Profile form displayed with all fields | | | |
| 2 | Fill in academic information (graduation year, degree, major, batch, student ID) | | All academic fields accept input | | | |
| 3 | Fill in professional information (company, position, industry, work experience) | | Professional fields accept input | | | |
| 4 | Add social links (LinkedIn, GitHub, Twitter, Website) | | URLs validated and accepted | | | |
| 5 | Add skills and interests | | Skills and interests added successfully | | | |
| 6 | Write bio and upload profile photo | | Photo uploaded and bio saved | | | |
| 7 | Click "Save Profile" button | | Profile saved successfully message displayed | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 6.0 - View Alumni Directory
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 6.0 |
| **Title** | View Alumni Directory |
| **Description** | This test verifies that users can view the alumni directory and filter/search for other alumni. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Click "Directory" or "Alumni" in navigation | | Alumni directory page loads with list of alumni | | | |
| 2 | Use search bar to search by name | | Search results display matching alumni | | | |
| 3 | Apply filters (graduation year, batch, industry, company) | | Directory updates to show filtered results | | | |
| 4 | Click on an alumni profile | | Detailed profile page of selected alumni displayed | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 7.0 - Send Connection Request
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 7.0 |
| **Title** | Send Connection Request |
| **Description** | This test verifies that users can send connection requests to other alumni and receive notifications. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to Alumni Directory | | Directory page loads | | | |
| 2 | Click "Connect" button on an alumni profile | | Connection request sent confirmation | | | |
| 3 | Check notification for the receiving user | | Connection request notification received | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 8.0 - Accept/Reject Connection Request
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 8.0 |
| **Title** | Accept/Reject Connection Request |
| **Description** | This test verifies that users can accept or reject incoming connection requests. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to "Connections" or "My Network" page | | List of pending connection requests displayed | | | |
| 2 | Click "Accept" on a pending request | | Connection established, user added to connections list | | | |
| 3 | Click "Reject" on another pending request | | Request removed, status becomes REJECTED | | | |
| 4 | View "My Connections" tab | | Accepted connections displayed | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 9.0 - Send Message to Connection
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 9.0 |
| **Title** | Send Message to Connection |
| **Description** | This test verifies that users can send messages to their connections through the messaging system. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to "Messages" page | | Messages list displayed | | | |
| 2 | Click "New Message" or select a connection | | Chat interface opens | | | |
| 3 | Type message and click "Send" | | Message sent and appears in chat | | | |
| 4 | Verify receiving user gets notification | | New message notification received | | | |
| 5 | Check if message is marked as read | | Read status updated when viewed | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 10.0 - Browse and Register for Events
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 10.0 |
| **Title** | Browse and Register for Events |
| **Description** | This test verifies that users can browse upcoming events and register for them. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Click "Events" in navigation menu | | Events page loads with list of upcoming events | | | |
| 2 | Use filters (category, date, location) | | Filtered events displayed | | | |
| 3 | Click on an event to view details | | Event details page with description, date, venue displayed | | | |
| 4 | Click "Register" or "RSVP" button | | Registration confirmation message | | | |
| 5 | Check email for confirmation | | Event registration confirmation email received | | | |
| 6 | View "My Events" section | | Registered event appears in user's event list | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 11.0 - View News and Announcements
**Test Design by:** _______________  
**Test Priority:** Medium  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 11.0 |
| **Title** | View News and Announcements |
| **Description** | This test verifies that users can view news posts and announcements from the admin. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Click "News" or "Announcements" in navigation | | News feed page loads with latest posts | | | |
| 2 | Use category filter | | Posts filtered by selected category | | | |
| 3 | Click on a news post | | Full article with content, author, date displayed | | | |
| 4 | Scroll and read article content | | Article content readable with images if available | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 12.0 - Browse Job Board
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 12.0 |
| **Title** | Browse Job Board |
| **Description** | This test verifies that users can browse job listings and view job details. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Click "Jobs" in navigation menu | | Job board page loads with job listings | | | |
| 2 | Apply filters (job type, location, company) | | Filtered job listings displayed | | | |
| 3 | Use search to find specific jobs | | Search results displayed | | | |
| 4 | Click on a job listing | | Job details page with requirements, description, salary displayed | | | |
| 5 | Click "Save Job" or bookmark | | Job saved to user's saved jobs list | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 13.0 - Apply for Job
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 13.0 |
| **Title** | Apply for Job |
| **Description** | This test verifies that alumni can apply for job postings and track application status. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to Job Board and select a job | | Job details page displayed | | | |
| 2 | Click "Apply Now" button | | Application form appears | | | |
| 3 | Fill required fields (cover letter, resume upload) | | Form fields accept input, resume uploads successfully | | | |
| 4 | Click "Submit Application" | | Application submitted confirmation message | | | |
| 5 | Check email for confirmation | | Application confirmation email received | | | |
| 6 | View "My Applications" section | | Application appears with status "NEW" or "SUBMITTED" | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 14.0 - View Photo Gallery
**Test Design by:** _______________  
**Test Priority:** Low  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 14.0 |
| **Title** | View Photo Gallery |
| **Description** | This test verifies that users can view photo galleries from events and activities. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Click "Gallery" in navigation menu | | Gallery page loads with photo albums | | | |
| 2 | Click on an album or event gallery | | Album opens with all photos displayed | | | |
| 3 | Click on a photo | | Photo opens in lightbox/fullscreen view | | | |
| 4 | Navigate through photos using arrows | | Previous/next photos displayed | | | |
| 5 | Click "Download" if available | | Photo downloads successfully | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 15.0 - Submit Feedback
**Test Design by:** _______________  
**Test Priority:** Medium  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 15.0 |
| **Title** | Submit Feedback |
| **Description** | This test verifies that users can submit feedback or report issues to admin. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to "Feedback" page | | Feedback form displayed | | | |
| 2 | Select feedback type (suggestion, bug report, general) | | Category selected | | | |
| 3 | Enter feedback message | | Message field accepts text | | | |
| 4 | Attach screenshot if applicable | | File uploaded successfully | | | |
| 5 | Click "Submit Feedback" | | Feedback submitted confirmation | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 16.0 - Admin Dashboard Analytics
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 16.0 |
| **Title** | Admin Dashboard Analytics |
| **Description** | This test verifies that admin can view system analytics and statistics from the dashboard. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Log in as admin user | | Admin dashboard loads | | | |
| 2 | View dashboard statistics cards | | Total users, events, jobs, connections displayed | | | |
| 3 | View charts/graphs for analytics | | Charts render with data (registrations, activity trends) | | | |
| 4 | Filter analytics by date range | | Statistics update based on selected range | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 17.0 - Admin Manage Users
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 17.0 |
| **Title** | Admin Manage Users |
| **Description** | This test verifies that admin can view, edit, deactivate, and manage user accounts. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to Admin > Users | | Users list page loads with all registered users | | | |
| 2 | Use search to find specific user | | Search results displayed | | | |
| 3 | Click "Edit" on a user | | User edit form opens | | | |
| 4 | Change user role (ALUMNI to FACULTY) | | Role updated successfully | | | |
| 5 | Deactivate a user account | | User status changed to inactive | | | |
| 6 | Click "View" on a user profile | | User profile details displayed | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 18.0 - Admin Create Event
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 18.0 |
| **Title** | Admin Create Event |
| **Description** | This test verifies that admin can create and publish new events. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to Admin > Events | | Events management page loads | | | |
| 2 | Click "Create New Event" button | | Event creation form appears | | | |
| 3 | Fill event details (title, description, date, location, capacity) | | All fields accept input | | | |
| 4 | Upload event banner image | | Image uploaded and preview shown | | | |
| 5 | Select event category | | Category selected | | | |
| 6 | Click "Publish Event" | | Event created and published | | | |
| 7 | Verify event appears on public events page | | Event visible to users | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 19.0 - Admin Manage Job Posts
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 19.0 |
| **Title** | Admin Manage Job Posts |
| **Description** | This test verifies that admin can review, approve, or reject job postings. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to Admin > Jobs | | Jobs management page loads with job listings | | | |
| 2 | Filter jobs by status (DRAFT, REVIEW, PUBLISHED) | | Filtered results displayed | | | |
| 3 | Click "Review" on a pending job | | Job details and review interface displayed | | | |
| 4 | Click "Approve" to publish job | | Job status changed to PUBLISHED | | | |
| 5 | Click "Reject" on another job | | Job status changed to REJECTED/DISABLED | | | |
| 6 | View job applications | | List of applicants for each job displayed | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 20.0 - Admin Manage Gallery
**Test Design by:** _______________  
**Test Priority:** Medium  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 20.0 |
| **Title** | Admin Manage Gallery |
| **Description** | This test verifies that admin can upload, organize, and manage photo galleries. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to Admin > Gallery | | Gallery management page loads | | | |
| 2 | Click "Create Album" | | Album creation form appears | | | |
| 3 | Enter album title and description | | Form fields accept input | | | |
| 4 | Upload multiple photos | | Photos uploaded with progress indicator | | | |
| 5 | Click "Publish Album" | | Album published and visible to users | | | |
| 6 | Edit existing album | | Changes saved successfully | | | |
| 7 | Delete photo from album | | Photo removed from album | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 21.0 - Admin Manage News/Posts
**Test Design by:** _______________  
**Test Priority:** Medium  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 21.0 |
| **Title** | Admin Manage News/Posts |
| **Description** | This test verifies that admin can create, edit, and publish news posts and announcements. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to Admin > News | | News management page loads | | | |
| 2 | Click "Create Post" | | Post editor opens | | | |
| 3 | Enter post title, content, excerpt | | All fields accept input | | | |
| 4 | Upload cover image | | Image uploaded | | | |
| 5 | Select category and add tags | | Category and tags saved | | | |
| 6 | Save as draft | | Post saved with DRAFT status | | | |
| 7 | Publish post | | Post published and visible on news page | | | |
| 8 | Edit existing post | | Changes saved successfully | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 22.0 - Admin View and Respond to Feedback
**Test Design by:** _______________  
**Test Priority:** Medium  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 22.0 |
| **Title** | Admin View and Respond to Feedback |
| **Description** | This test verifies that admin can view user feedback and mark them as resolved. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to Admin > Feedback | | Feedback list page loads | | | |
| 2 | View unread feedback items | | New feedback highlighted or marked | | | |
| 3 | Click on a feedback item to view details | | Full feedback message and attachment displayed | | | |
| 4 | Add admin response/notes | | Response saved | | | |
| 5 | Mark feedback as resolved/read | | Status updated to resolved | | | |
| 6 | Filter feedback by status | | Filtered results displayed | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 23.0 - Faculty Verify Alumni Profiles
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 23.0 |
| **Title** | Faculty Verify Alumni Profiles |
| **Description** | This test verifies that faculty can review and verify alumni profile completion and authenticity. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Log in as faculty user | | Faculty dashboard loads | | | |
| 2 | Navigate to Faculty > Verifications | | List of pending verification requests displayed | | | |
| 3 | Click on a verification request | | Alumni profile details displayed | | | |
| 4 | Review profile completeness | | Profile completion percentage shown | | | |
| 5 | Click "Approve Verification" | | Alumni profile marked as verified | | | |
| 6 | Click "Reject Verification" with reason | | Status changed to REJECTED with reason noted | | | |
| 7 | View verified alumni list | | List of verified alumni displayed | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 24.0 - Faculty View Alumni Directory
**Test Design by:** _______________  
**Test Priority:** Medium  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 24.0 |
| **Title** | Faculty View Alumni Directory |
| **Description** | This test verifies that faculty can access and search the alumni directory with enhanced permissions. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Log in as faculty user | | Faculty dashboard loads | | | |
| 2 | Click "Alumni Directory" | | Directory page with all alumni displayed | | | |
| 3 | Use advanced filters (batch, year, company, verification status) | | Filtered results displayed | | | |
| 4 | Export directory data if available | | CSV or report generated | | | |
| 5 | Click on alumni to view full profile | | Complete profile details displayed | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 25.0 - Faculty Give Job Recommendations
**Test Design by:** _______________  
**Test Priority:** Medium  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 25.0 |
| **Title** | Faculty Give Job Recommendations |
| **Description** | This test verifies that faculty can recommend alumni for job postings. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to Faculty > Jobs or Job Board | | Job listings displayed | | | |
| 2 | Click on a job posting | | Job details with "Recommend Alumni" option | | | |
| 3 | Click "Recommend Alumni" | | Alumni selection modal opens | | | |
| 4 | Select an alumni to recommend | | Alumni selected with optional message | | | |
| 5 | Submit recommendation | | Recommendation sent to employer | | | |
| 6 | View recommendation status | | Status shows PENDING/ACCEPTED/REJECTED | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 26.0 - Email Notifications System
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 26.0 |
| **Title** | Email Notifications System |
| **Description** | This test verifies that the system sends appropriate email notifications for various actions. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Register new account | | Welcome/verification email received | | | |
| 2 | Receive connection request | | Connection request notification email received | | | |
| 3 | Register for event | | Event registration confirmation email received | | | |
| 4 | Apply for job | | Job application confirmation email received | | | |
| 5 | Receive message | | New message notification email received | | | |
| 6 | Verify all emails contain correct information | | Emails have proper content and links | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 27.0 - Settings and Account Management
**Test Design by:** _______________  
**Test Priority:** Medium  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 27.0 |
| **Title** | Settings and Account Management |
| **Description** | This test verifies that users can update account settings, change password, and manage preferences. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Navigate to Settings page | | Settings form displayed | | | |
| 2 | Change email notification preferences | | Preferences saved successfully | | | |
| 3 | Update profile visibility (public/private) | | Visibility setting updated | | | |
| 4 | Change password | | Password updated, confirmation shown | | | |
| 5 | Update contact information | | New contact info saved | | | |
| 6 | Log out and log back in with new password | | Login successful with new password | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 28.0 - Search Functionality
**Test Design by:** _______________  
**Test Priority:** Medium  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 28.0 |
| **Title** | Search Functionality |
| **Description** | This test verifies that the global search works correctly across all content types. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Click on search bar in navigation | | Search input field active | | | |
| 2 | Type keyword (e.g., "software engineer") | | Search suggestions appear | | | |
| 3 | Press Enter or click search | | Search results page loads | | | |
| 4 | View results by category (Users, Events, Jobs, Posts) | | Results filtered by category | | | |
| 5 | Click on a search result | | Redirected to respective detail page | | | |
| 6 | Test search with no results | | "No results found" message displayed | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 29.0 - Real-time Chat/Messaging
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 29.0 |
| **Title** | Real-time Chat/Messaging |
| **Description** | This test verifies that the real-time messaging system works with instant delivery. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | User A opens chat with User B | | Chat window opens with message history | | | |
| 2 | User A sends a message | | Message appears in chat instantly | | | |
| 3 | User B receives message in real-time | | Message appears without page refresh | | | |
| 4 | User B reads the message | | Read receipt updated for User A | | | |
| 5 | User B replies | | Reply delivered instantly to User A | | | |
| 6 | Check message persistence after refresh | | All messages remain after page reload | | | |

**Tested by:**

_____________________________
Signature over printed name

---

### Test Case 30.0 - Alumni Profile Verification Request
**Test Design by:** _______________  
**Test Priority:** High  
**Test Design Date:** _______________

| Field | Value |
|-------|-------|
| **Test Case ID** | 30.0 |
| **Title** | Alumni Profile Verification Request |
| **Description** | This test verifies that alumni can submit verification requests for faculty approval. |
| **Test Executed by** | |
| **Test Execution Date** | |

**Steps:**

| Step | Test Steps | Test Date | Expected Result | Actual Result | Status (Pass/Fail) | Remarks |
|------|------------|-----------|-----------------|---------------|-------------------|---------|
| 1 | Log in as alumni user | | Dashboard loads | | | |
| 2 | Navigate to Profile page | | Profile completion status shown | | | |
| 3 | Complete all required profile fields | | Profile completion reaches 100% | | | |
| 4 | Click "Request Verification" button | | Verification request submitted | | | |
| 5 | Check request status | | Status shows PENDING | | | |
| 6 | Wait for faculty approval | | Status changes to APPROVED/VERIFIED | | | |
| 7 | Verified badge appears on profile | | Verification badge visible | | | |

**Tested by:**

_____________________________
Signature over printed name

---

## Summary of Test Cases

| Test Case ID | Module | Title | Priority |
|--------------|--------|-------|----------|
| 1.0 | Authentication | User Registration | High |
| 2.0 | Authentication | Email Verification | High |
| 3.0 | Authentication | User Login | High |
| 4.0 | Authentication | Forgot Password | Medium |
| 5.0 | User Profile | Complete User Profile | High |
| 6.0 | Directory | View Alumni Directory | High |
| 7.0 | Networking | Send Connection Request | High |
| 8.0 | Networking | Accept/Reject Connection Request | High |
| 9.0 | Messaging | Send Message to Connection | High |
| 10.0 | Events | Browse and Register for Events | High |
| 11.0 | Content | View News and Announcements | Medium |
| 12.0 | Jobs | Browse Job Board | High |
| 13.0 | Jobs | Apply for Job | High |
| 14.0 | Gallery | View Photo Gallery | Low |
| 15.0 | Feedback | Submit Feedback | Medium |
| 16.0 | Admin | Admin Dashboard Analytics | High |
| 17.0 | Admin | Admin Manage Users | High |
| 18.0 | Admin | Admin Create Event | High |
| 19.0 | Admin | Admin Manage Job Posts | High |
| 20.0 | Admin | Admin Manage Gallery | Medium |
| 21.0 | Admin | Admin Manage News/Posts | Medium |
| 22.0 | Admin | Admin View and Respond to Feedback | Medium |
| 23.0 | Faculty | Faculty Verify Alumni Profiles | High |
| 24.0 | Faculty | Faculty View Alumni Directory | Medium |
| 25.0 | Faculty | Faculty Give Job Recommendations | Medium |
| 26.0 | System | Email Notifications System | High |
| 27.0 | System | Settings and Account Management | Medium |
| 28.0 | System | Search Functionality | Medium |
| 29.0 | System | Real-time Chat/Messaging | High |
| 30.0 | Profile | Alumni Profile Verification Request | High |

---

**Document Version:** 1.0  
**Project Name:** CCIT Connect - Alumni Management System  
**Date Created:** _______________  
**Last Updated:** _______________
