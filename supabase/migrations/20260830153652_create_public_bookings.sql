/*
# Create public cinema booking records

1. New Tables
- `bookings`
- `id` (uuid, primary key): unique booking record identifier.
- `booking_reference` (text, unique): short customer-facing confirmation code.
- `movie_title` (text): title selected at checkout.
- `show_date` (text): formatted date shown to the customer.
- `show_time` (text): selected showtime.
- `cinema_name` (text): venue and screen shown on the ticket.
- `seats` (text[]): selected seat labels.
- `total_amount` (numeric): total ticket amount in pounds.
- `created_at` (timestamptz): record creation time.

2. Security
- Row level security is enabled on `bookings`.
- This first-release guest booking flow allows the public client to create and read its shared demo booking records without requiring sign-in.
- Separate policies are provided for select, insert, update, and delete operations.

3. Important Notes
- No payment card details or customer contact information are stored.
- The application uses this table to persist confirmed booking records after the seat confirmation step.
*/

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text NOT NULL UNIQUE,
  movie_title text NOT NULL,
  show_date text NOT NULL,
  show_time text NOT NULL,
  cinema_name text NOT NULL,
  seats text[] NOT NULL,
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view bookings" ON public.bookings;
CREATE POLICY "Public can view bookings"
  ON public.bookings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
CREATE POLICY "Public can create bookings"
  ON public.bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update bookings" ON public.bookings;
CREATE POLICY "Public can update bookings"
  ON public.bookings FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete bookings" ON public.bookings;
CREATE POLICY "Public can delete bookings"
  ON public.bookings FOR DELETE
  TO anon, authenticated
  USING (true);
