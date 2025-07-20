# 🚨 Resend SMTP Not Working - Common Issues

## ❌ Issue: Switched to Resend SMTP but still no emails

Even with Resend, there are several configuration requirements that might be missing.

---

## 🔍 **Most Common Resend Issues**

### **1. Domain Verification Required** ⚠️
**Resend requires domain verification before sending emails**

**Check if your domain is verified:**
1. Go to https://resend.com/domains
2. Look for `eigotankentai.com` in your domains list
3. **If not verified** → You can't send from `noreply@eigotankentai.com`

**Solutions:**
- **Option A**: Verify `eigotankentai.com` domain (requires DNS records)
- **Option B**: Use Resend's sandbox domain temporarily: `onboarding@resend.dev`

### **2. Wrong SMTP Settings** 🔧
**Double-check your Supabase SMTP configuration:**

**Correct Resend SMTP Settings:**
- Host: `smtp.resend.com`
- Port: `587`
- Username: `resend`
- Password: `re_9dYSBUup_372aqzc7KUiUmMLrimP9w8gE`
- Sender Name: `EigoTankentai`
- **Sender Email**: This is critical! ⬇️

### **3. Sender Email Domain Issue** 📧
**If your domain isn't verified:**
- ❌ Don't use: `noreply@eigotankentai.com`
- ✅ Use: `onboarding@resend.dev` (Resend's verified domain)

**If your domain is verified:**
- ✅ Use: `noreply@eigotankentai.com`

---

## 🧪 **Quick Test Steps**

### **Step 1: Check Domain Status**
1. Visit: https://resend.com/domains
2. Is `eigotankentai.com` listed and verified?

### **Step 2A: If Domain NOT Verified**
**Update Supabase SMTP settings:**
- Sender Email: `onboarding@resend.dev`
- Keep all other settings the same

### **Step 2B: If Domain IS Verified**
**Your current settings should work**
- Sender Email: `noreply@eigotankentai.com`

### **Step 3: Test Again**
- Run the advanced SMTP test
- Or try creating a new account

---

## 🎯 **Most Likely Solution**

**Domain verification is probably missing.** 

**Quick Fix:**
1. **Change Sender Email in Supabase to**: `onboarding@resend.dev`
2. **Test immediately** - should work right away
3. **Later**: Verify your domain if you want to use your own email

---

## 🔧 **Alternative: Use Gmail SMTP**

If Resend is still problematic, Gmail SMTP is very reliable:

**Gmail SMTP Settings:**
- Host: `smtp.gmail.com`
- Port: `587`
- Username: `your-gmail@gmail.com`
- Password: `your-app-password` (not regular password!)
- Sender: `your-gmail@gmail.com`

**To get Gmail App Password:**
1. Enable 2-factor authentication on Gmail
2. Go to Google Account settings
3. Generate an "App Password" for email
4. Use that 16-character password

---

## ✅ **Action Plan**

1. **Check Resend domain verification status**
2. **If not verified**: Change sender to `onboarding@resend.dev`
3. **Test with advanced SMTP tool**
4. **If still fails**: Switch to Gmail SMTP
5. **Once working**: Verify domain for custom email

**The domain verification is almost certainly the issue!** 🎯
