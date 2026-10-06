-- 2台目のパスキー追加(kind='add')と Google ログインのため
-- challenges は使い捨ての一時データなので作り直す(kind の制約を広げる)
DROP TABLE IF EXISTS challenges;
CREATE TABLE challenges (
  challenge  TEXT PRIMARY KEY,
  kind       TEXT NOT NULL CHECK (kind IN ('register', 'login', 'add')),
  user_id    TEXT,                       -- register: 新規ユーザー id / add: 追加先のユーザー id
  user_name  TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_challenges_created ON challenges(created_at);

-- 外部のログイン(Google)とユーザーの紐付け。subject は Google の sub(変わらない ID)
CREATE TABLE identities (
  provider   TEXT NOT NULL,
  subject    TEXT NOT NULL,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email      TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (provider, subject)
);
CREATE INDEX idx_identities_user ON identities(user_id);

-- Google ログインの途中経過(state と nonce。10分で失効)
CREATE TABLE oauth_states (
  state      TEXT PRIMARY KEY,
  nonce      TEXT NOT NULL,
  link_user  TEXT,                       -- ログイン中に「Google を紐付け」したときのユーザー id
  created_at INTEGER NOT NULL
);
