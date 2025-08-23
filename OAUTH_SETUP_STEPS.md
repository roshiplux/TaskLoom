# TaskLoom Google OAuth Verification Setup

## Immediate Actions Required

### 1. Update Firebase Configuration
Go to your Firebase project settings and ensure:
- Authorized domains include: `taskloomapp.web.app`
- OAuth redirect URLs are properly configured

### 2. Google Cloud Console OAuth Setup

#### Navigate to OAuth Consent Screen:
1. Go to: https://console.cloud.google.com/
2. Select your project (should be same as Firebase project)
3. Go to "APIs & Services" > "OAuth consent screen"

#### Configure Application Information:
```
App name: TaskLoom
User support email: [your-email]
Developer contact information: [your-email]

App logo: [Optional - upload TaskLoom logo]
Application home page: https://taskloomapp.web.app
Application privacy policy URL: https://taskloomapp.web.app/privacy.html
Application terms of service URL: https://taskloomapp.web.app/terms.html
```

#### Authorized Domains:
Add these domains:
```
taskloomapp.web.app
firebase.com
```

#### Scopes Configuration:
Add only these scopes (they're free and don't require extensive review):
```
.../auth/userinfo.email
.../auth/userinfo.profile
openid
.../auth/calendar.readonly (if you need calendar read access)
.../auth/calendar.events (if you need to create/modify events)
```

### 3. Verification Application

#### Required Information for Submission:
1. **App Description**: 
   "TaskLoom is a personal task management application that helps users organize daily tasks and optionally sync with Google Calendar for better scheduling."

2. **Justification for Scopes**:
   - `userinfo.email`: Required for user authentication and account identification
   - `userinfo.profile`: To display user name and profile picture
   - `calendar.readonly`: To display Google Calendar events alongside tasks
   - `calendar.events`: To create calendar events from tasks (if needed)

3. **Security and Privacy**:
   - Data is stored locally and optionally synced via Firebase
   - No data is shared with third parties
   - Users can delete their data at any time
   - Follows Google API Services User Data Policy

### 4. Pre-Submission Checklist

Before submitting for verification, ensure:
- [ ] Privacy policy is accessible at https://taskloomapp.web.app/privacy.html
- [ ] Terms of service is accessible at https://taskloomapp.web.app/terms.html
- [ ] App is fully functional for reviewers
- [ ] All requested scopes are actually used in the application
- [ ] OAuth consent screen is completely filled out
- [ ] Test the app with a non-admin Google account

### 5. During Review Process

**What Google Reviewers Check:**
- App functionality matches description
- Privacy policy is comprehensive and accurate
- Only necessary scopes are requested
- App doesn't violate Google policies
- Security best practices are followed

**Response Time:**
- Initial review: 2-6 weeks
- If additional information requested: 1-2 weeks per response
- Total process: Usually 4-12 weeks

### 6. Common Issues to Avoid

1. **Don't request unnecessary scopes** - Only request what you actually use
2. **Test thoroughly** - Broken functionality = automatic rejection
3. **Be specific** - Vague descriptions lead to rejection
4. **Privacy policy must be detailed** - Generic templates often get rejected
5. **Domain verification** - Make sure all URLs are accessible

### 7. Alternative Solutions (Temporary)

While waiting for verification:

#### Option A: Stay in Testing Mode
- Add up to 100 test users manually
- Users won't see warning if they're added as test users
- Go to "Test users" section and add email addresses

#### Option B: Use Firebase Auth UI
- Consider if Firebase Auth UI provides better user experience
- May have less stringent requirements

#### Option C: Add Warning Explanation
- Add text explaining the warning is normal for new apps
- Provide instructions to proceed safely

### 8. After Approval

Once verified:
- Remove the 100 user testing limit
- Users won't see the unverified app warning
- App will show "Verified by Google" badge
- Can market to unlimited public users

## Cost: $0
Google OAuth verification is completely FREE for standard scopes like calendar and user profile. You only pay if requesting sensitive scopes like Gmail modification.
