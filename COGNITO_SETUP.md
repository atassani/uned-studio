# AWS Cognito Configuration Checklist for Production

## 🔧 Required AWS Cognito Updates

### 1. **Update Callback URLs in Cognito User Pool**

**Location:** AWS Console > Cognito > User Pool > App Integration > Your App Client

**Add these URLs to "Allowed callback URLs":**

```
https://humblyproud.com/uned/studio
http://localhost:3000/uned/studio  (for local dev)
```

### 2. **Update Sign-out URLs in Cognito**

**Add these URLs to "Allowed sign-out URLs":**

```
https://humblyproud.com/uned/studio
http://localhost:3000/uned/studio  (for local dev)
```

### 3. **Google OAuth Configuration**

**Location:** Google Cloud Console > Credentials > OAuth 2.0 Client

**Add these to "Authorized redirect URIs":**

```
https://humblyproud-uned-studio.auth.eu-west-2.amazoncognito.com/oauth2/idpresponse
```

## 🚀 Deployment Steps

1. **Update Cognito URLs** (see above)
2. **Deploy with updated environment variables:**
   ```bash
   ./scripts/deploy.sh
   ```

## 🧪 Testing

**Production Test:**

- Visit: https://humblyproud.com/uned/studio
- Should show Google Sign-in button
- After Google auth, should redirect back to the app

**Local Test:**

- Run: `npm run dev`
- Visit: http://localhost:3000/uned/studio
- Should work with localhost URLs

## ⚠️ Common Issues

**If you see "redirect_uri_mismatch" error:**

- Check Cognito callback URLs match exactly
- Check Google OAuth redirect URIs match exactly
- Ensure URLs use correct protocol (https vs http)

**If authentication doesn't work:**

- Verify environment variables are loaded
- Check browser console for errors
- Verify Cognito domain is accessible
