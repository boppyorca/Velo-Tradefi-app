# Google OAuth Setup Checklist

## ✅ Bước 1: Google Cloud Console - OAuth Consent Screen

1. Vào **Google Cloud Console** → **APIs & Services** → **OAuth consent screen**
2. Chọn **External** (hoặc Internal nếu dùng Google Workspace)
3. Điền thông tin:
   - **App name**: `Velo Tradefi` (hoặc tên bạn muốn)
   - **User support email**: Email của bạn
   - **Developer contact information**: Email của bạn
4. Click **Save and Continue**
5. **Scopes**: Bỏ qua (hoặc thêm `email`, `profile`, `openid`)
6. **Test users**: Thêm email của bạn để test
7. **Publish**: Click **Publish App** (quan trọng!)

## ✅ Bước 2: Google Cloud Console - Credentials

1. Vào **APIs & Services** → **Credentials**
2. Click vào OAuth 2.0 Client ID **"TradeFi Velo"**
3. Trong **Authorized JavaScript origins**, thêm:
   ```
   http://localhost:3000
   https://shloeixwkwzyxwwzmkmh.supabase.co
   ```
   ⚠️ **LƯU Ý**: Chỉ thêm domain, KHÔNG có path, KHÔNG có dấu `/` cuối!

4. Trong **Authorized redirect URIs**, thêm:
   ```
   https://shloeixwkwzyxwwzmkmh.supabase.co/auth/v1/callback
   ```
   ⚠️ **LƯU Ý**: Copy chính xác, không có dấu `/` cuối!

5. Click **Save**

## ✅ Bước 3: Supabase Dashboard

1. Vào **Supabase Dashboard** → Project **velo**
2. **Authentication** → **Providers** → **Google**
3. Kiểm tra:
   - ✅ **Enable Sign in with Google**: ON
   - ✅ **Client IDs**: Đã paste Google Client ID
   - ✅ **Client Secret**: Đã paste Google Client Secret
   - ✅ **Callback URL**: `https://shloeixwkwzyxwwzmkmh.supabase.co/auth/v1/callback`
4. Click **Save**

## ✅ Bước 4: Test

1. Restart frontend: `cd frontend && npm run dev`
2. Truy cập: http://localhost:3000/login
3. Click **Continue with Google**
4. Nếu thành công → Redirect sang Google login page

## Kiểm tra Google đã **thật sự** bật trên server (quan trọng)

Giao diện Supabase có thể hiển thị toggle ON nhưng cấu hình chưa được lưu. Cách kiểm tra chắc chắn:

```bash
# Thay YOUR_ANON_KEY bằng Project Settings → API → anon public key
curl -sS \
  -H "apikey: YOUR_ANON_KEY" \
  "https://shloeixwkwzyxwwzmkmh.supabase.co/auth/v1/settings" \
  | python3 -m json.tool
```

Trong JSON, tìm `"external"`. Nếu **`"google": false`** thì Google **chưa bật** trên Auth server → lỗi `provider is not enabled` là đúng.

Khi đã bật và Save thành công, phải thấy **`"google": true`**.

## 🐛 Debug Checklist

Nếu vẫn lỗi, check:

- [ ] OAuth consent screen đã **Published** chưa?
- [ ] **Authorized JavaScript origins** có đúng format không? (chỉ domain, không có path)
- [ ] **Authorized redirect URIs** có đúng: `https://shloeixwkwzyxwwzmkmh.supabase.co/auth/v1/callback`?
- [ ] Google Client ID/Secret trong Supabase đã đúng chưa?
- [ ] Test user email đã được thêm vào OAuth consent screen chưa?
- [ ] Browser console có error gì không? (F12 → Console)

## 📝 Common Errors

### "provider is not enabled"
→ Check Supabase Dashboard → Authentication → Providers → Google → Enable = ON

### "redirect_uri_mismatch"
→ Check Google Cloud Console → Authorized redirect URIs có đúng URL không

### "Invalid origin"
→ Check Authorized JavaScript origins chỉ có domain, không có path

### "Access blocked: This app's request is invalid"
→ OAuth consent screen chưa được publish hoặc test user chưa được thêm
