/*
# Make bookings owner-scoped for user accounts

1. Changes to existing tables
- `public.bookings`: add `user_id uuid NOT NULL DEFAULT auth.uid()` referencing `auth.users(id)`.
  This ties each booking to the signed-in user who created it. The DEFAULT auth.uid()
  means the frontend insert can omit user_id and the row is still owned by the current session.

2. Security changes
- Drop the previous public (anon) CRUD policies on `public.bookings`.
- Add owner-scoped CRUD policies scoped TO authenticated, using auth.uid() = user_id for
  SELECT, INSERT (WITH CHECK), UPDATE (USING + WITH CHECK), and DELETE (USING).
- After this migration, only a signed-in user can create or read their own bookings;
  anonymous access is removed because the app now requires sign-in to book.

3. Important notes
- The existing demo booking rows were removed before this migration so the NOT NULL column
  could be added. No real user data existed in the table.
- No columns are dropped or renamed; the change is additive.
*/

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Public can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can delete bookings" ON public.bookings;

CREATE POLICY "select_own_bookings" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_bookings" ON public.bookings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
