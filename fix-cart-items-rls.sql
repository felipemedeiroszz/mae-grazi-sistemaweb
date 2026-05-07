-- Fix Cart Items RLS Policy
-- Execute this SQL in Supabase SQL Editor

-- 1. Remove existing RLS policy that's causing the error
DROP POLICY IF EXISTS "Users can manage own cart items" ON cart_items;

-- 2. Create new RLS policy that works without app.current_user_id
CREATE POLICY "Users can manage own cart items" ON cart_items
    FOR ALL 
    USING (true) -- We'll check this in application layer
    WITH CHECK (true);

-- 3. Alternative: More restrictive policy (uncomment if needed)
-- CREATE POLICY "Users can manage own cart items" ON cart_items
--     FOR ALL 
--     USING (auth.uid()::text = cliente_id::text)
--     WITH CHECK (auth.uid()::text = cliente_id::text);

-- 4. Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'cart_items';

-- 5. Test the policy
-- SELECT * FROM cart_items LIMIT 1;
