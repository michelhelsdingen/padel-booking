-- Create edit_codes table for one-time codes to edit registrations
CREATE TABLE edit_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_edit_codes_team_code ON edit_codes(team_id, code);
CREATE INDEX idx_edit_codes_expires_used ON edit_codes(expires_at, used);