
ALTER TABLE donations
ADD COLUMN link_token text;

-- Optional: For efficiency, create an index if you expect a lot of lookups
CREATE INDEX IF NOT EXISTS idx_donations_link_token ON donations(link_token);

