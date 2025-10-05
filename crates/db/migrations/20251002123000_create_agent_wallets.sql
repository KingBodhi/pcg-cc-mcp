PRAGMA foreign_keys = ON;

CREATE TABLE agent_wallets (
    id           BLOB PRIMARY KEY,
    profile_key  TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL DEFAULT '',
    budget_limit INTEGER NOT NULL DEFAULT 0,
    spent_amount INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

CREATE TABLE agent_wallet_transactions (
    id          BLOB PRIMARY KEY,
    wallet_id   BLOB NOT NULL,
    direction   TEXT NOT NULL CHECK(direction IN ('debit','credit')),
    amount      INTEGER NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    metadata    TEXT,
    task_id     BLOB,
    process_id  BLOB,
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (wallet_id) REFERENCES agent_wallets(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_wallet_transactions_wallet ON agent_wallet_transactions(wallet_id);
CREATE INDEX idx_agent_wallet_transactions_created ON agent_wallet_transactions(created_at);
