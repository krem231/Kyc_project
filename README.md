# Kyc_project
*Đầu tiên mở MongoDB bật connect r tạo db
- Kế tiếp cài thư viện be: npm install express mongoose bcryptjs jsonwebtoken cors joi
- Cài thư viện fe: npm install axios react-router-dom react-hook-form @hookform/resolvers yup
- Sau đó mở terminal bên be nhập cd .\Kyc_project\backend\ node server.js
- Mở thêm terminal bên fe nhập cd .\Kyc_project\frontend> npm start
- Khi tạo tài khoản thì vô db chỉnh role để chỉnh quyền admin hay user

Quan trong: 
be
- db.js: Xử lý kết nối đến MongoDB
- routes.js: Xử lý các chức năng như routes và logic cho đăng ký/ đăng nhập, các validation
- server.js: File chính để setup Express app, import db để connect, import routes để attach
fe
- Tất cả routes fe nằm trong file App.js (trong frontend/src/)
- components fe 
+ register.js form đăng ký vs validation yup gọi API POST /register, redirect /login nếu thành công
- css nằm trong App.css

vì giới hạn dung lượng của github nên phần transaction sẽ được đính kèm
link [https://drive.google.com/file/d/107lssRhxSEt7jZBwWnS3s5OmbHK5NZhj/view]
