-- ============================================
-- MEROFISE - ESQUEMA COMPLETO SUPABASE
-- ============================================

-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";

-- 2. TABLA: PROFILES (perfiles de usuarios)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text,
    phone text,
    user_type text check (user_type in ('propietario', 'comprador', 'agente')),
    avatar_url text,
    country text default 'ES',
    city text,
    is_vip boolean default false,
    vip_since timestamp with time zone,
    total_sales integer default 0,
    total_purchases integer default 0,
    rating decimal(2,1) default 5.0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABLA: PROPERTIES (propiedades)
create table if not exists public.properties (
    id uuid default uuid_generate_v4() primary key,
    owner_id uuid references public.profiles(id) on delete cascade not null,
    
    -- Información básica
    title text not null,
    type text not null check (type in ('piso', 'chalet', 'terreno', 'edificio', 'local', 'duplex', 'atico')),
    operation text not null check (operation in ('venta', 'alquiler', 'vacacional')),
    
    -- Precio y características
    price integer not null check (price > 0),
    size integer not null check (size > 0),
    rooms integer default 0,
    bathrooms integer default 0,
    floor text,
    elevator boolean default false,
    
    -- Ubicación (aproximada para público)
    location text not null,
    city text default 'Madrid',
    country text default 'ES',
    latitude decimal(10,8),
    longitude decimal(11,8),
    
    -- Características
    features text[] default '{}',
    description text,
    
    -- Datos privados (solo visibles tras pago)
    exact_address text,
    cadastral_ref text,
    year_built integer,
    condition text check (condition in ('nuevo', 'reformado', 'bueno', 'a_reformar')),
    
    -- Exclusiva
    exclusivity_accepted boolean default false,
    exclusivity_until timestamp with time zone,
    exclusivity_cancelled boolean default false,
    
    -- Estado
    status text default 'active' check (status in ('active', 'reserved', 'sold', 'rented', 'paused', 'cancelled')),
    
    -- Metadatos
    views_count integer default 0,
    offers_count integer default 0,
    featured boolean default false,
    
    -- Timestamps
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not
