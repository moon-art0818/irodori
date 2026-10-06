-- irodori 初期スキーマ。時刻はすべて epoch ミリ秒

CREATE TABLE users (
  id         TEXT PRIMARY KEY,           -- WebAuthn user handle(base64url 16byte)
  name       TEXT NOT NULL,              -- 表示名(一意でなくてよい)
  created_at INTEGER NOT NULL
);

CREATE TABLE credentials (
  id          TEXT PRIMARY KEY,          -- credential id(base64url)
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key  TEXT NOT NULL,             -- COSE 公開鍵(base64url)
  counter     INTEGER NOT NULL DEFAULT 0,
  transports  TEXT,                      -- JSON 配列
  device_type TEXT,
  backed_up   INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_credentials_user ON credentials(user_id);

-- 登録・ログインの challenge(使い捨て。5分で失効)
CREATE TABLE challenges (
  challenge  TEXT PRIMARY KEY,           -- base64url
  kind       TEXT NOT NULL CHECK (kind IN ('register', 'login')),
  user_id    TEXT,                       -- register のとき新規ユーザーの id
  user_name  TEXT,                       -- register のとき表示名
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_challenges_created ON challenges(created_at);

-- sid は SHA-256(hex) だけ保存する(DB が漏れても Cookie を再現できない)
CREATE TABLE sessions (
  sid_hash   TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

CREATE TABLE docs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  width       INTEGER NOT NULL,
  height      INTEGER NOT NULL,
  page_count  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  share_id    TEXT UNIQUE,               -- 共有オフのとき NULL
  bytes       INTEGER NOT NULL,          -- R2 の doc JSON のバイト数
  thumb_bytes INTEGER NOT NULL DEFAULT 0 -- R2 のサムネのバイト数(無ければ 0)
);
CREATE INDEX idx_docs_user_updated ON docs(user_id, updated_at DESC);

CREATE TABLE assets (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mime       TEXT NOT NULL,
  size       INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_assets_user ON assets(user_id);

-- doc が参照している asset(共有閲覧時の画像アクセス許可に使う)
CREATE TABLE doc_assets (
  doc_id   TEXT NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  PRIMARY KEY (doc_id, asset_id)
);
CREATE INDEX idx_doc_assets_asset ON doc_assets(asset_id);
