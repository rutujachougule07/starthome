# Firebase Architecture & Data Structure Documentation

This document provides a comprehensive analysis of the Firebase setup, Cloud Firestore database schema, real-time synchronization mechanisms, and authentication architecture implemented in the **StarHome CRM / Management Application**.

---

## 1. Firebase Configuration & Initialization

**Configuration File:** [`src/pages/firebase.tsx`](file:///c:/starthome-main/starthome-main/src/pages/firebase.tsx)

### Firebase App Credentials
- **Project ID:** `smart-d00eb`
- **Auth Domain:** `smart-d00eb.firebaseapp.com`
- **Storage Bucket:** `smart-d00eb.firebasestorage.app`
- **Messaging Sender ID:** `583380850367`
- **App ID:** `1:583380850367:web:1564395a75f7e5297e180a`
- **Measurement ID:** `G-MDB5X9V0DH`

### Initialized SDK Services
1. **Cloud Firestore (`db`)**: Main database storing all application entities.
2. **Firebase Auth (`auth`)**: User authentication service.
3. **Firebase Analytics**: Real-time app usage analytics with SSR safety check (`isSupported()`).

---

## 2. Synchronization & Data Architecture

**State Store File:** [`src/app/store.tsx`](file:///c:/starthome-main/starthome-main/src/app/store.tsx)

```
                       +-----------------------+
                       | Firebase Firestore DB |
                       +-----------+-----------+
                                   |
                  onSnapshot()     |     writeBatch() / setDoc()
               (Real-Time Sync)    v    (State Mutations)
                       +-----------+-----------+
                       |    React Store Context|
                       |    (StoreProvider)    |
                       +-----------+-----------+
                                   |
                                   v
                       +-----------+-----------+
                       | LocalStorage / Cache  |
                       +-----------------------+
```

### Key Architectural Patterns
- **Real-Time Subscriptions (`onSnapshot`)**: The app subscribes to 7 Firestore collections on mount (`users`, `products`, `customers`, `orders`, `tasks`, `notifications`, `leads`). Any change in Firestore immediately updates local React state across connected clients.
- **Batch Synchronization (`writeBatch`)**: State changes in the frontend calculate diffs (`syncCollection`) and flush additions, updates, and deletions in atomic batches to Firestore.
- **Offline & Fallback Storage (`localStorage` & `sessionStorage`)**:
  - `USER_STORAGE_KEY` (`sham_current_user_v2`): Maintains active user session across browser refreshes.
  - `STATE_CACHE_KEY` (`sham_full_state_cache_v2`): Local JSON cache allowing instant UI rendering while Firestore listener initializes.
- **Serial Number Sync (`sham_serials_*`)**: Automatically reconciles serial numbers from local storage to Firestore `products` documents using `setDoc` with `{ merge: true }`.
- **Database Seeding (`seedDatabase()`)**: Background check that automatically populates default collections if the `users` collection in Firestore is empty.

---

## 3. Authentication Flow

Authentication follows a 4-stage fallback pipeline in [`store.tsx`](file:///c:/starthome-main/starthome-main/src/app/store.tsx#L351-L471):

1. **Firebase Auth (`signInWithEmailAndPassword`)**: Primary check against Firebase Authentication service.
2. **Firestore User Search**: If Firebase Auth fails, queries synced `users` collection by `username`, `email`, `employeeId`, or `name`.
3. **Hardcoded Credential Fallback (`PASSWORDS` lookup)**: Default accounts (`admin@gmail.com`, `manager@gmail.com`, `employee@gmail.com`).
4. **Auto-Provisioning Fallback**: Automatically creates and saves a new user object if valid non-empty login input is provided.

---

## 4. Firestore Collection Schemas

The database consists of **7 primary collections**:

```
smart-d00eb (Firestore Database)
│
├── 📁 users
├── 📁 products
├── 📁 customers
├── 📁 orders
├── 📁 tasks
├── 📁 notifications
└── 📁 leads
```

---

### Collection 1: `users`
Stores user profile information, role-based permissions, and employee metadata.

| Field Name | Data Type | Required | Description / Possible Values |
|---|---|---|---|
| `id` | `string` | Yes | Unique Document ID / UID |
| `name` | `string` | Yes | Full name of the user |
| `username` | `string` | Yes | Unique login username or email |
| `role` | `string` | Yes | `"superadmin"` \| `"manager"` \| `"employee"` |
| `email` | `string` | Optional | User email address |
| `phone` | `string` | Optional | Contact phone number |
| `employeeId` | `string` | Optional | Unique corporate ID (e.g. `"MGR001"`) |
| `jobTitle` | `string` | Optional | Job title |
| `password` | `string` | Optional | Hashed or plain password string |
| `address` | `string` | Optional | Residential address |
| `status` | `string` | Optional | Account status (e.g., `"Verified"`) |
| `department` | `string` | Optional | Assigned department |
| `designation` | `string` | Optional | Work designation |
| `dateOfJoining` | `string` | Optional | Date user joined organization |
| `shift` | `string` | Optional | Work shift details |
| `emergencyContact` | `string` | Optional | Emergency contact number |
| `panNumber` | `string` | Optional | Government PAN identification |
| `aadharNumber` | `string` | Optional | Government Aadhar identification |
| `locationTracking` | `string` | Optional | Location tracking preference / status |
| `punchSetting` | `string` | Optional | Attendance punch configuration |
| `branchAccess` | `string` | Optional | Allowed store branches |

---

### Collection 2: `products`
Stores inventory items, stock levels, location tags, pricing, and serial numbers.

| Field Name | Data Type | Required | Description / Possible Values |
|---|---|---|---|
| `id` | `string` | Yes | Unique Product Document ID |
| `name` | `string` | Yes | Product name |
| `category` | `string` | Yes | Product category |
| `price` | `number` | Yes | Retail selling price |
| `stock` | `number` | Yes | Available quantity in stock |
| `status` | `string` | Yes | Status (e.g. `"In Stock"`, `"Out of Stock"`) |
| `sku` | `string` | Yes | Stock Keeping Unit identifier |
| `image` | `string` | Yes | Image URL |
| `qty` | `number` | Yes | Default batch quantity |
| `cost` | `number` | Yes | Unit cost price |
| `incentive` | `number` | Yes | Commission/incentive amount per unit |
| `supplier` | `string` | Yes | Supplier name |
| `date` | `string` | Yes | Product creation/added date |
| `warranty` | `string` | Optional | Warranty duration / details |
| `brand` | `string` | Optional | Manufacturer / Brand name |
| `location` | `string` | Optional | `"Shop"` \| `"Godown 1"` \| `"Godown 2"` \| `"Display"` |
| `assignedEmployeeId` | `string` | Optional | ID of employee handling item |
| `incentiveSeen` | `boolean` | Optional | Flag indicating if incentive was viewed |
| `serialNumbers` | `Array<string>` | Optional | List of unique unit serial numbers |

---

### Collection 3: `customers`
Stores customer records and contact details.

| Field Name | Data Type | Required | Description / Possible Values |
|---|---|---|---|
| `id` | `string` | Yes | Unique Customer Document ID |
| `name` | `string` | Yes | Customer full name |
| `email` | `string` | Yes | Customer email address |
| `phone` | `string` | Yes | Customer phone number |
| `address` | `string` | Yes | Delivery / Billing address |
| `status` | `string` | Yes | Customer status (e.g. `"Active"`) |

---

### Collection 4: `orders`
Stores transactions, sales orders, bill details, and fulfillment assignments.

| Field Name | Data Type | Required | Description / Possible Values |
|---|---|---|---|
| `id` | `string` | Yes | Unique Order Document ID |
| `customerId` | `string` | Yes | Associated Customer ID |
| `customerName` | `string` | Yes | Associated Customer Name |
| `productId` | `string` | Yes | Purchased Product ID |
| `productName` | `string` | Yes | Purchased Product Name |
| `qty` | `number` | Yes | Quantity purchased |
| `total` | `number` | Yes | Total transaction amount |
| `discount` | `number` | Optional | Applied discount amount |
| `createdBy` | `string` | Yes | Username/ID of creator |
| `status` | `string` | Yes | `"Pending"` \| `"Approved"` \| `"Rejected"` \| `"Delivered"` |
| `date` | `string` | Yes | Order creation date |
| `assignedTo` | `string` | Optional | Assigned employee ID |
| `assignedToName` | `string` | Optional | Assigned employee name |
| `sentToEmployee` | `boolean` | Optional | Fulfillment dispatch flag |
| `customerBargain` | `string` | Optional | Bargain / negotiated notes |
| `docType` | `string` | Optional | `"Bill"` \| `"Order Copy"` |
| `bookingExpiryDate` | `string` | Optional | Booking expiration timestamp |
| `isIncentive` | `boolean` | Optional | Incentive eligibility flag |
| `serialNumber` | `string` | Optional | Serial number of dispatched item |

---

### Collection 5: `tasks`
Stores work tasks assigned to staff with proof submission support.

| Field Name | Data Type | Required | Description / Possible Values |
|---|---|---|---|
| `id` | `string` | Yes | Unique Task Document ID |
| `title` | `string` | Yes | Task title / description |
| `assignedTo` | `string` | Yes | Assigned user ID |
| `assignedToName` | `string` | Yes | Assigned user name |
| `customerId` | `string` | Optional | Associated customer ID |
| `status` | `string` | Yes | `"Pending"` \| `"In Progress"` \| `"Completed"` |
| `date` | `string` | Yes | Creation date / deadline |
| `proofNote` | `string` | Optional | Completion note / proof summary |
| `proofUrl` | `string` | Optional | URL to proof image/document |

---

### Collection 6: `notifications`
Stores system and role-based notifications.

| Field Name | Data Type | Required | Description / Possible Values |
|---|---|---|---|
| `id` | `string` | Yes | Unique Notification Document ID |
| `to` | `string` | Yes | `"superadmin"` \| `"manager"` \| `"employee"` \| `"all"` |
| `from` | `string` | Yes | Sender username or system identifier |
| `message` | `string` | Yes | Notification text content |
| `date` | `string` | Yes | Notification timestamp |
| `read` | `boolean` | Yes | Read/unread status indicator |

---

### Collection 7: `leads`
Stores CRM sales lead pipelines, follow-ups, and customer acquisition records.

| Field Name | Data Type | Required | Description / Possible Values |
|---|---|---|---|
| `id` | `string` | Yes | Unique Lead Document ID |
| `name` | `string` | Yes | Lead contact name |
| `phone` | `string` | Yes | Lead phone number |
| `email` | `string` | Optional | Lead email address |
| `source` | `string` | Optional | Acquisition source (e.g. `"Website"`, `"Referral"`) |
| `product` | `string` | Optional | Interested product name |
| `brand` | `string` | Optional | Preferred brand |
| `gender` | `string` | Optional | `"Male"` \| `"Female"` \| `"Other"` |
| `status` | `string` | Yes | `"New"` \| `"Cold"` \| `"Warm"` \| `"Hot"` \| `"Enrolled"` \| `"Cancelled"` |
| `followUpDate` | `string` | Optional | Scheduled follow-up date |
| `notes` | `string` | Optional | Lead notes / requirements |
| `date` | `string` | Yes | Lead creation date |
| `assignedTo` | `string` | Optional | Assigned sales representative ID |
| `city` | `string` | Optional | City location |
| `address` | `string` | Optional | Full physical address |
| `createdBy` | `string` | Optional | Creator username/ID |

---

## 5. Security & Rule Recommendations

Currently, Cloud Firestore collections are synced directly via client-side SDK operations without enforced Security Rules in source control. For production deployment, the following Firestore Security Rules are recommended:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isSuperAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
    }

    // Collection Rules
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }
    
    match /products/{productId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    match /customers/{customerId} {
      allow read, write: if isAuthenticated();
    }
    
    match /orders/{orderId} {
      allow read, write: if isAuthenticated();
    }

    match /tasks/{taskId} {
      allow read, write: if isAuthenticated();
    }

    match /notifications/{notificationId} {
      allow read, write: if isAuthenticated();
    }

    match /leads/{leadId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

---

## 6. Summary of Key Files

- [`src/pages/firebase.tsx`](file:///c:/starthome-main/starthome-main/src/pages/firebase.tsx): Firebase App, Firestore, Auth, and Analytics initialization.
- [`src/app/store.tsx`](file:///c:/starthome-main/starthome-main/src/app/store.tsx): Core React Context provider handling real-time Firestore listeners, batch updates, offline local storage caching, seeding, and auth fallback.
- [`src/pages/SuperAdminPage.tsx`](file:///c:/starthome-main/starthome-main/src/pages/SuperAdminPage.tsx): Direct product and serial number Firestore updates via `setDoc`.
