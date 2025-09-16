# 🚀 ChristianKit Setup Guide

## Authentication & Payment Integration

### 1. Firebase Setup (Google OAuth)

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Follow the setup wizard

2. **Enable Authentication:**
   - In Firebase Console, go to "Authentication"
   - Click "Get started"
   - Enable "Google" sign-in method
   - Add your domain to authorized domains

3. **Get Firebase Config:**
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click "Add app" → Web app
   - Copy the config object

4. **Create Environment Variables:**
   Create a `.env` file in your project root:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   ```

### 2. Payment Setup Options 🇪🇹

Since you're in Ethiopia, here are the recommended payment options:

#### **Option A: Payoneer (Recommended for International)**
- **Provider**: Payoneer Global Payment Platform
- **Coverage**: 200+ countries worldwide
- **Setup**: Business account with API integration
- **Fees**: 1-3% per transaction
- **Advantages**: Global reach, multiple currencies, mobile app support
- **Best for**: International users and global expansion

#### **Option B: Telebirr (Recommended for Local)**
- **Provider**: Ethio Telecom Mobile Money
- **Coverage**: Nationwide in Ethiopia
- **Setup**: Contact Ethio Telecom for business registration
- **Fees**: 1-2% per transaction
- **Best for**: Local Ethiopian users

#### **Option C: CBE Birr**
- **Provider**: Commercial Bank of Ethiopia
- **Coverage**: Nationwide banking network
- **Setup**: Open business account with CBE
- **Fees**: 0.5-1% per transaction
- **Best for**: Traditional banking users

#### **Option D: Manual Payment Processing**
- Accept payments via phone/SMS
- Manual verification and account activation
- Use WhatsApp Business for customer support
- **Best for**: Simple setup and testing

**For detailed payment setup guides, see:**
- `PAYONEER_INTEGRATION.md` - Complete Payoneer integration guide
- `ETHIOPIAN_PAYMENT_SETUP.md` - Local Ethiopian payment options

### 3. Backend Setup (Optional)

For full functionality, you'll need a backend server to handle:
- User data storage
- Subscription management
- Payment processing
- Progress tracking

**Recommended Backend Options:**
- **Firebase Functions** (easiest with Firebase)
- **Node.js + Express**
- **Python + FastAPI**
- **Next.js API routes**

### 4. Database Setup

**Option 1: Firebase Firestore (Recommended)**
- In Firebase Console, go to "Firestore Database"
- Create database in test mode
- Set up security rules

**Option 2: Supabase**
- Free PostgreSQL database
- Built-in authentication
- Real-time subscriptions

### 5. Deployment

**Option 1: Vercel (Recommended)**
```bash
npm install -g vercel
vercel
```

**Option 2: Netlify**
```bash
npm run build
# Upload dist folder to Netlify
```

**Option 3: Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### 6. Environment Variables for Production

Set these in your hosting platform:

**Vercel:**
- Go to Project Settings → Environment Variables
- Add all variables from `.env` file

**Netlify:**
- Go to Site Settings → Environment Variables
- Add all variables from `.env` file

**Firebase:**
```bash
firebase functions:config:set payment.provider="telebirr"
firebase deploy --only functions
```

## 🎯 Next Steps

1. **Test Authentication:**
   - Run `npm run dev`
   - Try signing in with Google
   - Verify user state management

2. **Set Up Ethiopian Payments:**
   - Choose your payment provider (Telebirr recommended)
   - Complete business registration
   - Implement payment integration
   - Test payment flow

3. **Add Features:**
   - User profile management
   - Progress tracking
   - Community features
   - Analytics

## 🔧 Troubleshooting

**Firebase Auth Issues:**
- Check authorized domains in Firebase Console
- Verify API keys in environment variables
- Check browser console for errors

**Ethiopian Payment Issues:**
- Contact your chosen payment provider directly
- Ensure business registration is complete
- Verify API credentials and integration

**Build Issues:**
- Clear node_modules and reinstall
- Check TypeScript errors
- Verify all dependencies installed

## 📞 Support

For issues or questions:
1. Check Firebase/Telebirr documentation
2. Review browser console errors
3. Verify environment variables
4. Test with minimal configuration

---

**Happy coding! 🙏✨**





