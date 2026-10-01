-- V11.2: daily aggregate page views only; no visitor identifiers or personal data.
CREATE TABLE IF NOT EXISTS portfolio_page_views (
  view_date TEXT NOT NULL,
  page_path TEXT NOT NULL CHECK(page_path IN ('/','/en/')),
  views INTEGER NOT NULL DEFAULT 0 CHECK(views >= 0),
  PRIMARY KEY (view_date, page_path)
);
