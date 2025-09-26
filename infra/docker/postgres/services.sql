

-- Calendrical / liturgical facets
CREATE TYPE calendar_style AS ENUM (
    'new_gregorian',
    'old_julian');
CREATE TYPE office AS ENUM (
    'vespers',
    'compline',
    'midnight',
    'matins',
    'hours',
    'typika',
    'liturgy',
    'vesperal_liturgy');
CREATE TYPE period_tag AS ENUM (
  'menaion',
  'triodion_pre_lent',
  'triodion_great_lent',
  'holy_week',
  'pentecostarion_bright_week',
  'pentecostarion',
  'forefeast',
  'afterfeast',
  'apodosis',
  'synaxis',
  'fast_nativity',
  'fast_apostles',
  'fast_dormition',
  'octoechos_week'
);
CREATE TYPE source_book AS ENUM (
    'menaion',
    'octoechos',
    'triodion',
    'pentecostarion',
    'psalter',
    'other');
CREATE TYPE commemoration_type AS ENUM (
    'great_feast',
    'saint',
    'temple_dedication',
    'local',
    'other');
CREATE TYPE feast_rank AS ENUM (
  'great_feast',          -- Δεσποτικές/Θεομητορικές 12ορτες
  'vigil',                -- ἀγρυπνία
  'polyeleos',            -- πολυέλεος
  'great_doxology',       -- δοξολογία
  'six_stichera',         -- ἓξι στιχηρά
  'simple'                -- ἁπλή μνήμη Αγίου
);
CREATE TYPE fasting_level AS ENUM (
  'fast_free',
  'dairy_allowed',
  'fish_allowed',
  'wine_oil_allowed',
  'strict',
  'unknown'
);
CREATE TYPE hymn_type_key AS ENUM (
  'apolytikion',
  'kontakion',
  'exaposteilarion',
  'theotokion',
  'irmos',
  'megalynarion',
  'troparion',
  'oikos',
  'sedalion',
  'hypakoe',
  'exapostilarion_svetilen',
  'stavrotheotokion',
  'stichera_prosomoion',
  'stichera_idiomelon',
  'doxastikon',
  'katavasia',
  'prokeimenon',
  'alleluia',
  'communion_hymn',
  'antiphon1',
  'antiphon2',
  'antiphon3',
  'polyeleos',
  'anavathmoi',
  'evlogitaria',
  'exapsalmos'
);

-- Table to hold computed Pascha dates and related info
-- for use in determining other movable feasts
-- (Orthodox calculation using Julian calendar rules)
-- See https://en.wikipedia.org/wiki/Computus#Julian_calendar_and_Old_Calendar_Orthodox_Church
-- and https://aa.usno.navy.mil/faq/docs/JD_Formula.php
-- and https://aa.usno.navy.mil/faq/docs/Gregorian_and_Julian_Calendars.php
-- and https://www.assa.org.uk/orthodoxy/feasts/pascha.shtml
-- and https://github.com/OrthodoxWiki/OrthodoxWiki/blob/master/index.php?title=Pascha&oldid=151263
-- and https://orthodoxwiki.org/Pascha_Calculation_Algorithm
-- and https://orthodoxwiki.org/Pascha_Calculation_Algorithm#Sample_Implementation_in_Python
-- and https://orthodoxwiki.org/Pascha_Calculation_Algorithm#Implementation_in_SQL
CREATE TABLE IF NOT EXISTS pascha (
  year               integer PRIMARY KEY,
  pascha_julian      date NOT NULL,    -- nominal (Julian calendar) Y-M-D (stored as a date)
  pascha_gregorian   date NOT NULL,    -- civil (Gregorian/Revised Julian) date
  julian_to_greg_gap integer NOT NULL  -- computed difference in days for that year/date
);

-- 1) Meeus (Julian) → Julian month/day 
CREATE OR REPLACE FUNCTION orthodox_pascha_julian(y integer)
RETURNS date LANGUAGE plpgsql AS $$
DECLARE
  a int := y % 4;
  b int := y % 7;
  c int := y % 19;
  d int := (19*c + 15) % 30;
  e int := (2*a + 4*b - d + 34) % 7;
  m int := (d + e + 114) / 31;         -- 3=March, 4=April in the JULIAN calendar
  day int := ((d + e + 114) % 31) + 1;
BEGIN
  RETURN make_date(y, m, day);
END $$;

-- 2) Fliegel–van Flandern: JULIAN calendar date -> JDN
--    (USNO presents equivalent routines; this variant uses integer arithmetic)
CREATE OR REPLACE FUNCTION jdn_from_julian(y integer, m integer, d integer)
RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE
  a integer := (14 - m) / 12;
  y2 integer := y + 4800 - a;
  m2 integer := m + 12*a - 3;
  -- 32083 constant corresponds to JULIAN proleptic epoch
  jdn bigint := d + ((153*m2 + 2) / 5) + 365*y2 + (y2/4) - 32083;
BEGIN
  RETURN jdn;
END $$;

-- 3) Fliegel–van Flandern: JDN -> GREGORIAN calendar date
CREATE OR REPLACE FUNCTION gregorian_from_jdn(jdn bigint)
RETURNS date LANGUAGE plpgsql AS $$
DECLARE
  l bigint := jdn + 68569;
  n bigint := (4*l) / 146097;
  l2 bigint := l - (146097*n + 3) / 4;
  i bigint := (4000*(l2 + 1)) / 1461001;
  l3 bigint := l2 - (1461*i) / 4 + 31;
  j bigint := (80*l3) / 2447;
  d integer := l3 - (2447*j) / 80;
  l4 bigint := j / 11;
  m integer := j + 2 - 12*l4;
  y integer := 100*(n - 49) + i + l4;
