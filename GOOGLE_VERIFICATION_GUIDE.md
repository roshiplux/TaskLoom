# Google App Verification Guide for TaskLoom

## Current Issue
Users see "Google hasn't verified this app" warning when signing in.

## Solution: Complete OAuth Consent Screen Verification (FREE)

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your TaskLoom project
3. Navigate to "APIs & Services" > "OAuth consent screen"

### Step 2: Configure OAuth Consent Screen
1. **Application Type**: External
2. **App Information**:
   - App name: TaskLoom
   - User support email: your-email@domain.com
   - Developer contact email: your-email@domain.com

3. **App Domain**:
   - Application home page: https://taskloomapp.web.app
   - Application privacy policy URL: https://taskloomapp.web.app/privacy
   - Application terms of service URL: https://taskloomapp.web.app/terms

4. **Authorized Domains**:
   - taskloomapp.web.app
   - firebase.com (if using Firebase Auth)

### Step 3: Add Required Scopes
Add these scopes (all are free and don't require verification):
- `../auth/userinfo.email`
- `../auth/userinfo.profile` 
- `openid`
- `../auth/calendar` (if using calendar features)

### Step 4: Add Test Users (Optional)
- Add email addresses of people who can test the app
- Test users won't see the warning

### Step 5: Submit for Verification (FREE)
1. Click "Submit for Verification"
2. Fill out the verification form:
   - Explain what your app does
   - How it uses Google data
   - Why you need the requested scopes

### Step 6: Required Documentation
Create these pages on your website:

#### Privacy Policy (taskloomapp.web.app/privacy)
- Explain what data you collect
- How you use Google user data
- Data retention policies
- User rights

#### Terms of Service (taskloomapp.web.app/terms)
- App usage terms
- User responsibilities
- Service limitations

### Step 7: App Verification Requirements
Google will review:
- Your app's functionality
- Privacy policy compliance
- Appropriate use of requested scopes
- Security practices

## Timeline
- **Initial submission**: 1-2 weeks
- **Additional info requests**: 1-2 weeks each
- **Total time**: 2-8 weeks typically

## Important Notes
1. **It's completely FREE** - Google doesn't charge for OAuth verification
2. **Only paid if using restricted scopes** (like Gmail modification)
3. **Calendar read/write is usually approved for free**
4. **Be thorough in your application** - incomplete submissions get rejected

## What Happens After Approval
- Users won't see the warning message
- App appears as "Verified by Google"
- Can have unlimited users (no 100 user limit)

## Common Rejection Reasons
1. Missing privacy policy
2. Unclear app description
3. Requesting unnecessary scopes
4. Broken app functionality
5. Security vulnerabilities

## Tips for Approval
1. **Be specific** about how you use each scope
2. **Test thoroughly** before submitting
3. **Have working privacy/terms pages**
4. **Use minimal required scopes**
5. **Provide clear app description**
