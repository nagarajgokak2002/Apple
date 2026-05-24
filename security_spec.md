# Security Spec for iPremium

## Data Invariants
1. A user can only read and write their own profile (except for admins).
2. Users can read all products, but only admins can modify them.
3. Users can create repair and sell orders, and read their own orders.
4. Admins can read and update all repair and sell orders.
5. Users cannot change their own `role` field.
6. The `nsakshu143@gmail.com` user is a hardcoded admin.

## The "Dirty Dozen" Payloads
1. Attempt to change another user's profile.
2. Attempt to promote self to `admin`.
3. Attempt to create a product as a non-admin.
4. Attempt to delete a product as a non-admin.
5. Attempt to read someone else's repair order.
6. Attempt to update the `status` of a repair order as a non-admin.
7. Attempt to update the `estimate` of a sell order as a non-admin.
8. Attempt to write a 1MB string as a product name.
9. Attempt to create a sale order with someone else's `userId`.
10. Attempt to read the entire `users` collection as a non-admin.
11. Attempt to update a product price without being an admin.
12. Attempt to bypass `role` checks by setting a custom claim.

## Test Runner (Conceptual)
The following tests verify that the above payloads return PERMISSION_DENIED.
- `test('non-admin cannot create product')`
- `test('user cannot update other user profile')`
- `test('user cannot change their role')`
- `test('unauthenticated user cannot see orders')`
