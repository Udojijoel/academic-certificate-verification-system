-- Create admin activity logs table
CREATE TABLE public.admin_activity_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type TEXT NOT NULL,
    admin_address TEXT NOT NULL,
    target_address TEXT,
    target_id TEXT,
    details JSONB,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_admin_logs_created_at ON public.admin_activity_logs(created_at DESC);
CREATE INDEX idx_admin_logs_admin_address ON public.admin_activity_logs(admin_address);
CREATE INDEX idx_admin_logs_action_type ON public.admin_activity_logs(action_type);

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read logs (public transparency)
CREATE POLICY "Activity logs are publicly readable"
ON public.admin_activity_logs
FOR SELECT
USING (true);

-- Allow authenticated users to insert logs (will be called from frontend after blockchain tx)
CREATE POLICY "Anyone can insert activity logs"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (true);