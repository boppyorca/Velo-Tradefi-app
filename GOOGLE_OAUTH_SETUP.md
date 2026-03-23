# Supabase Google OAuth Setup

Hướng dẫn bật đăng nhập Google qua Supabase Auth.

## Bước 1 — Bật Google Provider trong Supabase

1. Mở [Supabase Dashboard](https://supabase.com/dashboard) → chọn project **VeloTradeFi**
2. Vào **Authentication** → **Providers** → click **Google**
3. Toggle **Enable Sign in with Google** → ON
4. Copy hai giá trị sau để điền ở Bước 2:
   - `Google Client ID`
   - `Google Client Secret`

## Bước 2 — Tạo OAuth Client trên Google Cloud Console

1. Mở [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project (hoặc tạo mới project "VeloTradeFi")
3. Vào **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. **Authorized redirect URIs** — thêm:
   ```
   https://shloeixwkwzyxwwzmkmh.supabase.co/auth/v1/callback
   ```
   (Thay `shloeixwkwzyxwwzmkmh` bằng project ref của bạn)
7. Click **Create** → copy **Client ID** và **Client Secret**

## Bước 3 — Điền thông tin vào Supabase Provider

Quay lại Supabase Dashboard → Authentication → Providers → Google:

| Trường | Giá trị |
|--------|---------|
| Google Client ID | `xxxxx.apps.googleusercontent.com` |
| Google Client Secret | `GOCSPX-xxxxxxxx` |

## Bước 4 — Cập nhật .env.local (Frontend)

```env
NEXT_PUBLIC_SUPABASE_URL=https://shloeixwkwzyxwwzmkmh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

(Frontend dùng Supabase client trực tiếp — không cần qua backend cho Google OAuth)

## Bước 5 — Redirect URI trong Google Cloud Console

Đảm bảo đã thêm đúng URI ở Bước 2. Nếu gặp lỗi `redirect_uri_mismatch`:
- Kiểm tra project ref trong Supabase URL
- Kiểm tra URI phải khớp **hoàn toàn** (không thừa/kém dấu `/`)

## Bước 6 — Test

1. Mở app → `/login`
2. Click **Continue with Google**
3. Chọn tài khoản Google
4. Sau khi đăng nhập thành công → redirect về `/dashboard`

## Xử lý lỗi thường gặp

### `provider is not enabled`
Google provider chưa bật trong Supabase → làm lại Bước 1.

### `redirect_uri_mismatch`
- Kiểm tra authorized redirect URI trong Google Cloud Console khớp với Supabase
- URI Supabase: `https://<project-ref>.supabase.co/auth/v1/callback`

### `Email not confirmed`
Trong Supabase Dashboard → Authentication → Email Auth → disable **Confirm email**
(hoặc xác nhận email thủ công trong Supabase → Users)

## Kiến trúc

```
Browser → /auth/callback (Next.js)
              ↓
        Supabase Auth (handles OAuth redirect)
              ↓
        /api/auth/set-cookies → set httpOnly cookies
              ↓
        /dashboard (protected route)
```
