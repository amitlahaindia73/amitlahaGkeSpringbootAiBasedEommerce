DELETE FROM user_profile WHERE username = 'demo-user' AND email = 'demo@example.local' AND (external_auth_id IS NULL OR external_auth_id = '');
