-- Archipiélago Production - Supabase Database Schema
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Chat Rooms Table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'team', -- 'team', 'project', 'area'
  area TEXT, -- Match TaskArea type: 'Guión', 'Técnico', etc.
  created_by TEXT NOT NULL, -- User email
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  mentions TEXT[], -- Array of mentioned user emails
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of file objects
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  is_edited BOOLEAN DEFAULT FALSE
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL, -- Who receives the notification
  type TEXT NOT NULL, -- 'task_assigned', 'task_completed', 'mention', 'gate_approved', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT, -- Where to navigate when clicked
  related_id TEXT, -- Task ID, Gate ID, Message ID, etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- File Attachments Table (metadata for Drive files)
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drive_file_id TEXT NOT NULL UNIQUE, -- Google Drive file ID
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT,
  drive_url TEXT NOT NULL, -- Direct link to file in Drive
  thumbnail_url TEXT,
  uploaded_by TEXT NOT NULL, -- User email
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  related_type TEXT NOT NULL, -- 'task', 'gate', 'message'
  related_id TEXT NOT NULL, -- Task/Gate/Message ID
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_room ON messages(chat_room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_email);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_email, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_attachments_related ON file_attachments(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_active ON chat_rooms(is_active) WHERE is_active = TRUE;

-- Enable Row Level Security (RLS)
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all authenticated users for now - refine later)
-- Chat Rooms: Everyone can read, only creators can delete
CREATE POLICY "Anyone can view chat rooms" ON chat_rooms
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Authenticated users can create chat rooms" ON chat_rooms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Creators can update their chat rooms" ON chat_rooms
  FOR UPDATE USING (auth.jwt() ->> 'email' = created_by);

-- Messages: Everyone can read, authenticated users can send
CREATE POLICY "Anyone can view messages" ON messages
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Senders can update their messages" ON messages
  FOR UPDATE USING (auth.jwt() ->> 'email' = sender_email);

-- Notifications: Users can only see their own
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

-- File Attachments: Everyone can view, uploader can delete
CREATE POLICY "Anyone can view file attachments" ON file_attachments
  FOR SELECT USING (is_deleted = FALSE);

CREATE POLICY "Authenticated users can upload files" ON file_attachments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Uploaders can delete their files" ON file_attachments
  FOR UPDATE USING (auth.jwt() ->> 'email' = uploaded_by);

-- Functions for real-time updates
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create default chat rooms
INSERT INTO chat_rooms (name, description, type, created_by) VALUES
  ('General', 'Canal general para todo el equipo', 'team', 'system'),
  ('Producción', 'Discusiones sobre producción', 'team', 'system'),
  ('Post-producción', 'Temas de post-producción', 'team', 'system'),
  ('Técnico', 'Soporte técnico y herramientas', 'team', 'system')
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '✅ Default chat rooms added';
  RAISE NOTICE '✅ Row Level Security enabled';
END $$;
