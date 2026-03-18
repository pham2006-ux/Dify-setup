-- トラッキングURL履歴を保存するテーブルを作成します
CREATE TABLE url_history (
  id uuid default gen_random_uuid() primary key,
  company text not null,
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS（Row Level Security）を有効にしてデータを保護します
ALTER TABLE url_history ENABLE ROW LEVEL SECURITY;

-- 全員（サイト閲覧者など）が履歴を読み取れるようにする設定
CREATE POLICY "Allow anonymous read" ON url_history FOR SELECT USING (true);

-- 全員が新しい履歴を追加できるようにする設定
CREATE POLICY "Allow anonymous insert" ON url_history FOR INSERT WITH CHECK (true);

-- サイト上の「削除ボタン」を機能させるために削除を許可する設定
CREATE POLICY "Allow anonymous delete" ON url_history FOR DELETE USING (true);
