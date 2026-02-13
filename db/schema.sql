create table if not exists users (
	id text primary key,
	email text,
	name text,
	avatar_url text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

create table if not exists decks (
	id uuid primary key,
	user_id text not null references users(id) on delete cascade,
	name text not null,
	target_bracket int,
	summary text,
	archidekt_link text,
	created_at timestamptz default now(),
	updated_at timestamptz default now(),
	unique (user_id, name)
);

create table if not exists games (
	id uuid primary key,
	user_id text not null references users(id) on delete cascade,
	deck_id uuid not null references decks(id) on delete cascade,
	winner int,
	fun int,
	p2_fun int,
	p3_fun int,
	p4_fun int,
	notes text,
	est_bracket int,
	created_at timestamptz default now()
);

create index if not exists idx_decks_user_id on decks(user_id);
create index if not exists idx_games_user_id on games(user_id);
create index if not exists idx_games_deck_id on games(deck_id);
