const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://jbiqapjvgrunqxybgzou.supabase.co',
  process.env.SUPABASE_SERVICE_KEY // Use service key in backend only!
);

// Example: Fetch all announcements
const { data, error } = await supabase.from('announcements').select('*');
