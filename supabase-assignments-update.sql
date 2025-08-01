-- Update assignments table to include email tracking and assignment method
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS assignmentMethod TEXT DEFAULT 'preference',
ADD COLUMN IF NOT EXISTS emailSent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS emailSentAt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS priority INTEGER;