BEGIN
  RETURN make_date(y, m, d);
END $$;

-- 4) Populate using JDN conversion (no heuristic gap)
CREATE OR REPLACE PROCEDURE populate_pascha(y_from integer, y_to integer)
LANGUAGE plpgsql AS $$
DECLARE
  y int; j date; g date; jdn bigint;
BEGIN
  FOR y IN y_from..y_to LOOP
    j := orthodox_pascha_julian(y);               -- Julian calendar Y-M-D
    jdn := jdn_from_julian(EXTRACT(YEAR FROM j)::int,
                           EXTRACT(MONTH FROM j)::int,
                           EXTRACT(DAY FROM j)::int);
    g := gregorian_from_jdn(jdn);                 -- Civil Gregorian/RJ date
    INSERT INTO pascha(year, pascha_julian, pascha_gregorian, julian_to_greg_gap)
    VALUES (
      y,
      j,
      g,
      (g - j)                                     -- integer day difference for that year/date
    )
    ON CONFLICT (year) DO UPDATE
      SET pascha_julian = EXCLUDED.pascha_julian,
          pascha_gregorian = EXCLUDED.pascha_gregorian,
          julian_to_greg_gap = EXCLUDED.julian_to_greg_gap;
  END LOOP;
END $$;

-- Example: fill a range
CALL populate_pascha(1900, 2199);

CREATE TABLE synaxarion_day (
  id                 bigserial PRIMARY KEY, -- surrogate PK for efficient referencing
  civil_date         date NOT NULL,
  calendar           calendar_style NOT NULL DEFAULT 'new_gregorian',
  day_of_week        smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  tone_of_week       smallint CHECK (tone_of_week BETWEEN 1 AND 8),
  period_tags        period_tag[] NOT NULL DEFAULT ARRAY[]::period_tag[],
  liturgical_season  text,
  fasting            fasting_level NOT NULL DEFAULT 'unknown',
  special_notes      text,
  UNIQUE (civil_date, calendar) -- Ensures logical uniqueness, supports natural queries
);

-- Index to optimize queries filtering by civil_date and calendar
CREATE INDEX idx_synaxarion_day_civil_calendar ON synaxarion_day (civil_date, calendar);


CREATE TABLE synaxarion_event (
  id                bigserial PRIMARY KEY,
  synaxarion_day_id bigint NOT NULL REFERENCES synaxarion_day(id) ON DELETE CASCADE,

  -- Who/what
  type              commemoration_type NOT NULL,
  name_gr           text NOT NULL,
  name_en           text,
  slug              text,
  event_account     text,       -- narrative of the saint's life or event's incidents

  -- Dating
  is_movable                    boolean NOT NULL DEFAULT false,
  movable_rule                  text,       -- e.g. 'P+50', 'SunAfter(09-14)' (see §3) 
  fixed_mday                    text,       -- 'MM-DD' if fixed
  relation_tag                  text,       -- 'forefeast_of','afterfeast_of','apodosis_of','synaxis_of'
  related_synaxarion_event      bigserial,  -- id this relates to

  -- Rank / size
  feast_rank        feast_rank NOT NULL DEFAULT 'simple',
  stichera_count    smallint,   -- e.g. 6
  canon_odes        smallint,   -- e.g. 6/9/12/15
  default_tone      smallint,   -- if the event has its own tone
  forefeast_days    smallint,       
  afterfeast_days   smallint,       
  apodosis_offset   smallint,       

  -- Text shortcuts (optional)
  apolytikion_ref   text,
  kontakion_ref     text,
  notes             text
);

CREATE INDEX ON synaxarion_event (synaxarion_day_id, is_primary);
CREATE INDEX ON synaxarion_event (fixed_mday);
CREATE INDEX ON synaxarion_event (name_gr);


-- Relationship table: which events happen on a given day
CREATE TABLE day_event_link (
  synaxarion_day_id bigint NOT NULL REFERENCES synaxarion_day(id) ON DELETE CASCADE,
  event_id          bigint NOT NULL REFERENCES synaxarion_event(id) ON DELETE RESTRICT,
  is_primary        boolean NOT NULL DEFAULT false,   -- 1–3 drive the service
  affects_vespers   boolean NOT NULL DEFAULT true,
  affects_matins    boolean NOT NULL DEFAULT true,
  affects_liturgy   boolean NOT NULL DEFAULT true,
  relation_tag      text,                             -- 'forefeast_of','afterfeast_of','apodosis_of','synaxis_of'
  related_event_id  bigint REFERENCES synaxarion_event(id),
  rank_override     feast_rank,
  stichera_override smallint,
  canon_odes_override smallint,
  notes             text,
  order_index       smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (synaxarion_day_id, event_id)
);

CREATE TABLE hymn_ref (
  id            bigserial PRIMARY KEY,
  uri           text NOT NULL,                     -- e.g., osis://..., tei://..., s3://...
  source_book   text NOT NULL,                     -- menaion|octoechos|triodion|pentecostarion|psalter|other
  type_key      hymn_type_key NOT NULL,
  tone          smallint,                          -- 1..8 if relevant
  lang          text NOT NULL DEFAULT 'el',
  label         text,                              -- human-friendly title
  meta          jsonb                              -- optional (odes, meter, author, etc.)
);

