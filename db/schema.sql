-- Schéma CBS BE BIG — à exécuter une seule fois dans l'éditeur SQL de Neon
-- (Neon Console → ton projet → SQL Editor → colle tout → Run)

create table if not exists products (
  id           text primary key,
  ref          integer,
  nom          text not null,
  cat          text,
  description  text default '',
  pv           numeric default 0,
  part         integer default 0,
  prix         integer default 0,
  ancien       integer default 0,
  actif        boolean default true,
  stock        integer default 0,
  ventes       integer default 0,
  note         numeric default 0,
  avis         integer default 0,
  tags         text[] default '{}',
  tone         integer default 0,
  has_img      boolean default false,
  updated_at   timestamptz default now()
);

create table if not exists product_photos (
  product_id text primary key references products(id) on delete cascade,
  data       text not null,
  updated_at timestamptz default now()
);

create table if not exists orders (
  id              text primary key,
  date            timestamptz default now(),
  client_nom      text,
  client_tel      text,
  client_ville    text,
  client_quartier text,
  client_email    text,
  livraison       integer default 0,
  total           integer default 0,
  paiement        text,
  statut          text default 'En attente'
);

create table if not exists order_lines (
  id         serial primary key,
  order_id   text references orders(id) on delete cascade,
  product_id text,
  nom        text,
  prix       integer,
  qte        integer
);

create table if not exists users (
  email      text primary key,
  nom        text,
  tel        text,
  pass_hash  text not null,
  cree       timestamptz default now()
);

create table if not exists commerciaux (
  id         text primary key,
  nom        text,
  zone       text,
  tel        text,
  ventes     integer default 0,
  recouvre   integer default 0,
  objectif   integer default 0,
  adherents  integer default 0
);

create table if not exists tontine_members (
  ordre    integer primary key,
  nom      text not null,
  prenoms  text default '',
  idp      text default '',
  tel      text default '',
  ville    text default '',
  statut   text default 'actif',
  paye     boolean default false,
  won      date,
  email    text
);

create table if not exists tontine_draws (
  numero integer primary key,
  date   timestamptz default now(),
  ids    integer[],
  noms   text[],
  gain   integer
);

create table if not exists tontine_versements (
  id       text primary key,
  date     timestamptz default now(),
  ordre    integer,
  idp      text,
  nom      text,
  montant  integer,
  mode     text,
  tirage   integer
);

create table if not exists tontine_demandes (
  id      text primary key,
  date    timestamptz default now(),
  nom     text,
  tel     text,
  ville   text,
  idp     text,
  email   text,
  statut  text default 'En attente'
);

create table if not exists tontine_state (
  id       boolean primary key default true check (id),
  prochain timestamptz,
  numero   integer default 1
);

create table if not exists notifs (
  id    text primary key,
  date  timestamptz default now(),
  txt   text not null
);

create table if not exists admin_settings (
  key   text primary key,
  value text
);

insert into tontine_state (id, numero) values (true, 1) on conflict (id) do nothing;
