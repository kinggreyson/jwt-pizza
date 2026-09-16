# Learning notes

## JWT Pizza code study and debugging

As part of `Deliverable ⓵ Development deployment: JWT Pizza`, start up the application and debug through the code until you understand how it works. During the learning process fill out the following required pieces of information in order to demonstrate that you have successfully completed the deliverable.

| User activity                                       | Frontend component | Backend endpoints | Database SQL |
| --------------------------------------------------- | ------------------ | ----------------- | ------------ |
| View home page<br/>                                     |  home.tsx                    |   none                |  none            | <br/>
| Register new user<br/>(t@jwt.com, pw: test)         |  register.tsx                  |  [post]/api/auth                 |  INSERT INTO user (name, email, password) VALUES (?, ?, ?) <br/> INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)           |
| Login new user<br/>(t@jwt.com, pw: test)            |  login.tsx                  |  PUT api/auth                 |              |
| Order pizza                                         |  Payment.tsx                    |  POST /api/order                 |              | 
| Verify pizza                                        |  delivery.jsx                  |  None                 | None             |
| View profile page                                   |  dinerDashboard.tsx                  |  [GET] /api/user/me                 |              |
| View franchise<br/>(as diner)                       |  franchiseDashboard.tsx                  |  [GET] /api/franchise/{userId}                 |              |
| Logout                                              |  logout.tsx                  | [DELETE] /api/auth                 |              |
| View About page                                     |  home.tsx                  |  none                 |  none            |
| View History page                                   |  history.tsx                  |  [GET] /api/order                |              |
| Login as franchisee<br/>(f@jwt.com, pw: franchisee) |                    |                   |              |
| View franchise<br/>(as franchisee)                  |  franchiseDashboard.tsx                  |  [GET] /api/franchise/{userId}                |              |
| Create a store                                      |  createStore.tsx                  |  [POST] /api/franchise/{id}/store                |              |
| Close a store                                       |                    |  [DELETE] /api/franchise/{id}/store              |  closeStore.tsx            |
| Login as admin<br/>(a@jwt.com, pw: admin)           |                    |                   |              |
| View Admin page                                     |  adminDashboard.tsx                  |  [GET] /api/franchise?                |              |
| Create a franchise for t@jwt.com                    |  createFranchise.tsx                  |  [POST] /api/franchise                 |              |
| Close the franchise for t@jwt.com                   |  closeFranchise.tsx                  |  [DELETE] /api/franchise/{id}                 |              |
