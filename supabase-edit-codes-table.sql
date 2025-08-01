-- Create edit_codes table for one-time codes to edit registrations
CREATE TABLE edit_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teamId UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_edit_codes_team_code ON edit_codes(teamId, code);
CREATE INDEX idx_edit_codes_expires_used ON edit_codes(expiresAt, used);

-- Create trigger to update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_edit_codes_updated_at 
    BEFORE UPDATE ON edit_codes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();