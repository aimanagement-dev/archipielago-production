# 🚀 Archipiélago Production - Setup Guide

This guide will help you set up the new features: **Chat**, **Notifications**, and **File Uploads**.

---

## ✅ Prerequisites

1. **Supabase Account** - https://supabase.com (Free tier is fine!)
2. **Google OAuth** - Already configured ✓
3. **Vercel Account** - For deployment

---

## 📋 Step-by-Step Setup

### **Step 1: Create Supabase Project** (5 minutes)

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: `archipielago-production`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait ~2 minutes for initialization

---

### **Step 2: Get Supabase Credentials** (2 minutes)

1. In your Supabase project, go to **Settings → API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJhbG...`)
3. Keep them handy for Step 4!

---

### **Step 3: Run Database Schema** (2 minutes)

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click "New query"
3. Open the file `/supabase/schema.sql` in this project
4. **Copy the entire contents** and paste into SQL Editor
5. Click "Run" or press Ctrl+Enter
6. You should see: "Success. No rows returned"
7. ✅ Done! Your database is ready with:
   - Chat rooms
   - Messages
   - Notifications
   - File attachments

---

### **Step 4: Add Environment Variables** (3 minutes)

#### **For Local Development:**

Create a `.env.local` file in the root directory:

```bash
# Copy from .env.production.example and add your values:
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY-HERE
```

#### **For Vercel Production:**

1. Go to your Vercel project
2. **Settings → Environment Variables**
3. Add these two variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your anon key
4. Click "Save"

---

### **Step 5: Test Locally** (Optional)

```bash
npm install          # Install new dependencies
npm run dev          # Start dev server
```

Visit http://localhost:3000 and:
- Click the **chat bubble** (bottom right) → Should open chat sidebar
- Click the **bell icon** (top right) → Should show notifications
- Create a task and try uploading a file

---

### **Step 6: Deploy to Vercel**

```bash
git add .
git commit -m "feat: Add chat, notifications, and file uploads"
git push
```

Vercel will auto-deploy! 🎉

---

## 🎯 What You Get

### **1. Team Chat Rooms** 💬
- **Pre-created rooms**: General, Producción, Post-producción, Técnico
- Real-time messaging
- Message history
- @mentions (coming soon with notification integration)
- File sharing in chat

**Access**: Click the floating chat bubble (bottom right)

---

### **2. In-App Notifications** 🔔
- Real-time alerts
- Task assignments
- Task completions
- @mentions in chat
- Gate approvals/rejections

**Access**: Click the bell icon (top right in header)

---

### **3. File Uploads** 📎
- Upload files to Google Drive
- Attach to tasks, gates, or messages
- File metadata stored in Supabase
- Preview thumbnails
- Download/delete files

**Access**: Available in task modals and chat

---

## 🔧 Configuration Details

### **Database Tables Created:**

1. **chat_rooms** - Team chat channels
2. **messages** - All chat messages with real-time sync
3. **notifications** - User notification queue
4. **file_attachments** - Metadata for Drive files

### **API Routes Added:**

- `POST /api/chat/rooms` - Create chat room
- `GET /api/chat/messages` - Fetch messages
- `POST /api/chat/messages` - Send message
- `GET /api/notifications` - Fetch notifications
- `PUT /api/notifications` - Mark as read
- `POST /api/files` - Upload file
- `GET /api/files` - Get attachments
- `DELETE /api/files` - Delete file

---

## 🐛 Troubleshooting

### **Chat not working?**
- ✅ Check Supabase URL and anon key are correct
- ✅ Verify database schema was run successfully
- ✅ Check browser console for errors

### **Notifications not appearing?**
- ✅ Make sure you're logged in
- ✅ Try triggering a notification (assign a task)
- ✅ Check Supabase Realtime is enabled (it is by default)

### **File uploads failing?**
- ✅ Ensure you're using Google OAuth (required for Drive access)
- ✅ Check that Drive API is enabled in Google Cloud Console
- ✅ Verify file size is under Google's limits

### **Real-time not updating?**
- ✅ Check Supabase project is active (not paused)
- ✅ Verify Row Level Security policies are set (they are in schema)
- ✅ Refresh the page

---

## 🎨 Customization

### **Add More Chat Rooms:**

```sql
INSERT INTO chat_rooms (name, description, type, created_by) VALUES
  ('Marketing', 'Marketing discussions', 'team', 'system');
```

Run in Supabase SQL Editor.

### **Add Custom Notification Types:**

Edit `/lib/types.ts` and add to `NotificationType`:

```typescript
export type NotificationType =
  | 'task_assigned'
  | 'your_custom_type'  // Add here
  | ...
```

Then use in code:
```typescript
await NotificationService.createNotification(
  userEmail,
  'your_custom_type',
  'Title',
  'Message'
);
```

---

## 📊 Database Management

### **View Data:**
- Supabase Dashboard → **Table Editor**
- See all messages, notifications, files in real-time

### **Backup:**
- Supabase handles automatic backups (daily)
- Manual backup: **Database → Backups**

### **Reset Database:**
```sql
TRUNCATE messages, notifications, file_attachments CASCADE;
```
⚠️ This deletes all data! Use carefully.

---

## 🔐 Security

✅ **Row Level Security (RLS)** enabled on all tables
✅ **NextAuth** session validation on all API routes
✅ **User-specific notifications** (users only see their own)
✅ **Google Drive** permissions managed by OAuth

---

## 📚 Next Steps

Want to extend further?

1. **Add Direct Messages** - Create DM chat rooms
2. **Email Notifications** - Integrate Resend/SendGrid
3. **Push Notifications** - Add Firebase Cloud Messaging
4. **Message Search** - Add full-text search
5. **File Preview** - Show images/PDFs inline
6. **Voice Messages** - Record and attach audio

---

## 🆘 Support

If you encounter issues:

1. Check browser console for errors
2. Check Supabase logs: Dashboard → Logs
3. Verify all environment variables are set
4. Try clearing browser cache and hard refresh

---

## ✨ That's It!

You now have a fully functional production management system with:
- ✅ Real-time team chat
- ✅ In-app notifications
- ✅ Google Drive file uploads
- ✅ Task management (existing)
- ✅ AI assistant (existing)
- ✅ Calendar sync (existing)

**Enjoy!** 🎉
